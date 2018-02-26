var mongoose = require('mongoose');
var mongooseSchema =  mongoose.Schema;

var model = null;

module.exports = function(){
  var schema = mongooseSchema({
    user: {
      id: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true
      }
    },
    coinPackageId: {
      type: String,
      required: true
    },
    coins: {
      type: Number,
      required: true
    },
    price: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    info: {
      type: String,
      required: false
    },
    payerTracking: {
      type: Object,
      required: false
    },
    status: {
      code: {
        type: Number,
        required: true
      },
      description: {
        type: String,
        required: true,
      },
      payer: {
        code: {
          type: String,
          required: false,
        },
        description: {
          type: String,
          required: false
        }
      }
    },
    isEnabled: {
      type: Boolean,
      required: true
    }
  });

  model = model ? model : mongoose.model('paymentsTransactions', schema);

  return model;
};
