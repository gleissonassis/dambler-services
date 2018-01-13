var md5           = require('../../src/helpers/md5');
var chai          = require('chai');
var expect        = chai.expect;

describe('helpers > md5', function(){
  it('should crate a hash', function() {
    expect('5ebe2294ecd0e0f08eab7690d2a6ee69').to.be.equal(md5('secret'));
  });
});
