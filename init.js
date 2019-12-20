const process = require("process");
const db = require("./db");
const config = require("./config")();
const hasher = require("password-hash");

if (process.argv.length != 4) {
  console.log("usage init.js [username] [password]");
} else {
  db.init(config.db)
    .then(() => {
      db.users
        .insertOne({
          _id: process.argv[2],
          password: hasher.generate(process.argv[3]),
          admin: true
        })
        .then(() => {
          console.log("User " + process.argv[2] + " successfully created");
          process.exit(0);
        })
        .catch(e => {
          console.log("Failed to create a user");
          console.log(e);
          process.exit(1);
        });
    })
    .catch(e => {
      console.log("Failed to initialise database");
      console.log(e);
      process.exit(1);
    });
}
