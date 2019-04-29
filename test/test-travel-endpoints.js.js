'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose').set('debug', false);
mongoose.Promise = global.Promise;
require('dotenv').config();
const { Itinerary } = require('../api/itinerary/models');
const { Travel } = require('../api/travel/models');
const { User } = require('../api/users/models');
const { JWT_SECRET } = require('../config');
const jwt = require('jsonwebtoken');
const { closeServer, runServer, app } = require('../server');
const { TEST_DATABASE_URL } = require('../config');
const ObjectID = require('mongodb').ObjectID;
const { expect } = require('chai');
const should = chai.should();
const assert = require('assertthat');

chai.use(chaiHttp);

function tearDownDb() {
  return new Promise((resolve, reject) => {
    mongoose.connection.dropDatabase()
      .then(result => resolve(result))
      .catch(err => reject(err));
  });
}

let testUser;
let _itineraryId = new ObjectID();

function makeDates (dates) {
  const makeDatesObj = {};
  Object.keys(dates).forEach(function (key) {
    let value = dates[key];
    makeDatesObj[key] = new Date(value);
  });
  formatDates(makeDatesObj);
}
  
function formatDates (dates) {
  const formatDatesObj = {};
  Object.keys(dates).forEach(function (key) {
    let value = dates[key];
    formatDatesObj[key] = value.toGMTString();
  });
  checkDates(formatDatesObj);
}
  
function checkDates (dates) {
  dates._arrive.should.equal(dates.arrive);
  dates._depart.should.equal(dates.depart);
}

function seedItineraryData() {
  Itinerary.create({ 
    _id: _itineraryId,
    title: 'Trip to Chicago',
    date_leave: faker.date.future(),
    date_return: faker.date.future(),
    public: faker.random.boolean(),
    timestamp: faker.date.recent(0),
    user: testUser.id });
}

function seedTravelData() {
  for (let i = 1; i <= 10; i++) {
    Travel.create({  
      depart: {
        date: faker.date.future(),
        time: faker.random.number(),
        location: faker.address.city(),
        mode: faker.random.word(),
        service: faker.random.word(),
        seat: faker.random.number(),
        notes: faker.random.words(),
        ticket: faker.image.imageUrl() 
      },
      arrive: {
        date: faker.date.future(),
        time: faker.random.number(),
        location: faker.address.city(),
        mode: faker.random.word(),
        service: faker.random.word(),
        seat: faker.random.number(),
        notes: faker.random.words(),
        ticket: faker.image.imageUrl() 
      },
      itinerary: _itineraryId })
      .then( function(post) {
        return Itinerary.findOneAndUpdate({_id: _itineraryId}, { $push: {travel: post.id}});
      });
  } 
}

describe('Itinerator API resource: Travel', function () {
  const username = faker.random.word();
  const password = 'dummyPw1234';
  const email = faker.internet.email();

  before(function () {
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function() {
    return User.hashPassword(password).then(password => {
      return User.create({
        username,
        password,
        email
      })
        .then((user) => {
          testUser = user;});
    }
    );});

  beforeEach(function () {
    return seedItineraryData();
  });

  beforeEach(function () {
    return seedTravelData();
  });

  afterEach(function () {
    return tearDownDb();
  });

  after(function () {
    return closeServer();
  });


  describe('GET endpoint', function () {

    it('should return single selected travel', function () 
    {
      const token = jwt.sign(
        {
          user: {
            username,
            email
          }
        },
        JWT_SECRET,
        {
          algorithm: 'HS256',
          subject: username,
          expiresIn: '7d'
        }
      );
      return Travel.findOne()
        .then( function (res) {
          let result = res;
          return result;
        })
        .then( function(result) {
          return chai.request(app)
            .get(`/api/travel/${result.id}`)
            .set( 'Authorization', `Bearer ${ token }` )
            .then( function(res) {
              let _result = res.body;
              expect(_result).to.exist;
              expect(_result).to.be.a('object');
              expect(_result._id).to.equal(result.id.toString());
            });
        });
    });

    it('should return post with correct fields', function ()
    {
      const token = jwt.sign(
        {
          user: {
            username,
            email
          }
        },
        JWT_SECRET,
        {
          algorithm: 'HS256',
          subject: username,
          expiresIn: '7d'
        }
      );
      return Travel.findOne()
        .then( function (res) {
          let result = res.toJSON();
          return result;
        })
        .then( function(result) {
          let id = result._id;
          return chai.request(app)
            .get(`/api/travel/${id}`)
            .set( 'Authorization', `Bearer ${ token }` )
            .then( function(res) {
              let _result = res.body;
              _result.should.include.keys('depart', 'arrive', 'itinerary');
              _result.depart.should.include.keys('date', 'time', 'location', 'mode', 'service', 'seat', 'notes', 'ticket');
              _result.arrive.should.include.keys('date', 'time', 'location', 'mode', 'service', 'seat', 'notes', 'ticket');
              _result.itinerary.should.equal(result.itinerary.toString());
              _result._id.should.equal(result._id.toString());
              _result.depart.time.should.equal(result.depart.time);
              _result.depart.location.should.equal(result.depart.location);
              _result.arrive.time.should.equal(result.arrive.time);
              _result.arrive.location.should.equal(result.arrive.location);
              const dates = {_depart: _result.depart.date, depart: result.depart.date, _arrive: _result.arrive.date, arrive: result.arrive.date };
              makeDates(dates);
            });
        });
    });
  });

  // describe('POST endpoint', function () {
  //   it.only('should create a new travel and add record in itinerary',
  //     function () {

  //       const token = jwt.sign(
  //         {
  //           user: {
  //             username,
  //             email
  //           }
  //         },
  //         JWT_SECRET,
  //         {
  //           algorithm: 'HS256',
  //           subject: username,
  //           expiresIn: '7d'
  //         }
  //       );

  //       const newEntry = {  
  //         depart: {
  //           date: faker.date.future(),
  //           time: faker.random.number(),
  //           location: faker.address.city(),
  //           mode: faker.random.word(),
  //           service: faker.random.word(),
  //           seat: faker.random.number(),
  //           notes: faker.random.words(),
  //           ticket: faker.image.imageUrl() 
  //         },
  //         arrive: {
  //           date: faker.date.future(),
  //           time: faker.random.number(),
  //           location: faker.address.city(),
  //           mode: faker.random.word(),
  //           service: faker.random.word(),
  //           seat: faker.random.number(),
  //           notes: faker.random.words(),
  //           ticket: faker.image.imageUrl() 
  //         },
  //         itinerary: _itineraryId
  //       };
  //       return chai.request(app)
  //         .post('/api/travel')
  //         .set( 'Authorization', `Bearer ${ token }` )
  //         .send(newEntry)
  //         .then(function (res) {
  //           let _result = res.body;
  //           console.log(_result, '@@@@@@@');
  //           _result.should.include.keys('depart', 'arrive', 'itinerary');
  //           _result.depart.should.include.keys('date', 'time', 'location', 'mode', 'service', 'seat', 'notes', 'ticket');
  //           _result.arrive.should.include.keys('date', 'time', 'location', 'mode', 'service', 'seat', 'notes', 'ticket');
  //           _result.itinerary.should.equal(newEntry.itinerary._id.toString());
  //           _result.itinerary.should.equal(newEntry.itinerary.toString());
  //           _result._id.should.equal(newEntry._id.toString());
  //           _result.depart.time.should.equal(newEntry.depart.time);
  //           _result.depart.location.should.equal(newEntry.depart.location);
  //           _result.arrive.time.should.equal(newEntry.arrive.time);
  //           _result.arrive.location.should.equal(newEntry.arrive.location);
  //           const dates = {_depart: _result.depart.date, depart: newEntry.depart.date, _arrive: _result.arrive.date, arrive: newEntry.arrive.date };
  //           makeDates(dates);
  //           _result.id.should.not.be.null;
  //           return Travel.findById(_result.id);
  //         })
  //         .then(function (entry) {
  //           entry.depart.time.should.equal(newEntry.depart.time);
  //           entry.depart.location.should.equal(newEntry.depart.location);
  //           entry.arrive.time.should.equal(newEntry.arrive.time);
  //           entry.arrive.location.should.equal(newEntry.arrive.location);
  //           const dates = {_depart: entry.depart.date, depart: newEntry.depart.date, _arrive: entry.arrive.date, arrive: newEntry.arrive.date };
  //           makeDates(dates);
  //           entry.itinerary.toString().should.equal(newEntry.itinerary.toString());
  //           return Itinerary.find({_id: _itineraryId})
  //             .then(function(post) {
  //               assert.that(post[0].travel.toString()).is.containing(_itineraryId.toString());            
  //             });
  //         });
  //     });
  // });

  describe('PUT endpoint', function () {
    it.only('should update selected travely', function () {
      const token = jwt.sign(
        {
          user: {
            username,
            email
          }
        },
        JWT_SECRET,
        {
          algorithm: 'HS256',
          subject: username,
          expiresIn: '7d'
        }
      );
      let originalRecord;
      const updateData = {
        depart: {
          date: faker.date.future(),
          time: faker.random.number(),
          location: faker.address.city(),
          mode: faker.random.word(),
          service: faker.random.word(),
          seat: faker.random.number(),
          notes: faker.random.words(),
          ticket: faker.image.imageUrl() 
        },
        itinerary: _itineraryId
      };
      return Travel.findOne()
        .then( function(result) {
          updateData.id = result.id;
          originalRecord = result;
          return chai.request(app)
            .put(`/api/travel/${updateData.id}`)
            .set( 'Authorization', `Bearer ${ token }` )
            .send(updateData);
        })
        .then(res => {
          res.should.have.status(200);
          return Travel.findById(updateData.id);
        })
        .then( function(_result) {
          console.log(_result);
          // _result.itinerary.toString().should.equal(updateData.itinerary.toString());
          // _result._id.should.equal(updateData._id.toString());
          // _result.depart.time.should.equal(updateData.depart.time);
          // _result.depart.location.should.equal(updateData.depart.location);
          // _result.arrive.time.should.equal(originalRecord.arrive.time);
          // _result.arrive.location.should.equal(originalRecord.arrive.location);
          // const dates = {_depart: _result.depart.date, depart: updateData.depart.date, _arrive: _result.arrive.date, arrive: originalRecord.arrive.date };
          // makeDates(dates);
        });
    });
  });
  describe('DELETE endpoint', function () {
    it('should delete selected travel and update itinerary record', function () {
    
      const token = jwt.sign(
        {
          user: {
            username,
            email
          }
        },
        JWT_SECRET,
        {
          algorithm: 'HS256',
          subject: username,
          expiresIn: '7d'
        }
      );
    
      let entry;
    
      return Travel.findOne()
        .then(post => {
          entry = post;
          return chai.request(app)
            .delete(`/api/travel/${entry.id}`)
            .set( 'Authorization', `Bearer ${ token }` );
        })
        .then( function(res) {
          res.should.have.status(204);
          return Travel.findById(entry.id);
        })
        .then(post => {
          should.not.exist(post);
          return Itinerary.find({_id: entry.itinerary})
            .then(function(itinerary) {
              assert.that(itinerary[0].travel.toString()).is.not.containing(entry.id);
            });
        });
    });
  });
});
  