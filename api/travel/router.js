'use strict';

const express = require('express');
const app = express();

const { Travel} = require('./models');
const { Itinerary } = require('../itinerary/models');
const travelRouter = express.Router();

const morgan = require('morgan');
travelRouter.use(morgan('common'));

travelRouter.use(express.json());

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const passport = require('passport');
const { localStrategy, jwtStrategy } = require('../../auth/strategies');
passport.use(localStrategy);
passport.use(jwtStrategy);
const jwtAuth = passport.authenticate('jwt', { session: false });
app.use(jwtAuth);

travelRouter.get('/:id', jwtAuth, (req, res) => {
  let reqId = req.params.id;
  return Travel.findById(reqId)
    .then(item => {
      res.status(200).json(item);
    })
    .catch(err => console.log('err'));
});

travelRouter.post('/', jwtAuth, (req, res) => {
  Travel.create({ 
    depart: { 
      date: req.body.depart.date,
      time: req.body.depart.time,
      location: req.body.depart.location,
      mode: req.body.depart.mode,
      service: req.body.depart.service,
      seat: req.body.depart.seat,
      notes: req.body.depart.notes,
      ticket: req.body.depart.ticket
    },
    arrive: { 
      date: req.body.arrive.date,
      time: req.body.arrive.time,
      location: req.body.arrive.location,
      mode: req.body.arrive.mode,
      service: req.body.arrive.service,
      seat: req.body.arrive.seat,
      notes: req.body.arrive.notes,
      ticket: req.body.arrive.ticket
    },
    itinerary: req.body.itinerary
  })
    .then(item => {
      res.status(201).json(item);
      return Itinerary.findOneAndUpdate({_id: req.body.itinerary}, { $push: {travel: item.id}});
    })
    .catch(err => console.log(err));
});


travelRouter.put('/:id', jwtAuth, (req, res) => {
  const updated = {
    depart: { 
      date: req.body.depart.date,
      time: req.body.depart.time,
      location: req.body.depart.location,
      mode: req.body.depart.mode,
      service: req.body.depart.service,
      seat: req.body.depart.seat,
      notes: req.body.depart.notes,
      ticket: req.body.depart.ticket
    },
    arrive: { 
      date: req.body.arrive.date,
      time: req.body.arrive.time,
      location: req.body.arrive.location,
      mode: req.body.arrive.mode,
      service: req.body.arrive.service,
      seat: req.body.arrive.seat,
      notes: req.body.arrive.notes,
      ticket: req.body.arrive.ticket
    },
    itinerary: req.body.itinerary
  };
  Travel.updateOne({ _id: req.body.id }, { $set: updated }, { new: true })
    .then(item => res.status(200).json(updated))
    .catch(err => console.log(err));
});

travelRouter.delete('/:id', jwtAuth, (req, res) => {
  let id = req.params.id;
  Travel.deleteOne({
    _id: id
  }).then(() => {
    res
      .status(204)
      .end();
  });
});

travelRouter.use('*', function(req, res) {
  res.status(404).json({ message: 'Not Found' });
});

module.exports = travelRouter;