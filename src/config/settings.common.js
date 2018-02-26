module.exports = {
    mongoUrl : 'mongodb://localhost/dambler-services',
    servicePort : 5000,
    isMongoDebug : true,
    dambler: {
      website: 'http://localhost:8080',
      publicAPI: 'http://localhost:8080/api/v1',
      initialWallet: {
        coins: 10,
        averageValue: 0
      }
    },
    isMongoDebug : true,
    jwt: {
      secret: 'secret',
      expiresIn: '1h'
    },
    mailOptions: {
      host: 'host',
      port: 465,
      secure: true,
      auth: {
          user: 'user',
          pass: 'pass'
      }
    },
    payer: {
      auth: {
        email: 'admin@payer.com.br',
        password: 'newPassword',
        endpoint: 'http://localhost:5001/v1/users/auth'
      },
      appKey: 'dambler',
      pagSeguro: {
        currency: 'BRL',
        shippingType: 2
      },
      endpoint: 'http://localhost:5001/v1/transactions'
    }
};
