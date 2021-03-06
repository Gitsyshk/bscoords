// Generated by CoffeeScript 1.7.1
'use strict';
var E_NOTFOUND, E_REQERROR, connTimeout, events, http, https, i, init, mozLocationApiKey, openCellIDApiKey, reFetchOpenCidLat, reFetchOpenCidLon, reFetchYandexLat, reFetchYandexLon, reFetchYandexNlat, reFetchYandexNlon, reOpenCidError, reYandexError, request, requestGoogle, requestMozLocation, requestOpenCellID, requestYandex;

http = require('http');

https = require('https');

events = require('events');

reFetchYandexLat = /\slatitude="([+\-\d\.]+)"/i;

reFetchYandexLon = /\slongitude="([+\-\d\.]+)"/i;

reFetchYandexNlat = /\snlatitude="([+\-\d\.]+)"/i;

reFetchYandexNlon = /\snlongitude="([+\-\d\.]+)"/i;

reYandexError = /error/i;

reFetchOpenCidLat = /\slat="([+\-\d\.]+)"/i;

reFetchOpenCidLon = /\slon="([+\-\d\.]+)"/i;

reOpenCidError = /err\s+info="[^"]+"\s+code="/i;

connTimeout = 3000;

openCellIDApiKey = null;

mozLocationApiKey = ((function() {
  var _i, _results;
  _results = [];
  for (i = _i = 0; _i <= 2; i = ++_i) {
    _results.push(Math.random().toString(36).slice(2));
  }
  return _results;
})()).join('').slice(0, 32);

E_NOTFOUND = 'Not found';

E_REQERROR = 'Request error';

init = function(conf) {
  var _ref, _ref1, _ref2;
  openCellIDApiKey = (_ref = conf.openCellIDApiKey) != null ? _ref : openCellIDApiKey;
  mozLocationApiKey = (_ref1 = conf.mozLocationApiKey) != null ? _ref1 : mozLocationApiKey;
  return connTimeout = (_ref2 = conf.timeout) != null ? _ref2 : connTimeout;
};

requestYandex = function(countrycode, operatorid, lac, cellid, onComplete) {
  var options, req;
  options = {
    hostname: "mobile.maps.yandex.net",
    port: 80,
    method: "GET",
    path: "/cellid_location/?&cellid=" + cellid + "&operatorid=" + operatorid + "&countrycode=" + countrycode + "&lac=" + lac
  };
  req = http.request(options, function(res) {
    var response;
    res.setEncoding('utf8');
    response = '';
    res.on('data', function(chunk) {
      return response += chunk;
    });
    return res.on('end', function() {
      var err;
      try {
        if (reYandexError.test(response)) {
          return onComplete(new Error(E_NOTFOUND), null);
        } else {
          return onComplete(null, {
            cell: {
              lat: Number(reFetchYandexLat.exec(response)[1]),
              lon: Number(reFetchYandexLon.exec(response)[1])
            },
            bs: {
              lat: Number(reFetchYandexNlat.exec(response)[1]),
              lon: Number(reFetchYandexNlon.exec(response)[1])
            }
          });
        }
      } catch (_error) {
        err = _error;
        return onComplete(new Error(E_REQERROR), null);
      }
    });
  });
  req.on('socket', function(socket) {
    return socket.setTimeout(connTimeout, function() {
      return req.abort();
    });
  });
  req.on('error', function(err) {
    return onComplete(new Error(E_REQERROR), null);
  });
  return req.end();
};

requestGoogle = function(countrycode, operatorid, lac, cellid, onComplete) {
  var options, req, request;
  options = {
    hostname: "www.google.com",
    port: 80,
    method: "POST",
    path: "/glm/mmap"
  };
  req = http.request(options, function(res) {
    var response;
    res.setEncoding('hex');
    response = '';
    res.on('data', function(chunk) {
      return response += chunk;
    });
    return res.on('end', function() {
      var err;
      try {
        if (response.length < 30) {
          return onComplete(new Error(E_NOTFOUND), null);
        } else {
          return onComplete(null, {
            lat: (~~parseInt(response.slice(14, 22), 16)) / 1000000,
            lon: (~~parseInt(response.slice(22, 30), 16)) / 1000000
          });
        }
      } catch (_error) {
        err = _error;
        return onComplete(new Error(E_REQERROR), null);
      }
    });
  });
  request = '000e00000000000000000000000000001b0000000000000000000000030000';
  request += ('00000000' + Number(cellid).toString(16)).substr(-8);
  request += ('00000000' + Number(lac).toString(16)).substr(-8);
  request += ('00000000' + Number(operatorid).toString(16)).substr(-8);
  request += ('00000000' + Number(countrycode).toString(16)).substr(-8);
  request += 'ffffffff00000000';
  req.on('socket', function(socket) {
    return socket.setTimeout(connTimeout, function() {
      return req.abort();
    });
  });
  req.on('error', function(err) {
    return onComplete(new Error(E_REQERROR), null);
  });
  return req.end(new Buffer(request, 'hex'));
};

requestOpenCellID = function(countrycode, operatorid, lac, cellid, onComplete) {
  var options, req;
  if (openCellIDApiKey != null) {
    options = {
      hostname: 'opencellid.org',
      port: 80,
      method: 'GET',
      path: "/cell/get?key=" + openCellIDApiKey + "&mnc=" + operatorid + "&mcc=" + countrycode + "&lac=" + lac + "&cellid=" + cellid
    };
    req = http.request(options, function(res) {
      var response;
      res.setEncoding('utf8');
      response = '';
      res.on('data', function(chunk) {
        return response += chunk;
      });
      return res.on('end', function() {
        var err;
        try {
          if (reOpenCidError.test(response)) {
            return onComplete(new Error(E_NOTFOUND), null);
          } else {
            return onComplete(null, {
              lat: Number(reFetchOpenCidLat.exec(response)[1]),
              lon: Number(reFetchOpenCidLon.exec(response)[1])
            });
          }
        } catch (_error) {
          err = _error;
          return onComplete(new Error(E_REQERROR), null);
        }
      });
    });
    req.on('socket', function(socket) {
      return socket.setTimeout(connTimeout, function() {
        return req.abort();
      });
    });
    req.on('error', function(err) {
      return onComplete(new Error(E_REQERROR), null);
    });
    return req.end();
  } else {
    return onComplete(new Error(), null);
  }
};

requestMozLocation = function(countrycode, operatorid, lac, cellid, networkType, onComplete) {
  var options, req, requestBody;
  if (onComplete == null) {
    onComplete = networkType;
    networkType = 'gsm';
  }
  if (['gsm', 'cdma', 'umts', 'lte'].indexOf(networkType) === -1) {
    networkType = 'gsm';
  }
  options = {
    hostname: 'location.services.mozilla.com',
    port: 443,
    method: 'POST',
    path: "/v1/search?key=" + mozLocationApiKey,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  requestBody = JSON.stringify({
    'cell': [
      {
        'radio': networkType,
        'cid': cellid,
        'lac': lac,
        'mcc': countrycode,
        'mnc': operatorid
      }
    ]
  });
  req = https.request(options, function(res) {
    var response;
    res.setEncoding('utf8');
    response = '';
    res.on('data', function(chunk) {
      return response += chunk;
    });
    return res.on('end', function() {
      var err;
      try {
        response = JSON.parse(response);
        if ((response.status != null) && response.status === 'ok') {
          return onComplete(null, {
            lat: response.lat,
            lon: response.lon
          });
        } else {
          return onComplete(new Error(E_NOTFOUND), null);
        }
      } catch (_error) {
        err = _error;
        return onComplete(new Error(E_REQERROR), null);
      }
    });
  });
  req.on('socket', function(socket) {
    return socket.setTimeout(connTimeout, function() {
      return req.abort();
    });
  });
  req.on('error', function(err) {
    return onComplete(new Error(E_REQERROR), null);
  });
  req.write(requestBody);
  return req.end();
};

request = function(countrycode, operatorid, lac, cellid, networkType, onComplete) {
  var dataCame, emitter, fullCoords, fullErr;
  if (onComplete == null) {
    onComplete = networkType;
    networkType = 'gsm';
  }
  if (['gsm', 'cdma', 'umts', 'lte'].indexOf(networkType) === -1) {
    networkType = 'gsm';
  }
  emitter = new events.EventEmitter();
  dataCame = 0;
  fullCoords = {};
  fullErr = null;
  requestGoogle(countrycode, operatorid, lac, cellid, function(err, coords) {
    if (err != null) {
      if (fullErr == null) {
        fullErr = {};
      }
      fullErr.google = err;
    }
    fullCoords.google = coords;
    dataCame++;
    return emitter.emit('coords');
  });
  requestYandex(countrycode, operatorid, lac, cellid, function(err, coords) {
    if (err != null) {
      if (fullErr == null) {
        fullErr = {};
      }
      fullErr.yandex = err;
    }
    fullCoords.yandex_bs = (coords != null ? coords.bs : void 0) || null;
    fullCoords.yandex_cell = (coords != null ? coords.cell : void 0) || null;
    dataCame++;
    return emitter.emit('coords');
  });
  requestOpenCellID(countrycode, operatorid, lac, cellid, function(err, coords) {
    if (err != null) {
      if (fullErr == null) {
        fullErr = {};
      }
      fullErr.opencellid = err;
    }
    fullCoords.opencellid = coords;
    dataCame++;
    return emitter.emit('coords');
  });
  requestMozLocation(countrycode, operatorid, lac, cellid, networkType, function(err, coords) {
    if (err != null) {
      if (fullErr == null) {
        fullErr = {};
      }
      fullErr.mozlocation = err;
    }
    fullCoords.mozlocation = coords;
    dataCame++;
    return emitter.emit('coords');
  });
  return emitter.on('coords', function() {
    if (dataCame >= 4) {
      return onComplete(fullErr, fullCoords);
    }
  });
};

exports.init = init;

exports.requestYandex = requestYandex;

exports.requestGoogle = requestGoogle;

exports.requestOpenCellID = requestOpenCellID;

exports.requestMozLocation = requestMozLocation;

exports.request = request;
