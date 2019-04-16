// This is for all server & backend purposes (node.js, MongoDB, ExpressJS)

// setting constants to important requires/port variables
const express = require('express');
const app = express();
const server = require('http').Server(app);
const Twitter = require('twitter');
const path = require('path');
const fs = require('fs');
const json2csv = require('json2csv').parse;
const jsonxml = require('jsontoxml');
const port = 3000;

const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://dbAdmin:Websci2019@cluster0-fk5ba.mongodb.net/test?retryWrites=true";
const dbclient = new MongoClient(uri, { useNewUrlParser: true });
dbclient.connect(err => { //connect to MongoDB Atlas Server
  if (err) throw err;
  let dbo = dbclient.db("tweetDB");
  dbo.collection("tweets", function(err, collection) { //initially delete data in collection
    if (err) throw err;
    collection.deleteMany({}, function (err, result) {
      if (err) throw err;
      console.log("Collection is deleted!", result);
    });
  });
});


let client = new Twitter({ // creates new twitter object with API keys
  consumer_key: 'e1vWnyZWftu2KtvhKVX7m7beJ',
  consumer_secret: 'uP4TKu2A6kmPBUBNfQEFkCEzBE7bUg9ovvdUgrgOe0p4uM3BF3',
  access_token_key: '738645986-7z2KfvFqeXWtOxgTfXEEjVfQcx2GT2zIxqoOauP1',
  access_token_secret: 'FcFl4nD4Z25VBcgH4jYGG7VpTu0ikpB06PU6dUQJNNvKp'
});

let directory = path.join(__dirname, '../index.html');
app.get('/', function (req, res) { // will send response from server to frontend
  res.sendFile(directory)
});

//init array for all file types
let allTweets = [];
let jsonFile = [];
let csvFile = [];
let xmlFile = [];

app.use(express.static(__dirname));// get local files such as css and js due to localhost errors

app.use('/searchQuery', function (req, res) { // will get tweets and send them to the front end using the express/node server and socket.io
  let tweetsFilter = { track: req.query.keyword }; // will get query search
  let eachTweet = 0;

  if (!req.query.amount) {
    req.query.amount = 10;
  }

  if (!req.query.keyword) { // if search query is not provided which is fine by lab instructions
    tweetsFilter = { locations: '-74,40,-73,41' } // tweets from NYC due to popularity
  }
  let dbo = dbclient.db("tweetDB");
  dbo.collection("tweets", function(err, collection) { //delete previous data
    if (err) throw err;
    collection.deleteMany({}, function (err, result) {
      if (err) throw err;
      console.log("Collection is deleted!", result);
    });
  });

  client.stream('statuses/filter', tweetsFilter, function (stream) { // will retrieve tweets using search query/location
    stream.on('data', function (tweet) {
      if (req.query.amount <= eachTweet++) { // if limit (input number) is reached, stops stream and end the response to frontend
        console.log('Destroying tweet stream and ending response to server');
        stream.destroy();
        res.end();
        let dbo = dbclient.db("tweetDB");
        dbo.collection("tweets").insertMany(allTweets, function(err, res) { //add all tweets to db
          if(err) throw err;
          console.log("Number of documents inserted: " + res.insertedCount);
        });

        dbo.collection("tweets").find({}, {projection: {_id: 0}}).toArray(function (err, result) { //send tweets to files
          if (err) throw err;
          console.log(result);
          jsonFile = JSON.stringify(result); //get for JSON file
          csvFile = result; //get for CSV file
          xmlFile = result; //XML file
          //dbclient.close();
        });
        return // return is needed for socket error
      }
      res.write(tweet.text); // write tweet to response each time
      allTweets.push(tweet); // push each tweet to array
    });
    stream.on('error', function (error) { // if any errors occur
      console.log(error);
    })
  })
});


app.use('/collectTweets', function (req, res) { //send tweets from db to front-end
  let dbo = dbclient.db("tweetDB");
  dbo.collection("tweets").find({}, {projection: {_id: 0}}).toArray(function (err, result) {
    res.send(result);
    //dbclient.close();
  })
});

app.use('/exportFile', function (req, res) { //get exported file of tweets
  //console.log(allTweets.length);
  let file = "";

  if (req.query.file !== "" && allTweets.length !== 0) {
    if (req.query.file === "JSON") { //file name
      file = "castis2-tweets.json";
    } else if (req.query.file === "CSV") {
      file = "castis2-tweets.csv";
    } else {
      file = "castis2-tweets.xml";
    }

    fs.access(file, fs.constants.F_OK | fs.constants.W_OK, (err) => { //checking if file exists and is writable
      if (err) { //debugging
        console.error(`${file} ${err.code === 'ENOENT' ? 'does not exist' : 'is read-only'}`);
      } else {
        console.log(`${file} exists, and it is writable`);
      }

      if (req.query.file === "JSON") { //if file user wants is JSON
        fs.writeFile(file, jsonFile, {flag: "w"}, (err) => {
          if (err) throw err;
          console.log("JSON file saved in directory");
        });
      } else if (req.query.file === "CSV") { //if user wants CSV
        //console.log(tweetFile);

        const jsonTweets = csvFile;

        const csvH = ["created_at", "id", "text", "user.id", "user.name", "user.screen_name", "user.location", "user.followers_count",
          "user.friends_count", "user.created_at", "user.time_zone", "user.profile_background_color", "user.profile_image_url",
          "geo", "coordinates", "place"]; //headers

        const csv = json2csv(jsonTweets, {fields: csvH}); //conversion using package
        //console.log(csv);
        fs.writeFile(file, csv, {flag: "w"}, (err) => {
          if (err) throw err;
          console.log("CSV file saved in directory");
        });
      } else { //XML file export

        let xml = jsonxml({
          node: 'text content',
          parent: xmlFile
        });

        fs.writeFile(file, xml, {flag: "w"}, (err) => {
          if (err) throw err;
          console.log("XML file saved in directory");
        })
      }
    })
  } else {
    let errorText = "ERROR! Incorrect file type or you have not collected any tweets";
    res.send(errorText);
  }
});

server.listen(port, function () { // server to listen on port 3000 for localhost
  console.log('Twitter app listening on port ' + port)
});
