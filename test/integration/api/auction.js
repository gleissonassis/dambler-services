var request               = require('supertest');
var chai                  = require('chai');
var expect                = chai.expect;
var UserBO                = require('../../../src/business/userBO');
var AuctionBO             = require('../../../src/business/auctionBO');
var DAOFactory            = require('../../../src/daos/daoFactory');
var ModelParser           = require('../../../src/models/modelParser');
var JWTHelper             = require('../../../src/helpers/jwtHelper');

describe('api', function(){
  var server;
  var userBO = new UserBO({
    userDAO: DAOFactory.getDAO('user'),
    modelParser: new ModelParser(),
    jwtHelper: new JWTHelper()
  });

  var auctionBO = new AuctionBO({
    auctionDAO: DAOFactory.getDAO('auction'),
    modelParser: new ModelParser(),
  });

  var adminUser = {
    name: 'Admin User',
    email: 'admin@gmail.com',
    password: '123456',
    wallet: {
      coins: 10,
      averageValue: 0
    },
    role: 'admin'
  };

  var user = {
    name: 'User',
    email: 'user@gmail.com',
    password: '123456',
    wallet: {
      coins: 0,
      averageValue: 0
    },
    role: 'user'
  };

  var connectionInfo = {
    ip: 'fake',
    userAgent: 'fake'
  };

  before(function(){
    server = require('../../../src/server');
    var chain = Promise.resolve();

    //before start the tests it is necessary create an admin user, simple user
    // and get the tokens for each one of them
    return chain
      .then(function() {
        return userBO.clear();
      })
      .then(function() {
        return userBO.createUserWithoutValidations(adminUser);
      })
      .then(function(r) {
        adminUser.id = r.id;
        return userBO.generateToken(adminUser.email, adminUser.password, connectionInfo);
      })
      .then(function(r) {
        adminUser.token = r.token;
        return userBO.createUserWithoutValidations(user);
      })
      .then(function(r) {
        user.id = r.id;
        return userBO.generateToken(user.email, user.password, connectionInfo);
      })
      .then(function(r) {
        user.token = r.token;
        return auctionBO.clear();
      });
  });

  after(function(){
    var chain = Promise.resolve();

    return chain
      .then(function() {
        return userBO.clear();
      })
      .then(function() {
        return auctionBO.clear();
      });
  });

  describe('/v1/auctions', function(){
    describe('basic token validation', function(){
      it('should not fail to perform GET to the route /auctions without a token (404)', function() {
        return request(server)
          .get('/v1/auctions')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(function(res) {
            expect(res.statusCode).to.not.equal(403);
          });
      });

      it('should not fail to perform GET to the route /auctions/online without a token', function() {
        return request(server)
          .get('/v1/auctions')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(function(res) {
            expect(res.statusCode).to.not.equal(403);
          });
      });

      it('should fail to perform POST to the route /auctions without a token (403)', function() {
        return request(server)
          .post('/v1/auctions')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403);
      });

      it('should fail to perform GET the route /auctions/id without a token (403)', function() {
        return request(server)
          .get('/v1/auctions/objectid')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403);
      });

      it('should fail to perform DELETE to the route /auctions/id without a token (403)', function() {
        return request(server)
          .delete('/v1/auctions/objectid')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403);
      });
    });

    it('should list auctions with a valid token', function() {
      return request(server)
        .get('/v1/auctions')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + adminUser.token)
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('should store a new auction', function() {
      var startDate = new Date(2017, 11, 31, 20, 01, 00);
      var duration = 20;

      //computing the expires date
      var expiresOn = new Date(startDate.getTime());
      expiresOn.setSeconds(expiresOn.getSeconds() + duration);

      var auctionId = null;

      return request(server)
        .post('/v1/auctions')
        .send({
          startDate: startDate,
          duration: duration,
          product: {
            name: 'name',
            description: 'description',
            value: 1000.99,
            imageUrl: 'imageUrl',
            referenceCode: 'referenceCode'
          }
        })
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + adminUser.token)
        .expect('Content-Type', /json/)
        .expect(201)
        .then(function(res) {
          expect(res.body).to.have.property('id');
          expect(new Date(res.body.startDate).getTime()).to.be.equal(startDate.getTime());
          expect(new Date(res.body.expiresOn).getTime()).to.be.equal(expiresOn.getTime());
          expect(res.body.duration).to.be.equal(20);
          expect(res.body.product.name).to.be.equal('name');
          expect(res.body.product.description).to.be.equal('description');
          expect(res.body.product.imageUrl).to.be.equal('imageUrl');
          expect(res.body.product.referenceCode).to.be.equal('referenceCode');
          expect(res.body.product.value).to.be.equal(1000.99);

          return res.body.id;
        })
        .then(function(id) {
          auctionId = id;
          return request(server)
            .get('/v1/auctions')
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + adminUser.token)
            .expect('Content-Type', /json/)
            .expect(200);
        })
        .then(function(res) {
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.lengthOf(1);
          expect(res.body[0].id).to.be.equal(auctionId);
        });
    });

    it('should fail to store a new auction using a regular user token', function() {
      return request(server)
        .post('/v1/auctions')
        .send({})
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + user.token)
        .expect('Content-Type', /json/)
        .expect(401);
    });

    it('should update an auction', function() {
      return request(server)
        .get('/v1/auctions')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + adminUser.token)
        .expect('Content-Type', /json/)
        .expect(200)
        .then(function(res) {
          return request(server)
            .put('/v1/auctions/' + res.body[0].id)
            .send({
              product: {
                name: 'new product'
              }
            })
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + adminUser.token)
            .expect('Content-Type', /json/)
            .expect(200);
        })
        .then(function(res) {
          expect(res.body.duration).to.be.equal(20);
          expect(res.body.product.name).to.be.equal('new product');
          expect(res.body.product.description).to.be.equal('description');
          expect(res.body.product.imageUrl).to.be.equal('imageUrl');
          expect(res.body.product.referenceCode).to.be.equal('referenceCode');
          expect(res.body.product.value).to.be.equal(1000.99);
        });
    });

    it('should fail to update an auction without using a regular user token', function() {
      return request(server)
        .get('/v1/auctions')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + user.token)
        .expect('Content-Type', /json/)
        .expect(200)
        .then(function(res) {
          return request(server)
            .put('/v1/auctions/' + res.body[0].id)
            .send({})
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + user.token)
            .expect('Content-Type', /json/)
            .expect(401);
        });
    });

    it('should fail to disable an auction with a regular user token', function() {
      return request(server)
        .get('/v1/auctions')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + user.token)
        .expect('Content-Type', /json/)
        .expect(200)
        .then(function(res) {
          return request(server)
            .delete('/v1/auctions/' + res.body[0].id)
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + user.token)
            .expect('Content-Type', /json/)
            .expect(401);
        });
    });

    it('should disable an auction with a admin user token', function() {
      var auctionId = null;

      return request(server)
        .get('/v1/auctions')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + adminUser.token)
        .expect('Content-Type', /json/)
        .expect(200)
        .then(function(res) {
          auctionId = res.body[0].id;
          return request(server)
            .delete('/v1/auctions/' + res.body[0].id)
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + adminUser.token)
            .expect('Content-Type', /json/)
            .expect(200);
        })
        .then(function() {
          return request(server)
            .get('/v1/auctions/' + auctionId)
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + adminUser.token)
            .expect('Content-Type', /json/)
            .expect(404);
        });
    });

    it('should return only not expired auctions', function() {
      var chain = Promise.resolve();

      var future = new Date();
      var past = new Date();
      future.setHours(future.getHours() + 1);
      past.setHours(past.getHours() - 1);

      return chain
        .then(function() {
          return request(server)
            .post('/v1/auctions')
            .send({
              startDate: future,
              duration: 20,
              product: {
                name: 'Future Product',
                description: 'description',
                value: 1000.99,
                imageUrl: 'imageUrl',
                referenceCode: 'referenceCode'
              }
            })
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + adminUser.token)
            .expect('Content-Type', /json/)
            .expect(201);
        })
        .then(function() {
          return request(server)
            .post('/v1/auctions')
            .send({
              startDate: past,
              duration: 20,
              product: {
                name: 'Past Product',
                description: 'description',
                value: 1000.99,
                imageUrl: 'imageUrl',
                referenceCode: 'referenceCode'
              }
            })
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + adminUser.token)
            .expect('Content-Type', /json/)
            .expect(201);
        })
        .then(function() {
          return request(server)
            .get('/v1/auctions')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200);
        })
        .then(function(res) {
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.lengthOf.at.least(2);

          return request(server)
            .get('/v1/auctions/online')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200);
        })
        .then(function(res) {
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.lengthOf(1);
          expect(res.body[0].product.name).to.be.equal('Future Product');
        });
    });

    it('should allow a user do a bid for a oppend auction', function() {
      var chain = Promise.resolve();

      var future = new Date();
      var past = new Date();
      future.setHours(future.getHours() + 1);
      past.setHours(past.getHours() - 1);

      var auction = null;
      var wallet = null;

      return chain
        //getting the current users informations to evaluate the wallet
        .then(function() {
          return request(server)
            .get('/v1/users/me')
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + adminUser.token)
            .expect('Content-Type', /json/)
            .expect(200);
        })
        //creating the auction
        .then(function(r) {
          wallet = r.body.wallet;

          return request(server)
            .post('/v1/auctions')
            .send({
              startDate: future,
              duration: 20,
              product: {
                name: 'Future Product',
                description: 'description',
                value: 1000.99,
                imageUrl: 'imageUrl',
                referenceCode: 'referenceCode'
              }
            })
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + adminUser.token)
            .expect('Content-Type', /json/)
            .expect(201);
        })
        //performing a bid
        .then(function(r) {
          auction = r.body;

          return request(server)
            .post('/v1/auctions/' + auction.id + '/bids')
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + adminUser.token)
            .expect('Content-Type', /json/)
            .expect(201);
        })
        //getting the current users informations to evaluate the wallet again
        .then(function() {
          return request(server)
            .get('/v1/users/me')
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + adminUser.token)
            .expect('Content-Type', /json/)
            .expect(200);
        })
        //evaluating the wallet
        .then(function(r) {
          expect(r.body.wallet.coins).to.be.equal(wallet.coins - 1);
        });
    });
  });
});
