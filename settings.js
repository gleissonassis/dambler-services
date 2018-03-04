module.exports = {
  mailOptions: {
    host: '<HOST>',
    port: 465,
    secure: true,
    auth: {
        user: '<USER>',
        pass: '<PASSWORD>'
    }
  },
  jwt: {
    secret: '<SECRET>',
    expiresIn: '1h'
  },
  payer: {
    auth: {
      email: '<PAYER_USER>',
      password: '<PASSWORD>',
      endpoint: 'http://payer.gdxconsulting.com.br/v1/users/auth'
    },
    appKey: '<APP_KEY>',
    pagSeguro: {
      currency: 'BRL',
      shippingType: 2
    },
    endpoint: 'http://payer.gdxconsulting.com.br/v1/transactions'
  }
};
