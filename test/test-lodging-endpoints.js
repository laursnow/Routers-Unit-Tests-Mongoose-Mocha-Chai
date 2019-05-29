'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose').set('debug', false);
mongoose.Promise = global.Promise;
require('dotenv').config();
const { Itinerary } = require('../api/itinerary/models');
const { Lodging } = require('../api/lodging/models');
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
    mongoose.connection
      .dropDatabase()
      .then(result => resolve(result))
      .catch(err => reject(err));
  });
}

let testUser;
let _itineraryId = new ObjectID();

function seedItineraryData() {
  Itinerary.create({
    _id: _itineraryId,
    title: 'Trip to Boston',
    date_leave: faker.date.future(),
    date_return: faker.date.future(),
    public: faker.random.boolean(),
    timestamp: faker.date.recent(0),
    user: testUser.id
  });
}

function seedLodgingData() {
  for (let i = 1; i <= 10; i++) {
    Lodging.create({
      check_in: faker.date.future(),
      check_out: faker.date.future(),
      address: faker.address.streetAddress(),
      phone: faker.phone.phoneNumber(),
      email: faker.internet.email(),
      notes: faker.random.words(),
      confirmation: faker.image.imageUrl(),
      itinerary: _itineraryId
    }).then(function(post) {
      return Itinerary.findOneAndUpdate(
        { _id: _itineraryId },
        { $push: { lodging: post.id } }
      );
    });
  }
}

describe('Itinerator API resource: Lodging', function() {
  const username = faker.random.word();
  const password = 'dummyPw1234';
  const email = faker.internet.email();

  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function() {
    return User.hashPassword(password).then(password => {
      return User.create({
        username,
        password,
        email
      }).then(user => {
        testUser = user;
      });
    });
  });

  beforeEach(function() {
    return seedItineraryData();
  });

  beforeEach(function() {
    return seedLodgingData();
  });

  afterEach(function() {
    return tearDownDb();
  });

  after(function() {
    return closeServer();
  });

  describe('GET endpoint', function() {
    it('should return single selected lodging', function() {
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
      return Lodging.findOne()
        .then(function(res) {
          let result = res;
          return result;
        })
        .then(function(result) {
          let id = result._id;
          return chai
            .request(app)
            .get(`/api/lodging/${id}`)
            .set('Authorization', `Bearer ${token}`)
            .then(function(res) {
              let _result = res.body;
              let _id = _result.id;
              expect(_result).to.exist;
              expect(_result).to.be.a('object');
              expect(_id).to.equal(id.toString());
            });
        });
    });

    it('should return post with correct fields', function() {
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
      return Lodging.findOne()
        .then(function(res) {
          let result = res.toJSON();
          return result;
        })
        .then(function(result) {
          let id = result._id;
          return chai
            .request(app)
            .get(`/api/lodging/${id}`)
            .set('Authorization', `Bearer ${token}`)
            .then(function(res) {
              let _result = res.body;
              _result.should.include.keys(
                'check_in',
                'check_out',
                'phone',
                'email',
                'notes',
                'confirmation',
                'itinerary'
              );
              _result.itinerary.should.equal(result.itinerary.toString());
              _result.address.should.equal(result.address);
              _result.phone.should.equal(result.phone);
              _result.email.should.equal(result.email);
              _result.notes.should.equal(result.notes);
              _result.confirmation.should.equal(result.confirmation);
            });
        });
    });
  });

  describe('POST endpoint', function() {
    it('should create a new lodging and add record in itinerary', function() {
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
      let _result;
      const newEntry = {
        check_in: faker.date.future(),
        check_out: faker.date.future(),
        address: '500 Market Street Philadelphia, PA',
        phone: '215-112-5431',
        email: 'reservations@hotel.com',
        notes: 'Wyndham Hotel',
        confirmation: 'email.gif',
        itinerary: _itineraryId
      };
      return chai
        .request(app)
        .post('/api/lodging')
        .set('Authorization', `Bearer ${token}`)
        .send(newEntry)
        .then(function(res) {
          _result = res.body;
          _result.should.include.keys(
            'check_in',
            'check_out',
            'phone',
            'email',
            'notes',
            'confirmation',
            'itinerary'
          );
          _result.itinerary.should.equal(newEntry.itinerary._id.toString());
          _result.address.should.equal(newEntry.address);
          _result.phone.should.equal(newEntry.phone);
          _result.email.should.equal(newEntry.email);
          _result.notes.should.equal(newEntry.notes);
          _result.confirmation.should.equal(newEntry.confirmation);
          _result.id.should.not.be.null;
          return Lodging.findById(_result.id);
        })
        .then(function(entry) {
          entry.notes.should.equal(newEntry.notes);
          entry.address.should.equal(newEntry.address);
          entry.phone.should.equal(newEntry.phone);
          entry.email.should.equal(newEntry.email);
          entry.itinerary
            .toString()
            .should.equal(newEntry.itinerary.toString());
          return Itinerary.find({ _id: _itineraryId }).then(function(post) {
            assert
              .that(post[0].lodging.toString())
              .is.containing(_result.id.toString());
          });
        });
    });
  });

  describe('PUT endpoint', function() {
    it('should update selected lodging', function() {
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
        check_in: faker.date.future(),
        check_out: faker.date.future(),
        address: '500 Market Street Philadelphia, PA 19106',
        phone: '215-112-5431',
        email: 'reservations@wyndham.com',
        notes: 'Wyndham Hotel, across from Quaker Church.',
        confirmation: 'email.gif',
        itinerary: _itineraryId
      };
      return Lodging.findOne()
        .then(function(result) {
          updateData.id = result.id;
          return chai
            .request(app)
            .put(`/api/lodging/${updateData.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updateData);
        })
        .then(res => {
          res.should.have.status(200);
          return Lodging.findById(updateData.id);
        })
        .then(function(_result) {
          _result.itinerary.toString().should.equal(_itineraryId.toString());
          _result.notes.should.equal(updateData.notes);
          _result.address.should.equal(updateData.address);
          _result.phone.should.equal(updateData.phone);
          _result.email.should.equal(updateData.email);
          _result.confirmation.should.equal(updateData.confirmation);
        });
    });
  });
  describe('DELETE endpoint', function() {
    it('should delete selected lodging and update itinerary record', function() {
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

      return Lodging.findOne()
        .then(post => {
          entry = post;
          return chai
            .request(app)
            .delete(`/api/lodging/${entry.id}`)
            .set('Authorization', `Bearer ${token}`);
        })
        .then(function(res) {
          res.should.have.status(204);
          return Lodging.findById(entry.id);
        })
        .then(_post => {
          should.not.exist(_post);
          return Itinerary.find({ _id: entry.itinerary }).then(function(
            itinerary
          ) {
            assert
              .that(itinerary[0].lodging.toString())
              .is.not.containing(entry.id);
          });
        });
    });
  });
});
