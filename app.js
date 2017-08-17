require("newrelic");

const logger = require("winston");
const express = require("express");
const devConfig = require("config.json")("./config.json");
const prodConfig = require("config.json")("./config.prod.json");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();
const app = express();

let config = prodConfig;
if (process.env.NODE_ENV === "development") {
  config = devConfig;
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
    require("./src/notificationManager")(config, bot);
  })
  .catch(e => console.error(e));

app.use(jsonParser);

app.listen(process.env.PORT || config.port, () => {
  logger.info("Express listening on port " + (process.env.PORT || config.port));
});

// db.once("open", () => {

// const bot = require("./src/bot")(config);
// var listener = require("./src/listener")(express(), config);
// });
