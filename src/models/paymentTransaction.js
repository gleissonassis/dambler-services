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
    realPrice: {
      type: Number,
      required: false,
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
    notifications: [{
        status: {
          type: Number,
          required: true
        },
        price: {
          type: Number,
          required: true
        },
        data: {
          type: Object,
          required: false
        },
        date: {
          type: Date,
          required: true
        }
      }
    ],
    isEnabled: {
      type: Boolean,
      required: true
    }
  });

  model = model ? model : mongoose.model('paymentsTransactions', schema);

  return model;
};
