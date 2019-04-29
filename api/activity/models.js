'use strict';

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const activitySchema = mongoose.Schema({
  date: Date,
  time: String,
  address: String,
  phone: String,
  email: String,
  notes: String,
  ticket: String,
  itinerary: {type: mongoose.Schema.Types.ObjectId, ref: 'Itinerary'}},
{ collection: 'activity' });
  
activitySchema.methods.serialize = function() {
  return {
    id: this._id,
    date: this.date,
    time: this.time,
    address: this.address,
    phone: this.phone,
    email: this.email,
    notes: this.notes,
    ticket: this.ticket,
    itinerary: this.itinerary
  };
};


const Activity = mongoose.model('Activity', activitySchema);
  
module.exports = { Activity };