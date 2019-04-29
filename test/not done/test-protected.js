// 'use strict';
// const chai = require('chai');
// const chaiHttp = require('chai-http');
// const expect = chai.expect;
// const jwt = require('jsonwebtoken');
// require('dotenv').config();
// const {app, runServer, closeServer} = require('../server');
// const {User} = require('../users/models');
// const {JWT_SECRET} = require('../config');
// const { TEST_DATABASE_URL } = require('../config');


// chai.use(chaiHttp);

// describe('Protected endpoint', function() {
//   const username = 'exampleUser';
//   const password = 'examplePass';
//   const email = 'exampleEmail@email.com';

//   before(function() {
//     return runServer(TEST_DATABASE_URL);
//   });

//   after(function() {
//     return closeServer();
//   });

//   beforeEach(function() {
//     return User.hashPassword(password).then(password =>
//       User.create({
//         username,
//         password,
//         email
//       })
//     );
//   });

//   afterEach(function() {
//     return User.remove({});
//   });

//   describe('/entries', function() {
//     it('Should reject requests with no credentials', function() {
//       return chai
//         .request(app)
//         .get('/entries')
//         .then((res) => {
//           expect(res).to.have.status(401);
//         })
//         .catch(err => {
//           if (err instanceof chai.AssertionError) {
//             throw err;
//           }
//         });
//     });

//     it('Should reject requests with an invalid token', function() {
//       const token = jwt.sign(
//         {
//           username,
//           email
//         },
//         'wrongSecret',
//         {
//           algorithm: 'HS256',
//           expiresIn: '7d'
//         }
//       );

//       return chai
//         .request(app)
//         .get('/entries')
//         .set('Authorization', `Bearer ${token}`)
//         .then((res) => {
//           expect(res).to.have.status(401);
//         })
//         .catch(err => {
//           if (err instanceof chai.AssertionError) {
//             throw err;
//           }
//         });
//     });
//     it('Should reject requests with an expired token', function() {
//       const token = jwt.sign(
//         {
//           user: {
//             username,
//             email
//           },
//           exp: Math.floor(Date.now() / 1000) - 10
//         },
//         JWT_SECRET,
//         {
//           algorithm: 'HS256',
//           subject: username
//         }
//       );

//       return chai
//         .request(app)
//         .get('/entries')
//         .set('authorization', `Bearer ${token}`)
//         .then((res) => {
//           expect(res).to.have.status(401);
//         })
//         .catch(err => {
//           if (err instanceof chai.AssertionError) {
//             throw err;
//           }
//         });
//     });
//   });
// });
