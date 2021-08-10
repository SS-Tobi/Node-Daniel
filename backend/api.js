const api = require('express').Router();
const auth = require('./modules/auth');
const user = require('./modules/users/user');
const dashboard = require('./modules/dashboard/dashboard');
const web = require('./modules/web/web');
const social = require('./modules/social/social');
const competitor = require('./modules/competitors/competitors');
const plans = require('./modules/plans/plans');
const ticket = require('./modules/tickets/ticket');
const ticketMessage = require('./modules/tickets/ticket-messages');


api.use('/auth',auth);
api.use('/user',user);
api.use('/dashboard',dashboard);
api.use('/modules/web',web);
api.use('/modules/social',social);
api.use('/modules/competitor',competitor);
api.use('/modules/plans',plans);
api.use('/modules/ticket',ticket);
api.use('/modules/ticket-messages',ticketMessage);

module.exports = api;
