"use strict";

const URLWrapper = require("./URL");
const URLSearchParamsWrapper = require("./URLSearchParams");

exports.URLWrapper = URLWrapper;
exports.URLSearchParamsWrapper = URLSearchParamsWrapper;

const sharedGlobalObject = {};
URLWrapper.install(sharedGlobalObject);
URLSearchParamsWrapper.install(sharedGlobalObject);

exports.URL = sharedGlobalObject.URL;
exports.URLSearchParams = sharedGlobalObject.URLSearchParams;

exports.parseURL = require("./url-state-machine").parseURL;
exports.basicURLParse = require("./url-state-machine").basicURLParse;
exports.serializeURL = require("./url-state-machine").serializeURL;
exports.serializeHost = require("./url-state-machine").serializeHost;
exports.serializeInteger = require("./url-state-machine").serializeInteger;
exports.serializeURLOrigin = require("./url-state-machine").serializeURLOrigin;
exports.setTheUsername = require("./url-state-machine").setTheUsername;
exports.setThePassword = require("./url-state-machine").setThePassword;
exports.cannotHaveAUsernamePasswordPort = require("./url-state-machine").cannotHaveAUsernamePasswordPort;

exports.percentDecode = require("./urlencoded").percentDecode;
