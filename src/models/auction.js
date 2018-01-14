var mongoose = require('mongoose');
var mongooseSchema =  mongoose.Schema;

var model = null;

module.exports = function(){
  var schema = mongooseSchema({
    startDate: {
      type: Date,
      required: true
    },
    expiresOn: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    bids: [
      {
        user: {
          id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
          },
          name: {
            type: String,
            required: true
          }
        },
        value: {
          type: Number,
          required: true
        },
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
    ],
    product: {
      name: {
        type: String,
        required: true
      },
      description: {
        type: String,
        required: true
      },
      value: {
        type: Number,
        required: true
      },
      imageUrl: {
        type: String,
        required: true,
      },
      url: {
        type: String,
      },
      referenceCode: {
        type: String,
        required: true
      }
    },
    isEnabled : {
      type: Boolean,
      required:true,
    },
  });

  model = model ? model : mongoose.model('auctions', schema);

  return model;
};
