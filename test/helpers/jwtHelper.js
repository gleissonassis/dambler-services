var JWTHelper     = require('../../src/helpers/jwtHelper');
var chai          = require('chai');
var expect        = chai.expect;

describe('helpers > JWT Helper', function(){
  it('should create a valid token', function() {
    var jwtHelper = new JWTHelper();
    jwtHelper.secret = 'secret';
    jwtHelper.expiresIn = '';

    expect('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.'+
           'eyJpZCI6MTAsIm5hbWUiOiJOYW1lIiwiaWF0IjoxLCJleHAiOjM2MDF9.' +
           'NKQU_-CyjFPQl6eASr339BeXCneBUYM4YPGj0-baG54')
           .to.be.equal(jwtHelper.createToken({id: 10, name: 'Name', iat: 1}));
  });
});
