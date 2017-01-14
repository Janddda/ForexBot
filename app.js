var express = require('express');
var app = express();
var path = require('path');

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

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname + '/index.html'));
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
						    "WHEN run_unit = 'MONTH' THEN last_updated < NOW() - INTERVAL run_interval MONTH END", function(err, rows, fields) {

        if (err == null) {

            watchers = rows;

            for(var i=0; i<watchers.length; i++) {
            	
            	var w = watchers[i];

            	//For each watcher that we have to run through, 
            	            

            }

        } else {
            console.log(err);
        }

    });

}, 10000);

app.use(express.static('public'));

app.listen(3000, function () {
  console.log('Listening on port 3000');
});
