var StringReplacerHelper    = require('../../src/helpers/stringReplacerHelper');
var chai                    = require('chai');
var expect                  = chai.expect;

describe('helpers', function(){
  describe('stringReplacerHelper', function(){
    it('should replace a text inside a string', function() {
      var helper = new StringReplacerHelper();

      expect('Var1 = Var1 + 2').to.be.equal(helper.replaceAll('${v} = ${v} + 2', '${v}', 'Var1'));
    });

    it('should replace a complext text inside a string', function() {
      var helper = new StringReplacerHelper();

      expect('Var1 = ${v} + 2').to.be.equal(helper.replaceAll('${[v\\0.]} = ${v} + 2', '${[v\\0.]}', 'Var1'));
    });
  });
});
