var restify = require('restify'),
  crypto = require("crypto"),
  fs = require("fs");


exports.getHomePath = function (options) {
  return options.data || options.home || process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'] + '/.xpush';
};

exports.getIP = function () {

  var interfaces = require('os').networkInterfaces();
  for (var devName in interfaces) {
    var iface = interfaces[devName];

    for (var i = 0; i < iface.length; i++) {
      var alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) return alias.address;
    }
  }

  return '0.0.0.0';
};

exports.setHttpProtocal = function (_url, protocol) {
  if( protocol ){
    return protocol +"://"+ _url;
  } else if (!/^http:\/\//.test(_url) && !/^https:\/\//.test(_url)) {
    return 'http://' + _url;
  }
};

exports.validEmptyParams = function (req, paramArray) {

  for (var i in paramArray) {
    if (!req.params[paramArray[i]]) {
      return new restify.InvalidArgumentError('[' + paramArray[i] + '] must be supplied');
    }
  }

  return false;
};

exports.validSocketParams = function (params, paramArray) {

  for (var i in paramArray) {
    if (!params[paramArray[i]]) {
      return {
        status: 'error',
        message: '',
        detail: '[' + paramArray[i] + '] must be supplied'
      };
    }
  }

  return false;
};

exports.validJsonParams = function (params, paramArray) {
  for (var i in paramArray) {
    var param = params[paramArray[i]];

    if (param && typeof param == 'object') {
      return false;
    } else if (param && typeof param == 'string') {

      var json = parseJson(param);

      if (!json) {
        return {
          status: 'error',
          message: '[' + paramArray[i] + '] must be JSON format'
        };
      }

      return false;
    } else if (param) {
      return {
        status: 'error',
        message: '[' + paramArray[i] + '] must be JSON format'
      };
    }
  }

  return false;
};

var parseJson = function (instance) {
  var json;
  try {

    json = JSON.parse(instance);

    if (typeof json == 'string') {
      json = parseJson(json);
    }

  } catch (err) {
    json = null;
  }

  return json;
};

exports.parseJson = function (instance) {
  return parseJson(instance);
};

exports.regExpEscape = function (s) {
  return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

exports.encrypto = function (s, t) {
  if (!t) t = "sha256";
  var _c = crypto.createHash(t);
  _c.update(s, "utf8"); //utf8 here
  return _c.digest("base64");
};

var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz';

exports.randomString = function (length) {
  length = length ? length : 32;

  var string = '';

  for (var i = 0; i < length; i++) {
    var randomNumber = Math.floor(Math.random() * chars.length);
    string += chars.substring(randomNumber, randomNumber + 1);
  }

  return string;
};

exports.parseCookies = function (request) {
  var list = {},
    rc = request.headers.cookie;

  rc && rc.split(';').forEach(function (cookie) {
    var parts = cookie.split('=');
    list[parts.shift().trim()] = unescape(parts.join('='));
  });

  return list;
};

exports.sendErr = function (response, err) {
  response.send({status: 'ERR-INTERNAL', message: err});
};

exports.likeQueryMaker = function (data) {

  if (typeof data == 'string' || data instanceof String) {
    if (data.indexOf('%') == 0 && (data.lastIndexOf('%') + 1) == data.length) {
      return new RegExp(data.substring(1, data.lastIndexOf('%')), 'i');
    } else {
      return data;
    }
  } else if (typeof data == 'object') {
    if (Array.isArray(data)) {
      var newArray = [];
      for (var inx in data) {
        newArray.push(this.likeQueryMaker(data[inx]));
      }
      return newArray;
    } else {
      var result = {};
      for (var k in data) {
        result[k] = this.likeQueryMaker(data[k]);
      }
      return result;
    }
  }
};

exports.getBaseDirPath = function (home) {

  var homePath = home || process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'] + '/.xpush';

  try {
    if (!fs.existsSync(homePath)) fs.mkdirSync(homePath, parseInt('0766', 8));
  } catch (e) {
    console.log('Error creating xpush directory: ' + e);
  }

  return homePath;
};

exports.getPidFilePath = function (home, envType, envPort) {
  var basePath = this.getBaseDirPath(home);
  return basePath + '/XPUSH.' + envType + '.' + envPort + '.pid';
};

exports.getDaemonLogFilePath = function (home, envType, envPort) {
  var basePath = this.getBaseDirPath(home) + '/log';
  try {
    if (!fs.existsSync(basePath)) fs.mkdirSync(basePath, parseInt('0766', 8));
  } catch (e) {
    console.log('Error creating xpush directory: ' + e);
  }

  return basePath + '/DEAMON.' + envType + '.' + envPort + '.log';
};