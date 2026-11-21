// eslint-disable-next-line @typescript-eslint/no-require-imports, no-undef
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
// eslint-disable-next-line no-undef
const config = getDefaultConfig(__dirname);

// eslint-disable-next-line no-undef
module.exports = config;
