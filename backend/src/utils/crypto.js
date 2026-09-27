const crypto = require('crypto');

const generateRandomString = (length = 32) => crypto.randomBytes(length).toString('hex');

const generateUUID = () => crypto.randomUUID();

module.exports = { generateRandomString, generateUUID };