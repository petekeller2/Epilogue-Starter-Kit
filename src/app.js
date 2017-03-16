import 'babel-core/register';
import 'babel-polyfill';
import express from 'express';
import winston from 'winston';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import Sequelize from 'sequelize';
import expressJwt from 'express-jwt';
import childProcess from 'child_process';
import config from './config';
import Passport from './auth/passport';
import epilogueSetup from './epilogueSetup';
import authEndpoints from './auth/endpoints';
import epilogueAuth from './auth/epilogueAuth';
import spawnTest from '../test/setup/spawnTest';
import server from './server';

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

winston.add(winston.transports.File, {
  filename: 'logs/general.log',
  tailable: true,
  maxsize: 50000,
  maxFiles: 5,
  zippedArchive: true,
});
winston.setLevels(winston.config.syslog.levels);
spawnTest.logging(childProcess);
// --------------------epilogue-----------------------
const database = new Sequelize(config.dbString);
const groupXrefModel = epilogueSetup.setupEpilogue(app, database, Sequelize);
const resources = epilogueSetup.setupResources(database, Sequelize, groupXrefModel);
// ----------------------auth--------------------------
const passport = Passport.setup(resources);

app.use(expressJwt({
  secret: config.jwt.secret,
  credentialsRequired: false,
  getToken: req => req.cookies.id_token,
}));

app.use(passport.initialize());

epilogueAuth.setupAuthCheck(resources, groupXrefModel);

authEndpoints.setup(app, passport);
// ------------------server---------------------------
server.serve(database, server.createServerObject(app), resources, groupXrefModel);
