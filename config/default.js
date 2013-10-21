/* jshint node:true */

module.exports = {
  port: 80,
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
