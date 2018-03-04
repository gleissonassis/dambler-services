var request               = require('supertest');
var chai                  = require('chai');
var expect                = chai.expect;
var UserBO                = require('../../../src/business/userBO');
var DAOFactory            = require('../../../src/daos/daoFactory');

describe('api', function(){
  var server;
  var bo = new UserBO({
    userDAO: DAOFactory.getDAO('user')
  });

  before(function(){
    server = require('../../../src/server');

    return bo.clear();
  });

  after(function(){
    return bo.clear();
  });

  describe('/v1/users', function(){
    describe('basic token validation', function(){
      it('should fail to perform GET to the route /users without a token (403)', function() {
        return request(server)
          .get('/v1/users')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403);
      });

      it('should fail to perform GET to the route /users/me without a token (403)', function() {
        return request(server)
          .get('/v1/users')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403);
      });

      it('should fail to perform PUT to the route /users/me without a token (403)', function() {
        return request(server)
          .put('/v1/users/me')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403);
      });

      it('should not fail to perform POST to the route /auctions without a token (422)', function() {
        return request(server)
          .post('/v1/users')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(422);
      });

      it('should not fail to perform POST to the route /auctions without a token (422)', function() {
        return request(server)
          .post('/v1/users/auth')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(422);
      });
    });

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
          expect(res.body.token).to.not.be.undefined;

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
          expect(res.body.token).to.be.undefined;
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

    it('should return the current user accessing the rout /me', function() {
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
          token = res.body.token;

          return request(server)
            .get('/v1/users/me')
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + token)
            .expect('Content-Type', /json/)
            .expect(200);
        }).then(function(res){
          expect(res.body.name).to.be.equal('User');
          expect(res.body.email).to.be.equal('newemail@gmail.com');
          expect(res.body.role).to.be.equal('user');
          expect(res.body.password).to.be.undefined;
          expect(res.body.wallet).to.not.undefined;
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
               //during this tests the current user has made 5 logins, of course
               //it can be changed according to the test flow
              expect(res.body.length).to.be.equal(5);
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
