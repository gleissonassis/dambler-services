var request               = require('supertest');
var chai                  = require('chai');
var expect                = chai.expect;
var UserBO                = require('../../../src/business/userBO');
var PaymentTransactionBO  = require('../../../src/business/paymentTransactionBO');
var CoinPackageBO         = require('../../../src/business/coinPackageBO');
var DAOFactory            = require('../../../src/daos/daoFactory');
var ModelParser           = require('../../../src/models/modelParser');
var JWTHelper             = require('../../../src/helpers/jwtHelper');
var PayerServicesHelper   = require('../../../src/helpers/payerServicesHelper');
var RequestHelper         = require('../../../src/helpers/requestHelper');

describe('api', function(){
  var server;

  var userBO = new UserBO({
    userDAO: DAOFactory.getDAO('user'),
    modelParser: new ModelParser(),
    jwtHelper: new JWTHelper()
  });

  var coinPackageBO = new CoinPackageBO({
    coinPackageDAO: DAOFactory.getDAO('coinPackage'),
    modelParser: new ModelParser()
  });

  paymentTransactionBO = new PaymentTransactionBO({
    paymentTransactionDAO: DAOFactory.getDAO('paymentTransaction'),
    modelParser: new ModelParser(),
    coinPackageBO: coinPackageBO,
    payerServicesHelper: new PayerServicesHelper({
      requestHelper: new RequestHelper({
        request: require('request')
      })
    }),
    userBO: userBO
  });

  var adminUser = {
    name: 'Admin User',
    email: 'admin@gmail.com',
    password: '123456',
    role: 'admin',
    confirmation: {
      key: '1'
    },
    wallet: {
      coins: 0,
      averageValue: 0
    },
    internalKey: '1'
  };

  var user = {
    name: 'User',
    email: 'user@gmail.com',
    password: '123456',
    role: 'user',
    confirmation: {
      key: '1'
    },
    wallet: {
      coins: 0,
      averageValue: 0
    },
    internalKey: '1'
  };

  var connectionInfo = {
    ip: 'fake',
    userAgent: 'fake'
  };

  var coinPackage = {
    key: 'key',
    title: 'title',
    hint: 'hint',
    description: 'description',
    coins: 500,
    price: 399.90,
    averageValue: 0.798,
    imageUrl: 'imageUrl'
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
        return coinPackageBO.clear();
      })
      .then(function(){
        return coinPackageBO.save(coinPackage);
      })
      .then(function(r) {
        coinPackage.id = r.id;
        return paymentTransactionBO.clear();
      });
  });

  after(function(){
    var chain = Promise.resolve();

    return chain
      .then(function() {
        return userBO.clear();
      })
      .then(function() {
        return coinPackageBO.clear();
      })
      .then(function() {
        return paymentTransactionBO.clear();
      });
  });

  describe('/v1/payments-transactions', function(){
    it('should store a new payment transaction', function() {
      this.timeout(5000);

      return request(server)
        .post('/v1/payments-transactions')
        .send({
          coinPackageId: coinPackage.id,
        })
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + user.token)
        .expect('Content-Type', /json/)
        .expect(201)
        .then(function(res) {
          console.log(res.body);
          expect(true).to.be.true;
          expect(res.body).to.have.property('id');
          expect(res.body.coinPackageId).to.be.equal(coinPackage.id);
          expect(res.body.coins).to.be.equal(coinPackage.coins);
          expect(res.body.price).to.be.equal(coinPackage.price);
          expect(res.body.payerTracking).to.have.property('id');
          expect(res.body.payerTracking).to.have.property('checkout');
          expect(res.body.payerTracking.checkout).to.have.property('paymentUrl');
          expect(res.body.payerTracking.checkout).to.have.property('date');
          expect(res.body.payerTracking.checkout).to.have.property('code');
          expect(res.body.status.code).to.be.equal(1);
          expect(res.body.status.description).to.be.equal('Waiting for payment');
          expect(res.body.user.id).to.be.equal(user.id);
          expect(res.body.user.name).to.be.equal(user.name);
        });
    });
  });
});
