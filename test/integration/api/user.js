var request               = require('supertest');
var chai                  = require('chai');
var expect                = chai.expect;
var UserBO                = require('../../../src/business/userBO');
var UserBO                = require('../../../src/business/userBO');
var DAOFactory            = require('../../../src/daos/daoFactory');
var ModelParser           = require('../../../src/models/modelParser');
var JWTHelper             = require('../../../src/helpers/jwtHelper');

describe('api', function(){
  var server;
  var bo = new UserBO({
    userDAO: DAOFactory.getDAO('user'),
    modelParser: new ModelParser(),
    jwtHelper: new JWTHelper()
  });

  before(function(){
    server = require('../../../src/server');

    return bo.clear();
  });

  after(function(){
    return bo.clear();
  });

  describe('/v1/users', function(){
    it('should fail to list users without a valid token', function() {
      return request(server)
        .get('/v1/users')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(403);
    });

    it('should store a valid user', function() {
      var _id = null;
      return request(server)
        .post('/v1/users')
        .send({
          name: 'User',
          email: 'email@gmail.com',
          password: '123456'
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(201)
        .then(function(res){
          expect(res.body).to.have.property('id');
          expect(res.body.name).to.be.equal('User');
          expect(res.body.email).to.be.equal('email@gmail.com');
          expect(res.body.role).to.be.equal('user');
          expect(res.body.password).to.be.undefined;

          return res;
        }).then(function(res){
          _id = res.body.id;

          return request(server)
            .get('/v1/users/' + _id)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200);
        }).then(function(res){
          expect(res.body.id).to.be.equal(_id);
          expect(res.body.name).to.be.equal('User');
          expect(res.body.email).to.be.equal('email@gmail.com');
          expect(res.body.role).to.be.equal('user');
          expect(res.body.password).to.be.undefined;
        });
    });

    it('should return 404 for a invalid authentication', function() {
      return request(server)
        .post('/v1/users/auth')
        .send({
          email: 'email@gmail.com',
          password: '1234567'
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('should update a valid user', function() {
      var token = null;
      return request(server)
        .post('/v1/users/auth')
        .send({
          email: 'email@gmail.com',
          password: '123456'
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(function(res){
          expect(res.body).to.have.property('id');
          expect(res.body.name).to.be.equal('User');
          expect(res.body.email).to.be.equal('email@gmail.com');
          expect(res.body.role).to.be.equal('user');
          expect(res.body.password).to.be.undefined;

          return res;
        }).then(function(res){
          token = res.body.token;

          return request(server)
            .put('/v1/users/' + res.body.id)
            .send({
              email: 'newemail@gmail.com'
            })
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + token)
            .expect('Content-Type', /json/)
            .expect(200);
        }).then(function(res){
          expect(res.body.name).to.be.equal('User');
          expect(res.body.email).to.be.equal('newemail@gmail.com');
          expect(res.body.role).to.be.equal('user');
          expect(res.body.password).to.be.undefined;
        });
    });

    it('should list users with a valid token', function() {
      var token = null;
      return request(server)
        .post('/v1/users/auth')
        .send({
          email: 'newemail@gmail.com',
          password: '123456'
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(function(res){
          expect(res.body).to.have.property('id');
          expect(res.body.name).to.be.equal('User');
          expect(res.body.email).to.be.equal('newemail@gmail.com');
          expect(res.body.role).to.be.equal('user');
          expect(res.body.password).to.be.undefined;

          return res;
        }).then(function(res){
          token = res.body.token;

          return request(server)
            .get('/v1/users')
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + token)
            .expect('Content-Type', /json/)
            .expect(200);
        }).then(function(res){
          expect(res.body.length).to.be.equal(1);
          expect(res.body[0].name).to.be.equal('User');
          expect(res.body[0].email).to.be.equal('newemail@gmail.com');
          expect(res.body[0].role).to.be.equal('user');
          expect(res.body[0].password).to.be.undefined;
        });
    });

    it('should list the login history', function() {
      var token = null;
      var id = null;
      return request(server)
        .post('/v1/users/auth')
        .send({
          email: 'newemail@gmail.com',
          password: '123456'
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(function(res){
          expect(res.body).to.have.property('id');
          expect(res.body.name).to.be.equal('User');
          expect(res.body.email).to.be.equal('newemail@gmail.com');
          expect(res.body.role).to.be.equal('user');
          expect(res.body.password).to.be.undefined;

          return res;
        })
        .then(function(res){
          token = res.body.token;
          id = res.body.id;

          return request(server)
            .get('/v1/users/' + id + '/login-history')
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + token)
            .expect('Content-Type', /json/)
            .expect(200)
            .then(function(res) {
              expect(res.body.length).to.be.equal(3);
            });
        });
    });

    it('should store a transaction', function() {
      var token = null;
      var id = null;
      return request(server)
        .post('/v1/users/auth')
        .send({
          email: 'newemail@gmail.com',
          password: '123456'
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(function(res){
          expect(res.body).to.have.property('id');
          expect(res.body.name).to.be.equal('User');
          expect(res.body.email).to.be.equal('newemail@gmail.com');
          expect(res.body.role).to.be.equal('user');
          expect(res.body.password).to.be.undefined;

          return res;
        })
        .then(function(res){
          token = res.body.token;
          id = res.body.id;

          return request(server)
            .post('/v1/users/' + id + '/wallet/transactions')
            .send({
              date: Date.now(),
              transactionType: 1,
              coins: 10,
              averageValue: 1,
              description: 'Transaction'
            })
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + token)
            .expect('Content-Type', /json/)
            .expect(200)
            .then(function(res) {
              console.log(res.body);
            });
        });
    });

    it('should remove an user with a valid token', function() {
      var token = null;
      var id = null;
      return request(server)
        .post('/v1/users/auth')
        .send({
          email: 'newemail@gmail.com',
          password: '123456'
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(function(res){
          expect(res.body).to.have.property('id');
          expect(res.body.name).to.be.equal('User');
          expect(res.body.email).to.be.equal('newemail@gmail.com');
          expect(res.body.role).to.be.equal('user');
          expect(res.body.password).to.be.undefined;

          return res;
        }).then(function(res){
          token = res.body.token;
          id = res.body.id;

          return request(server)
            .delete('/v1/users/' + id)
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + token)
            .expect('Content-Type', /json/)
            .expect(200);
        }).then(function(){
          return request(server)
            .delete('/v1/users/' + id)
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + token)
            .expect(404);
        }).then(function(){
          return request(server)
            .get('/v1/users')
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + token)
            .expect(404);
        });
    });
  });
});
