/* jshint node:true */

module.exports = {
  port: 3000,
  token: 'test-refresh-token',
  couch: {
    host: 'localhost',
    port: 5984,
    db: 'subdomains'
  },
  domains: [
    'example.com'
  ]
};
