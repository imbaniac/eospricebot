const mongoose = require("mongoose");
const config = require("config.json")("./config.json");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  telegramId: String,
  active: {
    type: Boolean,
    default: true
  },
  notifications: {
    type: Boolean,
    default: false
  }
});

UserSchema.plugin(require("mongoose-findorcreate"));

module.exports = mongoose.model("User", UserSchema);
