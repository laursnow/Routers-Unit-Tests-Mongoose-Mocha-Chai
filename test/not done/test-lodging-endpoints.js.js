// 'use strict';

// const chai = require('chai');
// const chaiHttp = require('chai-http');
// const faker = require('faker');
// const mongoose = require('mongoose');
// require('dotenv').config();
// const { Entry } = require('../entries/models');
// const { User } = require('../users/models');
// const { JWT_SECRET } = require('../config');
// const jwt = require('jsonwebtoken');
// const { closeServer, runServer, app } = require('../server');
// const { TEST_DATABASE_URL } = require('../config');
// const should = chai.should();
// chai.use(chaiHttp);

// function tearDownDb() {
//   return new Promise((resolve, reject) => {
//     mongoose.connection.dropDatabase()
//       .then(result => resolve(result))
//       .catch(err => reject(err));
//   });
// }

// let testUser;

// function seedEntryData() {
//   const seedData = [];
//   for (let i = 1; i <= 10; i++) {
//     seedData.push({
//       title: faker.lorem.sentence(),
//       content: faker.lorem.paragraph(),
//       contentDate: '2/20/19',
//       postDate: '3/10/19',
//       tags: faker.random.words(), 
//       user: testUser
//     });
//   }
//   return Entry.insertMany(seedData);
// }

// describe('dream journal API resource', function () {
//   const username = 'dummyUser';
//   const password = 'dummyPw1234';
//   const email = 'dummyEmail@email.com';

//   before(function () {
//     return runServer(TEST_DATABASE_URL);
//   });

//   beforeEach(function() {
//     return User.hashPassword(password).then(password => {
//       return User.create({
//         username,
//         password,
//         email
//       })
//         .then((user) => {
//           testUser = user;});
//     }
//     );});

//   beforeEach(function () {
//     return seedEntryData();
//   });

//   afterEach(function () {
//     return tearDownDb();
//   });

//   after(function () {
//     return closeServer();
//   });


//   describe('GET endpoint', function () {

//     it('should return all existing posts by logged in user', function () {
  
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

//       let res;
//       return chai.request(app)
//         .get('/entries')
//         .set( 'Authorization', `Bearer ${ token }` )
//         .then(_res => {
//           res = _res;
//           res.should.have.status(200);
//           res.body.should.have.lengthOf.at.least(1);
//           return Entry.count();
//         })
//         .then(count => {
//           res.body.should.have.lengthOf(count);
//         });
//     });

//     it('should return posts with right fields', function () {
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

//       let resEntry;
//       return chai.request(app)
//         .get('/entries')
//         .set( 'Authorization', `Bearer ${ token }` )
//         .then(function (res) {

//           res.should.have.status(200);
//           res.should.be.json;
//           res.body.should.be.a('array');
//           res.body.should.have.lengthOf.at.least(1);

//           res.body.forEach(function (entry) {
//             entry.should.be.a('object');
//             entry.should.include.keys('id', 'title', 'content', 'contentDate', 'postDate', 'tags');
//           });
//           resEntry = res.body[0];
//           return Entry.findById(resEntry.id);
//         })
//         .then(entry => {
//           resEntry.title.should.equal(entry.title);
//           resEntry.content.should.equal(entry.content);
//         });
//     });
//   });



//   describe('POST endpoint', function () {
//     it('should add a new entry', function () {

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
//         title: faker.lorem.sentence(),
//         content: faker.lorem.paragraph(),
//         contentDate: '2/20/19',
//         postDate: '3/10/2019',
//         tags: faker.random.words(), 
//         user: testUser
//       };

//       return chai.request(app)
//         .post('/entries')
//         .set( 'Authorization', `Bearer ${ token }` )
//         .send(newEntry)
//         .then(function (res) {
//           res.should.have.status(201);
//           res.should.be.json;
//           res.body.should.be.a('object');
//           res.body.should.include.keys('id', 'title', 'content', 'contentDate', 'postDate', 'tags');
//           res.body.title.should.equal(newEntry.title);
//           res.body.id.should.not.be.null;
//           res.body.content.should.equal(newEntry.content);
//           return Entry.findById(res.body.id);
//         })
//         .then(function (entry) {
//           entry.title.should.equal(newEntry.title);
//           entry.content.should.equal(newEntry.content);
//         });
//     });
//   });

  
//   describe('PUT endpoint', function () {
        
//     it('should update fields you send over', function () {

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

//       const updateData = {
//         title: 'I won the lottery',
//         content: 'I had a dream I won the lottery',
//         user: testUser
//       };
//       return Entry
//         .findOne()
//         .then(post => {
//           updateData.id = post.id;

//           return chai.request(app)
//             .put('/entries')
//             .set( 'Authorization', `Bearer ${ token }` )
//             .send(updateData);
//         })
//         .then(res => {
//           res.should.have.status(200);
//           return Entry.findById(updateData.id);
//         })
//         .then(entry => {
//           entry.title.should.equal(updateData.title);
//           entry.content.should.equal(updateData.content);
//         });
//     });
//   });

//   describe('DELETE endpoint', function () {
//     it('should delete a post', function () {

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

//       let entry;

//       return Entry
//         .findOne()
//         .then(post => {
//           entry = post;
//           return chai.request(app)
//             .delete('/entries')
//             .set( 'Authorization', `Bearer ${ token }` )
//             .send({id: post.id});
//         })
//         .then(res => {
//           res.should.have.status(204);
//           return Entry.findById(entry.id);
//         })
//         .then(post => {
//           should.not.exist(post);
          
//         });
//     });
//   });
// });
