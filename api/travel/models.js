'use strict';

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const travelSchema = mongoose.Schema(
  {
    depart: {
      date: Date,
      time: String,
      location: String,
      mode: String,
      service: String,
      seat: String,
      notes: String,
      ticket: String
    },
    arrive: {
      date: Date,
      time: String,
      location: String,
      mode: String,
      service: String,
      seat: String,
      notes: String,
      ticket: String
    },
    itinerary: { type: mongoose.Schema.Types.ObjectId, ref: 'Itinerary' }
  },
  { collection: 'travel' }
);

travelSchema.methods.serialize = function() {
  return {
    id: this._id,
    depart: {
      date: this.date,
      time: this.time,
      location: this.location,
      mode: this.mode,
      service: this.service,
      seat: this.seat,
      notes: this.notes,
      ticket: this.ticket
    },
    arrive: {
      date: this.date,
      time: this.time,
      location: this.location,
      mode: this.mode,
      service: this.service,
      seat: this.seat,
      notes: this.notes,
      ticket: this.ticket
    },
    itinerary: this.itinerary
  };
};

const Travel = mongoose.model('Travel', travelSchema);

module.exports = { Travel };
