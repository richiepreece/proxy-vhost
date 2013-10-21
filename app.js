/* jshint node:true */
'use strict';

// TODO:: Check for body and cookie passing in

var express = require('express'),
    request = require('request'),
     config = require('config'),
         fs = require('fs'),
          _ = require('underscore');

var port = process.env.PORT || config.port || process.argv[2] || 3000;

var cc = config.couch;
var couchURL = 'http://' + cc.host + ':' + cc.port + '/' + cc.db;

var domains = config.domains;
var subs;

getAllSubdomains(init);

function init(err) {
  if (err) console.error(err);

  var app = express();
  app.use(express.logger('dev'));
  app.use(express.methodOverride());

  app.use(refresher);

  _.each(domains, function (domain) {
    var fn = proxy(domain);
    app.use(express.vhost(domain, fn));
    app.use(express.vhost('*.' + domain, fn));
  });

  app.use(show404);
  app.use(express.errorHandler());
  app.listen(port);
}

function proxy(domain) {
  return function (req, res, next) {
    var sub = req.subdomains || [];
    sub = sub.reverse().join('.');

    if (!subs[domain][sub] && sub == '') {
      sub = 'www';
    }

    if (!subs[domain][sub]) return next();

    var url = 'http://' + subs[domain][sub] + req.url;
    var test = request(url);
    req.pipe(test).pipe(res);
    test.on('error', function (err) {
      console.error(err);
      next();
    });
  };
}

function refresher(req, res, next) {
  if (req.subdomains[0] !== 'refresh'
    || req.query.token !== config.token)
    return next();

  getAllSubdomains(function (err) {
    if (err) {
      return res.send({
        success: false,
        err: err
      });
    }

    res.send({
      success: true
    });
  });
}

function getAllSubdomains(cb) {
  var newSubs = {};
  var done = _.after(domains.length, function () {
    subs = newSubs;
    console.log(subs);
    cb();
  });

  _.each(domains, function (domain) {
    newSubs[domain] = {};
    request(couchURL + '/_design/_view/_view/getDomain?key="' + domain + '"',
      function (err, resp, body) {
        if (err) {
          return cb(err);
        } else {
          body = JSON.parse(body);
          _.each(body.rows, function (obj) {
            newSubs[domain][(obj.value.sub || '')] = obj.value.host;
          });
        }
        done();
      }
    );
  });
}

function show404(req, res) {
  fs.createReadStream('404.html').pipe(res);
}
