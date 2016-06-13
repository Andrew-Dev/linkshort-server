//linkshort backend server
//written by Andrew Arpasi
//http://lnkshort.xyz

//initialize node dependencies
var express = require('express');
var app = express();
var mysql = require('mysql');
var randomstring = require("randomstring");
var bodyParser = require('body-parser');
var validUrl = require('valid-url');

app.use(bodyParser.urlencoded({ extended: true }));

//use MySQL as the Database
var connection = mysql.createConnection({
  host     : 'YOUR_HOST',
  user     : 'YOUR_USERNAME',
  password : 'YOUR_PASSWORD',
  database : 'YOUR_DATABASE'
});
//POST to this URL to create links and get back a link id.
app.post('/createLink/', function(req, res) {
  var url = req.body.url
  if (validUrl.isUri(url)){
    console.log('Valid: ');
    var shortenedData = createShortenedURL(url,res);
    console.log("data: " + shortenedData);
  } else {
    console.log('Error: Not a URL');
    res.send("invalid");
  }
});

//this generates link IDs and stores them in the database.
function createShortenedURL(url,res)
{
  var shortened = randomstring.generate(5);
  console.log(shortened);
  connection.query('SELECT * FROM links WHERE urlID = ' + connection.escape(shortened), function(err, rows, fields) {
    if (err) throw err;
    if(rows > 0)
    {
      //prevent duplicate IDs
      createShortenedURL(url);
    }
    else {
      //find if the URL was already submitted
      connection.query('SELECT * FROM links WHERE URL = ' + connection.escape(url), function(err1, rows1, fields1) {
        if (err1) throw err1;
        if(rows1.length > 0)
        {
          console.log("already in db");
          //return the already stored URL/link ID
          res.send("success: " + rows1[0].urlID);
        }
        else {
          var linkInfo = {URL: url, urlId: shortened};
          //save new generated link ID
          connection.query('INSERT INTO links SET ?', linkInfo, function(err2, result) {
            console.log("should have shortened");
            res.send("success: " + shortened);
          });
        }
      });
    }
  });
}

//Takes in link ID and redirects if it exists in the database.
app.get('/:urlID', function(req, res) {
  var urlID = req.params.urlID;
  connection.query('SELECT * FROM links WHERE urlID = ' + connection.escape(urlID), function(err, rows, fields) {
    if (err) throw err;
    if(rows.length > 0)
    {
      //there is a URL at this ID. Redirect to it.
      var url = rows[0].URL
      res.redirect(url);
    }
    else {
      //No URL, redirect to the site.
      res.redirect('/');
    }
  });
});

//static pages and files:
var path = require('path').dirname(require.main.filename);

app.get('/', function (req, res) {
  res.sendFile(path + "/index.html");
});

app.get('/css/format.css', function (req, res) {
  res.sendFile(path + "/css/format.css");
});
app.get('/css/animate.css', function (req, res) {
  res.sendFile(path + "/css/animate.css");
});
app.get('/css/bootstrap.min.css', function (req, res) {
  res.sendFile(path + "/css/bootstrap.min.css");
});


app.listen(1234, function () {
  console.log('Linkshort Web Server - Port 1234');
});
