'use strict';

const express = require('express');
const app = express();

const { Itinerary } = require('./models');
const { User } = require('../users/models');

const itineraryRouter = express.Router();

const morgan = require('morgan');
itineraryRouter.use(morgan('common'));

itineraryRouter.use(express.json());

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const passport = require('passport');
const { localStrategy, jwtStrategy } = require('../../auth/strategies');
passport.use(localStrategy);
passport.use(jwtStrategy);
const jwtAuth = passport.authenticate('jwt', { session: false });
app.use(jwtAuth);

itineraryRouter.post('/', jwtAuth, (req, res) => {
  Itinerary.create({
    title: req.body.title,
    date_leave: req.body.date_leave,
    date_return: req.body.date_return,
    public: req.body.public,
    timestamp: req.body.timestamp,
    user: req.user.id
  })
    .then(item => {
      res.status(201).json(item.serialize());
      return User.findOneAndUpdate(
        { username: req.user.username },
        { $push: { author_of: item.id } }
      );
    })
    .catch(err => console.log(err));
});

itineraryRouter.get('/db/:id', jwtAuth, (req, res) => {
  let user = req.params.id;
  return User.find({ username: user })
    .populate('author_of')
    .then(item => {
      let snippets = item.map(snippet => snippet.author_of);
      res.status(200).json(snippets);
    })
    .catch(err => console.log(err));
});

itineraryRouter.get('/:id', jwtAuth, (req, res) => {
  let reqId = req.params.id;
  return Itinerary.findById(reqId)
    .then(item => {
      res.status(200).json(item.serialize());
    })
    .catch(err => console.log(err));
});

itineraryRouter.put('/:id', jwtAuth, (req, res) => {
  const updated = {
    title: req.body.title,
    date_leave: req.body.date_leave,
    date_return: req.body.date_return,
    public: req.body.public,
    timestamp: req.body.timestamp
  };
  Itinerary.updateOne({ _id: req.params.id }, { $set: updated }, { new: true })
    .then(item => res.status(200).json(updated))
    .catch(err => console.log(err));
});

itineraryRouter.delete('/:id', jwtAuth, (req, res) => {
  let id = req.params.id;
  User.findOneAndUpdate(
    { username: req.user.username },
    { $pull: { author_of: id } },
    { new: true }
  )
    .then(() => Itinerary.deleteOne({ _id: id }))
    .then(() => {
      res.status(204).end();
    });
});

itineraryRouter.use('*', function(req, res) {
  res.status(404).json({ message: 'Not Found' });
});

module.exports = itineraryRouter;
