var chai                = require('chai');
var expect              = chai.expect;
var DynamicTextHelper   = require('../../src/helpers/dynamicTextHelper');

describe('DynamicTextHelper', function() {
  it('should replace a variable inside a string', function() {
    var dynamic = new DynamicTextHelper();
    dynamic.entities = {
      'name': 'name',
    };

    expect('name').to.be.equal(dynamic.parse('${name}'));
  });

  it('should not replace a variable when it does not exist', function() {
    var dynamic = new DynamicTextHelper();
    expect('${name}').to.be.equal(dynamic.parse('${name}'));
  });

  it('should replace all variables inside a string', function() {
    var dynamic = new DynamicTextHelper();
    dynamic.entities = {
      'name': 'name',
      'email': 'email',
    };

    expect('name and email').to.be.equal(dynamic.parse('${name} and ${email}'));
  });

  it('should replace all variables inside a string', function() {
    var dynamic = new DynamicTextHelper();
    dynamic.entities = {
      name: 'name',
      age: 20,
        jira:  {
        summary: {
          text: 'text'
        }
      },
    };

    expect('name').to.be.equal(dynamic.parse('${name}'));
    expect('text').to.be.equal(dynamic.parse('${jira.summary.text}'));
  });

  it('checks whether the entity exists and returns the expected parse', function() {
    var dynamic = new DynamicTextHelper();
    dynamic.entities = null;

    expect('text').to.be.equal(dynamic.parse('text'));
  });

  it('should return empty when the variable is null or undefined', function() {
    var dynamic = new DynamicTextHelper();
    dynamic.entities = {
      name: null
    };

    expect('').to.be.equal(dynamic.parse('${name}'));
  });

  it('should evaluating a boolean expression', function() {
    var dynamic = new DynamicTextHelper();
    dynamic.entities = {
      entity: {
        name:'USER_NAME',
        age: 32,
        boolProperty: true
      }
    };

    expect(true).to.be.equal(dynamic.evaluate('${entity.name} == "USER_NAME"'));
    expect(false).to.be.equal(dynamic.evaluate('${entity.name} == "XPTO"'));
    expect(true).to.be.equal(dynamic.evaluate('${entity.age} == 32'));
    expect(true).to.be.equal(dynamic.evaluate('${entity.age} < 40'));
    expect(true).to.be.equal(dynamic.evaluate('${entity.boolProperty}'));
  });

  it('should return the same value when the variable is not a string', function() {
    var dynamic = new DynamicTextHelper();

    expect(123).to.be.equal(123);
    expect(true).to.be.equal(dynamic.parse(true));
    expect(1.0).to.be.equal(dynamic.parse(1.0));
    expect({id: 123}).to.deep.equal(dynamic.parse({id: 123}));
  });

  it('should return false when a invalid expression was provided', function() {
    var dynamic = new DynamicTextHelper();

    expect(false).to.be.equal(dynamic.evaluate('aa ${entity.boolProperty}'));
  });
});
