'use strict';

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const itinerarySchema = mongoose.Schema({
  title: { type: String, required: true },
  date_leave: { type: Date },
  date_return: { type: Date },
  travel: [{type: mongoose.Schema.Types.ObjectId, ref: 'Travel', autopopulate: true}],
  lodging: [{type: mongoose.Schema.Types.ObjectId, ref: 'Lodging', autopopulate: true}],
  activity: [{type: mongoose.Schema.Types.ObjectId, ref: 'Activity', autopopulate: true}],
  public: { type: Boolean, required: true },
  timestamp: { type: Date, default: Date.now },
  user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', autopopulate: true}
},
{ collection: 'itineraries'});
  
itinerarySchema.methods.serialize = function() {
  return {
    id: this._id,
    title: this.title,
    date_leave: this.date_leave,
    date_return: this.date_return,
    travel: this.travel,
    lodging: this.lodging,
    activity: this.activity,
    public: this.public,
    timestamp: this.timestamp,
    user: this.user
  };
};

itinerarySchema.plugin(require('mongoose-autopopulate'));
const Itinerary = mongoose.model('Itinerary', itinerarySchema);

module.exports = { Itinerary };