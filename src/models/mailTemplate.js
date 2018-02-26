var mongoose = require('mongoose');
var mongooseSchema =  mongoose.Schema;

var model = null;

module.exports = function(){
  var schema = mongooseSchema({
    key: {
      type: String,
      required: true
    },
    htmlTemplate: {
      type: String,
      required: true
    },
    textTemplate: {
      type: String,
      required: true
    },
    from: {
      type: String,
      required: true
    },
    subject: {
      type: String,
      required: true
    },
    isEnabled: {
      type: Boolean,
      required: true
    },
  });

  model = model ? model : mongoose.model('mailTemplates', schema);

  return model;
};
