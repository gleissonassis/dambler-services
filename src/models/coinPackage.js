var mongoose = require('mongoose');
var mongooseSchema =  mongoose.Schema;

var model = null;

module.exports = function(){
  var schema = mongooseSchema({
    key: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    hint: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    coins: {
      type: Number,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    averageValue: {
      type: Number,
      required: true
    },
    imageUrl: {
      type: String,
      required: true
    },
    isEnabled: {
      type: Boolean,
      required: true
    },
  });

  model = model ? model : mongoose.model('coinPackages', schema);

  return model;
};
