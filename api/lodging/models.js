'use strict';

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const lodgingSchema = mongoose.Schema({
  check_in: Date,
  check_out: Date,
  address: String,
  phone: String,
  email: String,
  notes: String,
  confirmation: String,
  itinerary: {type: mongoose.Schema.Types.ObjectId, ref: 'Itinerary'}},
{ collection: 'lodging' });
  
lodgingSchema.methods.serialize = function() {
  return {
    id: this._id,
    check_in: this.check_in,
    check_out: this.check_out,
    address: this.address,
    phone: this.phone,
    email: this.email,
    notes: this.notes,
    confirmation: this.confirmation,
    itinerary: this.itinerary
  };
};

const Lodging = mongoose.model('Lodging', lodgingSchema);

module.exports = { Lodging };