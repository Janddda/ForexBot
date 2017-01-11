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
    database: 'turkey'
});

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/granularities', function(req, res) {

	var department = req.query.department; //The department to load items for.

    //turkeyscale is the name of the database table containing all POS information about the scale items.
    connection.query('SELECT * FROM turkeyscale WHERE DESCRIPTION IS NOT NULL AND DEPARTMENT IN (' + department + ') ORDER BY DESCRIPTION', function(err, rows, fields) {

        if (err == null) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify({ items: rows }));
            res.end();
        } else {
            console.log(err);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify({ error: err }));
            res.end();
        }

    });
    
});

app.get('/instruments', function(req, res) {
});

app.get('/candles', function(req, res) {
});

app.use(express.static('public'));

app.listen(3000, function () {
  console.log('Listening on port 3000');
});
