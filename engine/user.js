"use strict";

const db = require("../db");
const hasher = require("password-hash");

exports.doLogin = async data => {
  const userData = await db.users.findOne({ _id: data.username });
  return userData && hasher.verify(data.password, userData.password)
    ? userData
    : null;
};

exports.createUser = async data => {
  return db.users.insertOne({
    _id: data.username,
    password: hasher.generate(data.password),
    forename: data.forename,
    surname: data.surname,
    admin: false
  });
};
