var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var path = require('path');
var request = require('request');
var async = require('async');
var PythonShell = require('python-shell');

app.use(bodyParser.json());

/*
 * MySQL Set-up
 */
var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '$endiksScale',
    database: 'forex'
});

/*
 * Interval Variables
 */

 var watchers = null;

/*
* API Set-up
*/

var domain = 'https://api-fxpractice.oanda.com';
var access_token = '13d85815857b2114bc46b5ca2b9f415f-39f6af6d03fc815c719aac47f33e677f';
var account_id = '4489830';

var headers = { 
    "Authorization": "Bearer "+access_token,
};

/*
* Routes
*/

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/learn', function(req, res) {
  res.sendFile(path.join(__dirname + '/learning.html'));
});

app.get('/watchers', function(req, res) {

    connection.query('SELECT * FROM watchers', function(err, rows, fields) {

        if (err == null) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify({ watchers: rows }));
            res.end();
        } else {
            console.log(err);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify({ error: err }));
            res.end();
        }

    });

});

app.post('/save/watcher', function(req, res) {

    var watcher = req.body.watcher;
    var query = "";

    if (watcher.id == null || watcher.id == 0) {
    	query = "INSERT INTO watchers (instrument,granularity,last_updated,run_interval,run_unit,active,score_threshold,candle_count) VALUES ('"+watcher.instrument+"','"+watcher.granularity+"',NOW(),"+watcher.run_interval+",'"+watcher.run_unit+"',"+watcher.active+","+watcher.score_threshold+","+watcher.candle_count+")";
    }else{
    	query = "UPDATE watchers "+
				"SET instrument='"+watcher.instrument+ 
				"', granularity='"+watcher.granularity+
				"', last_updated=NOW()"+
				", run_interval="+watcher.run_interval+
				", run_unit='"+watcher.run_unit+
				"', active="+watcher.active+
				", score_threshold="+watcher.score_threshold+
				", candle_count="+watcher.candle_count+
				", last_predicted_price="+watcher.last_predicted_price+
				" WHERE watcher_id="+watcher.id;

    }

    connection.query(query, function(err, rows, fields) {
        if (err == null) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify({ success: true }));
            res.end();
        } else {
            console.log(err);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify({ success: false }));
            res.end();
        }
    });

});

app.post('/test', function(req, res) {

    var url = domain+'/v1/candles?instrument='+req.body.instrument+
                                '&granularity='+req.body.granularity+
                                '&count='+req.body.candle_count;

    request(url, function(err, response, body) {

        if (err == null) {

            //Get candles for the watcher
            var candles = JSON.parse(body);
            candles = candles.candles; //Discard other info

            //Filter candle which is not completed if it exists
            		candles = candles.filter(function(c){
            			return c.complete == true;
            		});

            //Trim down data to just ask prices for now, start out simple.
            candles = candles.map(function(c){
                return [c.openBid,c.highBid,c.lowBid,c.closeBid];
            });

            var pyshell = new PythonShell('/python/bot_test.py', { mode: 'json' });

            pyshell.send(candles);
            pyshell.send(parseFloat(req.body.train_percent));
            pyshell.send(parseInt(req.body.n));
            pyshell.send(parseInt(req.body.y_value));

            pyshell.on('message', function(message) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.write(JSON.stringify({ message: message }));
                res.end();
            });

            pyshell.end(function(err) {
                if (err) throw err;
            });

        } else {
            console.log(err);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify({ success: false }));
            res.end();
        }

    });

});

app.get('/scores', function(req, res) {

	var watcher_id = req.query.watcher_id; 

    connection.query('SELECT * FROM watcher_scores WHERE watcher_id = '+watcher_id, function(err, rows, fields) {

        if (err == null) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify({ scores: rows }));
            res.end();
        } else {
            console.log(err);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify({ error: err }));
            res.end();
        }

    });

});

setInterval(function() {

	//Get watchers that need to run
	connection.query("SELECT * " + 
						"FROM watchers " +
						"WHERE " + 
							"CASE WHEN run_unit = 'MINUTE' THEN last_updated < NOW() - INTERVAL run_interval MINUTE " +
						    "WHEN run_unit = 'HOUR' THEN last_updated < NOW() - INTERVAL run_interval HOUR " +
							"WHEN run_unit = 'DAY' THEN last_updated < NOW() - INTERVAL run_interval DAY " +
						    "WHEN run_unit = 'WEEK' THEN last_updated < NOW() - INTERVAL run_interval WEEK " +
						    "WHEN run_unit = 'MONTH' THEN last_updated < NOW() - INTERVAL run_interval MONTH END " +
					    "AND active = 1", function(err, rows, fields) {

        if (err == null) {

            watchers = rows;

            for(var i=0; i<watchers.length; i++) {

            	var w = watchers[i];
            	
            	//Map the watcher to a proper URL for candles in order to pass into the async function
            	watchers[i].url = domain+'/v1/candles?instrument='+w.instrument+
            					'&granularity='+w.granularity+
            					'&count='+w.candle_count;          	            
            }

            async.map(watchers, function(watcher, callback) {
            	request(watcher.url, function(error, response, body) {

            		//Get candles for the watcher
            		var candles = JSON.parse(body);
            		candles = candles.candles; //Discard other info

            		//Filter candle which is not completed if it exists
            		candles = candles.filter(function(c){
            			return c.complete == true;
            		});

            		//Trim down data to just bid prices for now, start out simple.
            		candles = candles.map(function(c){
            			return [c.openBid,c.highBid,c.lowBid,c.closeBid];
            		});

            		//Pass the data into our python script
            		var pyshell = new PythonShell('/python/bot.py', { mode: 'json' });

            		pyshell.send(candles);
            		pyshell.send(watcher.score_threshold);

            		pyshell.on('message', function(message) {

                        //Do something with the scores here
            			if(message!=0){ // Threshold has been met

            				watcher.last_predicted_price = message;

            				query = "UPDATE watchers "+
									"SET last_updated=NOW()"+
									", last_predicted_price="+watcher.last_predicted_price.toFixed(5)+
									" WHERE id="+watcher.id;

							connection.query(query, function(err, rows, fields) {
						        if (err == null) {

						        } else {
						            console.log(err);
						        }
    						});
                            
                        }

            		});

            		pyshell.end(function(err) {
            			if (err) throw err;
            		});

            	});  
            });

        } else {
            console.log(err);
        }

    });

}, 10000);

app.use(express.static('public'));

app.listen(3000, function () {
  console.log('Listening on port 3000');
});
