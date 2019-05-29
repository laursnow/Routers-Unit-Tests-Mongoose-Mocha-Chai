'use strict';

const express = require('express');
const app = express();

const { Activity } = require('./models');
const { Itinerary } = require('../itinerary/models');
const activityRouter = express.Router();

const morgan = require('morgan');
activityRouter.use(morgan('common'));

activityRouter.use(express.json());

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const passport = require('passport');
const { localStrategy, jwtStrategy } = require('../../auth/strategies');
passport.use(localStrategy);
passport.use(jwtStrategy);
const jwtAuth = passport.authenticate('jwt', { session: false });
app.use(jwtAuth);

activityRouter.get('/:id', jwtAuth, (req, res) => {
  let reqId = req.params.id;
  return Activity.findById(reqId)
    .then(item => {
      res.status(200).json(item.serialize());
    })
    .catch(err => console.log(err));
});

activityRouter.post('/', jwtAuth, (req, res) => {
  Activity.create({
    date: req.body.date,
    time: req.body.time,
    address: req.body.address,
    phone: req.body.phone,
    email: req.body.email,
    notes: req.body.notes,
    ticket: req.body.ticket,
    itinerary: req.body.itinerary
  })
    .then(item => {
      res.status(201).json(item.serialize());
      return Itinerary.findOneAndUpdate(
        { _id: req.body.itinerary },
        { $push: { activity: item.id } }
      );
    })
    .catch(err => console.log(err));
});

activityRouter.put('/:id', jwtAuth, (req, res) => {
  const updated = {
    date: req.body.date,
    time: req.body.time,
    address: req.body.address,
    phone: req.body.phone,
    email: req.body.email,
    notes: req.body.notes,
    ticket: req.body.ticket,
    itinerary: req.body.itinerary
  };
  Activity.updateOne({ _id: req.params.id }, { $set: updated }, { new: true })
    .then(item => res.status(200).json(updated))
    .catch(err => console.log(err));
});

activityRouter.delete('/:id', jwtAuth, (req, res) => {
  let id = req.params.id;
  Activity.deleteOne({
    _id: id
  }).then(() => {
    res.status(204).end();
  });
});

activityRouter.use('*', function(req, res) {
  res.status(404).json({ message: 'Not Found' });
});

module.exports = activityRouter;
