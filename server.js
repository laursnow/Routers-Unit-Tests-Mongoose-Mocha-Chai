'use strict';
require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const morgan = require('morgan');
const passport = require('passport');

const activityRouter = require('./api/activity/router');
const itineraryRouter = require('./api/itinerary/router');
const lodgingRouter = require('./api/lodging/router');
const travelRouter = require('./api/travel/router');
const userRouter = require('./api/users/router');
const { localStrategy, jwtStrategy } = require('./auth/strategies');
const authRouter = require('./auth');
app.use('/api/activity', activityRouter);
app.use('/api/itinerary', itineraryRouter);
app.use('/api/lodging', lodgingRouter);
app.use('/api/travel', travelRouter);
app.use('/api/users', userRouter);
app.use('/auth', authRouter);
mongoose.Promise = global.Promise;

passport.use(localStrategy);
passport.use(jwtStrategy);

const { PORT, DATABASE_URL } = require('./config');

// Logging
app.use(morgan('common'));

// CORS
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');
  if (req.method === 'OPTIONS') {
    return res.send(204);
  }
  next();
});


let server;

function runServer(databaseUrl, port = PORT) {

  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, err => {
      if (err) {
        return reject(err);
      }
      server = app.listen(port, () => {
        console.log(`Your app is listening on port ${port}`);
        resolve();
      })
        .on('error', err => {
          mongoose.disconnect();
          reject(err);
        });
    });
  });
}

function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log('Closing server');
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

if (require.main === module) {
  runServer(DATABASE_URL).catch(err => console.error(err));
}

module.exports = { app, runServer, closeServer };