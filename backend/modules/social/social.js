const social = require('express').Router();

const sbFacebook = require('./sb-facebook');
const profile = require('./profile');


social.use('/stats',sbFacebook);

social.use('/profile',profile);

module.exports = social;
