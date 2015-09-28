var extend = require('extend');
var _ = require('lodash');
var request = require('request');
var chalk = require('chalk');

module.exports = function(options, callback) {
  return new Construct(options, callback);
};

module.exports.Construct = Construct;

function Construct(options, callback) {
  var apos = options.apos;
  var app = options.app;

  if (!options.instagramId) {
    console.error('WARNING: you must configure the instagramId');
  }
  var cacheLifetime = options.cacheLifetime || 30;
  var self = this;
  self._apos = apos;
  self._app = app;
  var limit;
  var lifetime = options.lifetime ? options.lifetime : 60000;

  var client_id = options.instagramId;

  self._apos.mixinModuleAssets(self, 'instagram', __dirname, options);

  // This widget should be part of the default set of widgets for areas
  // (this isn't mandatory)
  apos.defaultControls.push('instagram');

  // Include our editor template in the markup when aposTemplates is called
  self.pushAsset('template', 'instagramEditor', { when: 'user' });
  self.pushAsset('template', 'instagram', { when: 'always' });

  // Make sure that aposScripts and aposStylesheets summon our assets

  // We need the editor for RSS feeds. (TODO: consider separate script lists for
  // resources needed also by non-editing users.)
  self.pushAsset('script', 'editor', { when: 'user' });
  self.pushAsset('script', 'content', { when: 'always' });
  self.pushAsset('stylesheet', 'content', { when: 'always' });

  self.widget = true;
  self.label = options.label || 'Instagram';
  self.css = options.css || 'instagram';
  self.icon = options.icon || 'icon-instagram';

  // self.sanitize = function(item) {
  //   if (!item.pageUrl.match(/^https?\:\/\//)) {
  //     item.pageUrl = 'http://' + item.pageUrl;
  //   }
  //   item.limit = parseInt(item.limit, 10);
  // };

  var instagramCache = {};
  // var pageUrl;

  app.get('/apos-instagram/user/id', function(req, res) {
    var userName = apos.sanitizeString(req.query.userName);
    if (!userName.length) {
      res.statusCode = 404;
      console.log(chalk.red('[Apostrophe Instagram] ') + 'It looks like you forgot to enter a username');
      return res.send('not found');
    }
    if (self._apos._aposLocals.offline) {
      res.statusCode = 404;
      return res.send('offline');
    }

    var userIdRequestUrl = 'https://api.instagram.com/v1/users/search/?q='+userName+'&client_id='+options.instagramId;
    request(userIdRequestUrl, function(err, response, body){
      if (err) {
        res.statusCode(503);
        console.log(chalk.red('[Apostrophe Instagram] ') + 'The error is', response.error);
        res.send(response.error);
      }
      if(response.statusCode === 200){

        var users = JSON.parse(body),
            user = _.find(users.data, function(user){
              return user.username === userName;
            });
        return res.json(user.id);
      }
    });
  });

  app.get('/apos-instagram/photos', function(req, res) {
    var userId = apos.sanitizeString(req.query.id);
    var tag = apos.sanitizeString(req.query.tag);
    var limit = apos.sanitizeString(req.query.limit);

    if (!userId.length && !tag.length) {
      res.statusCode = 404;
      console.log(chalk.red('[Apostrophe Instagram] ') + 'It looks like you forgot to enter a user ID or hashtag');
      return res.send('not found');
    }

    var cacheName = (userId + tag || userId || tag);

    if (_.has(instagramCache, cacheName)) {
      var cache = instagramCache[cacheName];
      var now = (new Date()).getTime();
      if (now - cache.when > lifetime * 1000) {
        delete instagramCache[cacheName];
      } else {
        return res.send(cache.results);
      }
    }

    if (self._apos._aposLocals.offline) {
      res.statusCode = 404;
      return res.send('offline');
    }

    return function(item) {
      // Now that we have the userId, let's go get some pictures.
      var feedRequestUrl;
      if(tag.length > 0){
        feedRequestUrl = 'https://api.instagram.com/v1/tags/'+tag+'/media/recent?count=100&client_id='+options.instagramId;
      } else if(userId.length && tag.length < 1){
        feedRequestUrl = 'https://api.instagram.com/v1/users/'+userId+'/media/recent?client_id='+options.instagramId;
      }
      request(feedRequestUrl, function(err, response, body){
        if (err) {
          item._failed = true;
          console.log(chalk.red('[Apostrophe Instagram] ') + 'The error is', response.error);
          return callback(response.error);
        }
        if(response.statusCode === 200){
          var photos = [];
          var parsedBody = JSON.parse(body);
          var parsedArray = parsedBody.data;
          if(userId.length > 0 && tag.length > 0){
            var filteredPhotos = _.filter(parsedArray, function(photo){
              return photo.user.id === userId;
            });
            photos = filteredPhotos.slice(0, limit) || [];
          } else {
            photos = parsedArray.slice(0, limit) || [];
          }

          var results = photos.map(function(photo) {
            return {
              id: photo.id,
              user: photo.user,
              caption: photo.caption,
              image: photo.images.standard_resolution,
              date: photo.created_time,
              location: photo.location,
              likes: photo.likes,
              link: photo.link
            }
          });
          return res.send(results);
        }
      })
    }();
  });

  self.renderWidget = function(data) {
    return self.render('instagram', data);
  };

  self._apos.addWidgetType('instagram', self);

  return setImmediate(function() { return callback(null); });
}
