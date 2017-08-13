const logger = require("winston");
const express = require("express");
const config = require("config.json")("./config.json");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();
const app = express();
const events = require("events");
const emitter = new events.EventEmitter();

if (process.env.NODE_ENV === "development") {
  logger.level = "debug";
}

config.logger = logger;

mongoose.Promise = global.Promise;
mongoose
  .connect(config.mongodb, {
    useMongoClient: true
  })
  .then(db => {
    logger.info("Connected to Mongodb on %s", config.mongodb);
    db.on("error", function() {
      logger.error("Mongodb connection failed!");
    });
    const bot = require("./src/bot")(config, logger);
    require("./src/notificationManager")(config, bot, emitter);
  });

app.use(jsonParser);

app.listen(config.port, () => {
  logger.info("Express listening on port " + config.port);
});

// db.once("open", () => {

// const bot = require("./src/bot")(config);
// var listener = require("./src/listener")(express(), config);
// });
