
'use strict';
const authRouter = require('./router');
const { localStrategy, jwtStrategy } = require('./strategies');

module.exports = { localStrategy, jwtStrategy };
module.exports = authRouter;