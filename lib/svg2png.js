"use strict";

var path = require("path");
var execFile = require("child_process").execFile;

var phantomjsCmd = require("phantomjs").path;
var converterFileName = path.resolve(__dirname, "./converter.js");

var defaults = {
    scale: 1.0
};

function extend (target, source) {
  target = target || {};
  for (var prop in source) {
    if (typeof source[prop] === 'object') {
      target[prop] = extend(target[prop], source[prop]);
    } else {
      target[prop] = source[prop];
    }
  }
  return target;
}

module.exports = function svgToPng(sourceFileName, destFileName, options, cb) {

    if (typeof options === 'function') {
        cb = options;
        options = defaults;
    } else {
        extend(defaults, options);
    }

    var args = [converterFileName, sourceFileName, destFileName, options];
    execFile(phantomjsCmd, args, function (err, stdout, stderr) {
        if (err) {
            cb(err);
        } else if (stdout.length > 0) { // PhantomJS always outputs to stdout.
            cb(new Error(stdout.toString().trim()));
        } else if (stderr.length > 0) { // But hey something else might get to stderr.
            cb(new Error(stderr.toString().trim()));
        } else {
            cb(null);
        }
    });
};
