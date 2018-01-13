var mongoose = require('mongoose');
var mongooseSchema =  mongoose.Schema;

var model = null;

module.exports = function(){
  var schema = mongooseSchema({
    name: {
      type: String,
      required:true,
    },
    email: {
      type: String,
      required:true,
    },
    password: {
      type: String,
      required:true,
    },
    isEnabled : {
      type: Boolean,
      required:true,
    },
    role: {
      type: String,
      required:true,
    }
  });

  model = model ? model : mongoose.model('users', schema);

  return model;
};
