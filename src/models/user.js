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
    },
    wallet : {
      coins : {
        required: true,
        type: Number
      },
      averageValue: {
        required: true,
        type: Number
      },
      transactions : [{
        date : {
          required: true,
          type: Date
        },
        coins: {
          required: true,
          type: Number,
        },
        averageValue: {
          required: true,
          type: Number
        },
        description: {
          required: false,
          type: String
        },
        transactionType: {
          require: true,
          type: Number
        },
        auctionId: {
          type: mongoose.Schema.Types.ObjectId
        }
      }],
    },
    loginHistory: [
      {
        date: {
          type: Date,
          required: true
        },
        ip: {
          type: String,
          required: true,
        },
        userAgent: {
          type: String,
          required: true
        }
      }
    ]
  });

  model = model ? model : mongoose.model('users', schema);

  return model;
};
