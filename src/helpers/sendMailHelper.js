var Promise       = require('promise');
var logger        = require('../config/logger');
var settings      = require('../config/settings');

function SendMailHelper(nodemailer) {
  return {
    options: settings.mailOptions,

    send: function(mailOptions) {
      var self = this;

      return new Promise(function (resolve, reject) {
        try {
          logger.info('[SendMailHelper] connecting to the mail server', self.options);
          var transporter = nodemailer.createTransport(self.options);

          logger.debug('[SendMailHelper] transporter: %s', transporter);

          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
               logger.error('[SendMailHelper] An error has ocurred while sending mail', error);
              reject(error);
            } else {
               logger.info('[SendMailHelper] The email has been sent successfully');
              resolve(info);
            }
          });
        } catch (e) {
           logger.error('[SendMailHelper] An unexpected error has ocurred while sending mail', e);
          reject(e);
        }
      });
    }
  };
}

module.exports = SendMailHelper;
