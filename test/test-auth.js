'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
require('dotenv').config();
const { User } = require('../api/users/models');
const { JWT_SECRET } = require('../config');
const jwt = require('jsonwebtoken');
const { closeServer, runServer, app } = require('../server');
const { TEST_DATABASE_URL } = require('../config');
chai.use(chaiHttp);

describe('Auth endpoints', function() {
  const username = 'exampleuser';
  const password = 'examplePass';
  const email = 'email@email.com';
  const author_of = [];
  let id = null;

  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  after(function() {
    return closeServer();
  });

  beforeEach(function() {
    return User.hashPassword(password).then(password =>
      User.create({
        username,
        password,
        email,
        author_of
      }).then(function(user) {
        id = user.id;
      })
    );
  });

  afterEach(function() {
    return User.remove({});
  });

  describe('/auth/login', function() {
    it('Should reject requests with no credentials', function() {
      return chai
        .request(app)
        .post('/auth/login')
        .then(res => {
          expect(res).to.have.status(400);
        })
        .catch(err => {
          if (err instanceof chai.AssertionError) {
            throw err;
          }
        });
    });
    it('Should reject requests with incorrect usernames', function() {
      return chai
        .request(app)
        .post('/auth/login')
        .send({ username: 'wrongUsername', password })
        .then(res => {
          expect(res).to.have.status(401);
        })
        .catch(err => {
          if (err instanceof chai.AssertionError) {
            throw err;
          }
        });
    });
    it('Should reject requests with incorrect passwords', function() {
      return chai
        .request(app)
        .post('/auth/login')
        .send({ username, password: 'wrongPassword' })
        .then(res => {
          expect(res).to.have.status(401);
        })
        .catch(err => {
          if (err instanceof chai.AssertionError) {
            throw err;
          }
        });
    });
    it('Should return a valid auth token', function() {
      return chai
        .request(app)
        .post('/auth/login')
        .send({ username, password })
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          const token = res.body.authToken;
          expect(token).to.be.a('string');
          const payload = jwt.verify(token, JWT_SECRET, {
            algorithm: ['HS256']
          });
          expect(payload.user).to.deep.equal({
            username,
            email,
            author_of,
            id
          });
        });
    });
  });

  describe('/auth/refresh', function() {
    it('Should reject requests with no credentials', function() {
      return chai
        .request(app)
        .post('/auth/refresh')
        .then(res => {
          expect(res).to.have.status(401);
        })
        .catch(err => {
          if (err instanceof chai.AssertionError) {
            throw err;
          }
        });
    });
    it('Should reject requests with an invalid token', function() {
      const token = jwt.sign(
        {
          username,
          email
        },
        'wrongSecret',
        {
          algorithm: 'HS256',
          expiresIn: '7d'
        }
      );

      return chai
        .request(app)
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(401);
        })
        .catch(err => {
          if (err instanceof chai.AssertionError) {
            throw err;
          }
        });
    });
    it('Should reject requests with an expired token', function() {
      const token = jwt.sign(
        {
          user: {
            username,
            email
          },
          exp: Math.floor(Date.now() / 1000) - 10
        },
        JWT_SECRET,
        {
          algorithm: 'HS256',
          subject: username
        }
      );

      return chai
        .request(app)
        .post('/auth/refresh')
        .set('authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(401);
        })
        .catch(err => {
          if (err instanceof chai.AssertionError) {
            throw err;
          }
        });
    });
    it('Should return a valid auth token with a newer expiry date', function() {
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
      const decoded = jwt.decode(token);

      return chai
        .request(app)
        .post('/auth/refresh')
        .set('authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          const token = res.body.authToken;
          expect(token).to.be.a('string');
          const payload = jwt.verify(token, JWT_SECRET, {
            algorithm: ['HS256']
          });
          expect(payload.exp).to.be.at.least(decoded.exp);
        });
    });
  });
});
