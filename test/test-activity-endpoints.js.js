'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose').set('debug', false);
mongoose.Promise = global.Promise;
require('dotenv').config();
const { Itinerary } = require('../api/itinerary/models');
const { Activity } = require('../api/activity/models');
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

function seedItineraryData() {
  Itinerary.create({ 
    _id: _itineraryId,
    title: 'Trip to Philadelphia',
    date_leave: faker.date.future(),
    date_return: faker.date.future(),
    public: faker.random.boolean(),
    timestamp: faker.date.recent(0),
    user: testUser.id });
}

function seedActivityData() {
  for (let i = 1; i <= 10; i++) {
    Activity.create({  
      date: faker.random.number(),
      time: faker.date.future(),
      address: faker.address.streetAddress(),
      phone: faker.phone.phoneNumber(),
      email: faker.internet.email(),
      notes: faker.random.words(),
      ticket: faker.image.imageUrl(),
      itinerary: _itineraryId })
      .then( function(post) {
        return Itinerary.findOneAndUpdate({_id: _itineraryId}, { $push: {activity: post.id}});
      });
  } 
}

describe('Itinerator API resource: Activity', function () {
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
    return seedActivityData();
  });

  afterEach(function () {
    return tearDownDb();
  });

  after(function () {
    return closeServer();
  });


  describe('GET endpoint', function () {

    it('should return single selected activity', function () 
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
      return Activity.findOne()
        .then( function (res) {
          let result = res;
          return result;
        })
        .then( function(result) {
          let id = result._id;
          return chai.request(app)
            .get(`/api/activity/${id}`)
            .set( 'Authorization', `Bearer ${ token }` )
            .then( function(res) {
              let _result = res.body;
              let _id = _result.id;
              expect(_result).to.exist;
              expect(_result).to.be.a('object');
              expect(_id).to.equal(id.toString());
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
      return Activity.findOne()
        .then( function (res) {
          let result = res.toJSON();
          return result;
        })
        .then( function(result) {
          let id = result._id;
          return chai.request(app)
            .get(`/api/activity/${id}`)
            .set( 'Authorization', `Bearer ${ token }` )
            .then( function(res) {
              let _result = res.body;
              _result.should.include.keys('date', 'time', 'address', 'phone', 'email', 'notes', 'ticket', 'itinerary');
              _result.itinerary.should.equal(result.itinerary.toString());
              _result.address.should.equal(result.address);
              _result.phone.should.equal(result.phone);
              _result.email.should.equal(result.email);
              _result.notes.should.equal(result.notes);
              _result.ticket.should.equal(result.ticket);
            });
        });
    });
  });

  describe('POST endpoint', function () {
    it('should create a new activity and add record in itinerary',
      function () {

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

        const newEntry = {
          date: '4/5/2020',
          time: '11:00 am',
          address: '1800 Market Street Philadelphia, PA',
          phone: '215-098-5431',
          email: 'restaurant@eat.com',
          notes: 'BYOB',
          ticket: 'email.gif',
          itinerary: _itineraryId
        };
        return chai.request(app)
          .post('/api/activity')
          .set( 'Authorization', `Bearer ${ token }` )
          .send(newEntry)
          .then(function (res) {
            let _result = res.body;
            _result.should.include.keys('date', 'time', 'address', 'phone', 'email', 'notes', 'ticket', 'itinerary');
            _result.itinerary.should.equal(newEntry.itinerary._id.toString());
            _result.address.should.equal(newEntry.address);
            _result.phone.should.equal(newEntry.phone);
            _result.email.should.equal(newEntry.email);
            _result.notes.should.equal(newEntry.notes);
            _result.ticket.should.equal(newEntry.ticket);
            _result.id.should.not.be.null;
            return Activity.findById(_result.id);
          })
          .then(function (entry) {
            entry.notes.should.equal(newEntry.notes);
            entry.address.should.equal(newEntry.address);
            entry.phone.should.equal(newEntry.phone);
            entry.email.should.equal(newEntry.email);
            entry.itinerary.toString().should.equal(newEntry.itinerary.toString());
            return Itinerary.find({_id: _itineraryId})
              .then(function(post) {
                assert.that(post[0].activity.toString()).is.containing(_itineraryId.toString());            
              });
          });
      });
  });

  describe('PUT endpoint', function () {
    it('should update selected activity', function () {
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
        
      const updateData = {
        date: '8/5/2020',
        time: '1:00 pm',
        address: '235 South 18th Street Philadelphia, PA',
        phone: '215-098-5431',
        email: 'restaurant@eat.com',
        notes: 'BYOB',
        ticket: 'email.gif',
        itinerary: _itineraryId
      };
      return Activity.findOne()
        .then( function(result) {
          updateData.id = result.id;
          return chai.request(app)
            .put(`/api/activity/${updateData.id}`)
            .set( 'Authorization', `Bearer ${ token }` )
            .send(updateData);
        })
        .then(res => {
          res.should.have.status(200);
          return Activity.findById(updateData.id);
        })
        .then( function(_result) {
          _result.itinerary.toString().should.equal(_itineraryId.toString());
          _result.notes.should.equal(updateData.notes);
          _result.address.should.equal(updateData.address);
          _result.phone.should.equal(updateData.phone);
          _result.email.should.equal(updateData.email);
          _result.time.should.equal(updateData.time);
          _result.ticket.should.equal(updateData.ticket);
        });
    });
  });
  describe('DELETE endpoint', function () {
    it('should delete selected activity and update itinerary record', function () {
    
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

      return Activity.findOne()
        .then(post => {
          entry = post;
          return chai.request(app)
            .delete(`/api/activity/${entry.id}`)
            .set( 'Authorization', `Bearer ${ token }` );
        })
        .then( function(res) {
          res.should.have.status(204);
          return Activity.findById(entry.id);
        })
        .then(_post => {
          should.not.exist(_post);
          return Itinerary.find({_id: entry.itinerary})
            .then(function(itinerary) {
              assert.that(itinerary[0].activity.toString()).is.not.containing(entry.id);
            });
        });
    });
  });
});
  