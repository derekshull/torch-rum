const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const MongoClient = require('mongodb').MongoClient; // eslint-disable-line

const url = 'mongodb://localhost:27017';
const dbName = 'torch';

const app = express();
const port = process.env.PORT || 3005;

app.use(bodyParser.urlencoded({ extended: false }));// parse application/x-www-form-urlencoded
app.use(bodyParser.json());// parse application/json
app.use(cookieParser());// parse request cookies

app.post('/store-beacon', (req, res) => {
  try {
    const bodyPid = req.body.pid;

    MongoClient.connect(url, (connectError, client) => {
      if (connectError) throw connectError;

      const db = client.db(dbName);
      const collection = db.collection('beacons');

      // Look for a beacon with the same page ID
      collection.findOne({ pid: bodyPid }, (queryError, queryResult) => {
        if (queryError) throw queryError;

        if (queryResult) {
          // Update the existing beacon with new data
          collection.updateOne({ pid: bodyPid }, { $set: req.body }, {}, (updateError) => {
            if (updateError) throw updateError;
            client.close();
            res.json({ message: 'success!' });
          });
        } else {
          // Insert the new beacon
          req.body['session-id'] = req.cookies['Torch-GUID'];
          collection.insertOne(req.body, {}, (insertErr) => {
            if (insertErr) throw insertErr;
            client.close();
            res.json({ message: 'success!' });
          });
        }
      });
    });
  } catch (e) {
    res.json({ message: `error: ${e}` });
  }
});

app.listen(port);
