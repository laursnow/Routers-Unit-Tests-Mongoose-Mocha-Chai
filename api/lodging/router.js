'use strict';

const express = require('express');
const app = express();

const { Lodging } = require('./models');
const { Itinerary } = require('../itinerary/models');
const lodgingRouter = express.Router();

const morgan = require('morgan');
lodgingRouter.use(morgan('common'));

lodgingRouter.use(express.json());

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const passport = require('passport');
const { localStrategy, jwtStrategy } = require('../../auth/strategies');
passport.use(localStrategy);
passport.use(jwtStrategy);
const jwtAuth = passport.authenticate('jwt', { session: false });
app.use(jwtAuth);

lodgingRouter.get('/:id', jwtAuth, (req, res) => {
  let reqId = req.params.id;
  return Lodging.findById(reqId)
    .then(item => {
      res.status(200).json(item.serialize());
    })
    .catch(err => console.log('lodging err'));
});

lodgingRouter.post('/', jwtAuth, (req, res) => {
  Lodging.create({
    check_in: req.body.check_in,
    check_out: req.body.check_out,
    address: req.body.address,
    phone: req.body.phone,
    email: req.body.email,
    notes: req.body.notes,
    confirmation: req.body.confirmation,
    itinerary: req.body.itinerary
  })
    .then(item => {
      res.status(201).json(item.serialize());
      console.log(req.body.itinerary, item.id);
      return Itinerary.findOneAndUpdate(
        { _id: req.body.itinerary },
        { $push: { lodging: item.id } }
      );
    })
    .catch(err => console.log(err));
});

lodgingRouter.put('/:id', jwtAuth, (req, res) => {
  const updated = {
    check_in: req.body.check_in,
    check_out: req.body.check_out,
    address: req.body.address,
    phone: req.body.phone,
    email: req.body.email,
    notes: req.body.notes,
    confirmation: req.body.confirmation,
    itinerary: req.body.itinerary
  };
  Lodging.updateOne({ _id: req.params.id }, { $set: updated }, { new: true })
    .then(item => res.status(200).json(updated))
    .catch(err => console.log(err));
});

lodgingRouter.delete('/:id', jwtAuth, (req, res) => {
  Lodging.deleteOne({
    _id: req.params.id
  }).then(() => {
    res.status(204).end();
  });
});

lodgingRouter.use('*', function(req, res) {
  res.status(404).json({ message: 'Not Found' });
});

module.exports = lodgingRouter;
