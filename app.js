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



app.use(express.static('public'));

app.listen(3000, function () {
  console.log('Listening on port 3000');
});
