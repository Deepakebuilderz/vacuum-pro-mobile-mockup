const { getDefaultConfig } = require('expo/metro-config');
require('./prepareScreens.cjs')();
module.exports = getDefaultConfig(__dirname);
