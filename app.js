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
 var writing = false;

/*
* API Set-up
*/

var domain = 'https://api-fxpractice.oanda.com';
var access_token = '13d85815857b2114bc46b5ca2b9f415f-39f6af6d03fc815c719aac47f33e677f';
var account_id = '4489830';

var headers = { 
    "Authorization": "Bearer "+access_token,
};

var postHeaders = {
    "Authorization": "Bearer "+access_token,
    "Content-Type": "application/x-www-form-urlencoded" 
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
                                '&count='+req.body.candle_count+
                                '&candleFormat=midpoint';

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
                return [c.openMid,c.highMid,c.lowMid,c.closeMid];
            });

            var pyshell = new PythonShell('/python/bot_test.py', { mode: 'json' });

            pyshell.send(candles);
            pyshell.send(parseFloat(req.body.train_percent));
            pyshell.send(parseInt(req.body.n));

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

    if(new Date().getSeconds() != 5) {
        return;
    }

	//Get watchers that need to run
	connection.query("SELECT * " + 
						"FROM watchers " +
						"WHERE " + 
							"CASE WHEN run_unit = 'MINUTE' THEN DATE_FORMAT(last_updated,'%Y-%m-%d %H:%i') < DATE_FORMAT(NOW() - INTERVAL run_interval MINUTE,'%Y-%m-%d %H:%i') " +
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
            					'&count='+w.candle_count+
                                '&candleFormat=midpoint';          	            
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

                    var last_time = candles[candles.length-1].time;

            		//Trim down data to just bid prices for now, start out simple.
            		candles = candles.map(function(c){
            			return [c.openMid,c.highMid,c.lowMid,c.closeMid];
            		});

                    var server_time = new Date(last_time);
                    var watcher_time = new Date(watcher.last_updated);

                    var lastHigh = parseFloat(candles[candles.length-1][1]);
                    var lastLow = parseFloat(candles[candles.length-1][2]);
                    var lastClose = parseFloat(candles[candles.length-1][3]);

                    if(watcher_time.getTime() < server_time.getTime()) {

                        //Pass the data into our python script
                        var pyshell = new PythonShell('/python/bot.py', { mode: 'json' });

                        pyshell.send(candles);

                        pyshell.on('message', function(message) {

                            //Get the current prices for the instrument

                            request({url:domain+"/v1/prices?instruments="+watcher.instrument, headers: headers}, function(error, response, body){

                                //Get the price details for the requested instrument
                                var price = JSON.parse(body);

                                var currentBid = 0;
                                var currentAsk = 0;

                                currentBid = parseFloat(price.prices[0].bid);
                                currentAsk = parseFloat(price.prices[0].ask);

                                spread = ((currentAsk-currentBid)/2).toFixed(5);

                                var guessHigh = parseFloat(message[0]).toFixed(5);
                                var guessLow = parseFloat(message[1]).toFixed(5);
                                var guessClose = parseFloat(message[2]).toFixed(5);

                                if((guessHigh-currentAsk-spread).toFixed(5)>0||(guessClose-currentAsk-spread).toFixed(5)>0){
                                    console.log("");
                                    console.log(watcher.instrument);
                                    console.log("The current ask price is "+ currentAsk + ", while the predicted high value is " + guessHigh + " and close value is " + guessClose);
                                    if((guessHigh-currentAsk-spread).toFixed(5)>0){
                                        console.log("Based on the spread of " + spread + " pips, money bot predicts you will gain " + (guessHigh-currentAsk-spread).toFixed(5).toString() + " pips based on the predicted high value if you buy.");
                                        //placeOrder(watcher.instrument, 100, 'buy', guessHigh, 0);
                                    }
                                    if((guessClose-currentAsk-spread).toFixed(5)>0){
                                        console.log("Based on the spread of " + spread + " pips, money bot predicts you will gain " + (guessClose-currentAsk-spread).toFixed(5).toString() + " pips based on the predicted close value if you buy.");
                                        placeOrder(watcher.instrument, 2000, 'buy', guessClose, 0);
                                    }
                                }

                                if((currentBid-guessLow-spread).toFixed(5)>0||(currentBid-guessClose-spread).toFixed(5)>0){
                                    console.log("");
                                    console.log(watcher.instrument);
                                    console.log("The current bid price is "+ currentBid + ", while the predicted low value is " + guessLow + " and close value is " + guessClose);
                                    if((currentBid-guessLow-spread).toFixed(5)>0){
                                        console.log("Based on the spread of " + spread + " pips, money bot predicts you will gain " + (currentBid-guessLow-spread).toFixed(5).toString() + " pips based on the predicted low value if you short.");
                                        //placeOrder(watcher.instrument, 1000, 'sell', guessLow, 0);
                                    }
                                    if((currentBid-guessClose-spread).toFixed(5)>0){
                                        console.log("Based on the spread of " + spread + " pips, money bot predicts you will gain " + (currentBid-guessClose-spread).toFixed(5).toString() + " pips based on the predicted close value if you short.");
                                        placeOrder(watcher.instrument, 2000, 'sell', guessClose, 0);
                                    }                     
                               }
                            });

                            //Archive the data
                            query = "INSERT INTO watcher_scores (watcher_id,close_difference,high_difference,low_difference,score_date) VALUES ("+
                            watcher.id+","+
                            (parseFloat(watcher.previous_close)-lastClose).toFixed(5).toString()+","+
                            (parseFloat(watcher.previous_high)-lastHigh).toFixed(5).toString()+","+
                            (parseFloat(watcher.previous_low)-lastLow).toFixed(5).toString()+",'"+
                            convertUTCDateToLocalDate(server_time).toISOString()+"')";

                            connection.query(query, function(err, rows, fields) {
                
                                if (err == null) {

                                    query = "UPDATE watchers "+
                                    "SET last_updated='"+convertUTCDateToLocalDate(server_time).toISOString()+
                                    "', previous_close="+message[2]+
                                    ", previous_high="+message[0]+
                                    ", previous_low="+message[1]+
                                    " WHERE id="+watcher.id;

                                    connection.query(query, function(err, rows, fields) {
                                        if (err == null) {               
                                        } else {
                                            console.log(err);
                                        }
                                    });

                                } else {
                                    console.log(err);
                                }
                            });
                        });

                        pyshell.end(function(err) {
                            if (err) throw err;
                        });

                    }

            	});  
            });

        } else {
            console.log(err);
        }

    });

}, 1000);

app.use(express.static('public'));

app.listen(3000, function () {
  console.log('Listening on port 3000');
});

function convertUTCDateToLocalDate(date) {
    var tzoffset = new Date().getTimezoneOffset()*60*1000;
    return new Date(Date.now() - tzoffset);   
}

function placeOrder(instrument, units, side, takeProfit, stopLoss){

    request({

        url:domain+"/v1/accounts/"+account_id+"/orders", 
        headers: headers,
        form: {
            "instrument":instrument,
            "units":units,
            "side":side,
            "type":"market",
            "trailingStop":10,
            "takeProfit":takeProfit,
            "stopLoss":stopLoss
        },
        method:'POST'
    },
    function(error, response, body){
        if(error){
            console.log(error);
        }
    });
            
}
