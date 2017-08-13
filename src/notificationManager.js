const Moment = require("moment");
const MomentRange = require("moment-range");
const moment = MomentRange.extendMoment(Moment);
const fetch = require("node-fetch");
const User = require("./User");
const commands = require("./commands");
const schedule = require("node-schedule");
const dates = require("../dates");
const rule = new schedule.RecurrenceRule();

const getCurrentWindow = () => {
  return dates.find((day, i) => {
    if (i === 0) return false;
    const range = moment.range(day.begins, day.ends);
    return range.contains(Date.now());
  });
};

let currentWindow = getCurrentWindow();

rule.hour = moment(currentWindow.ends).subtract(1, "hour").hours();
rule.minute = [0, 30, 55, 59];

module.exports = function(config, bot, emmitter) {
  const logger = config.logger;
  var j = schedule.scheduleJob(rule, function(y) {
    newWindow = getCurrentWindow();
    rule.hour = moment(newWindow.ends).subtract(1, "hour").hours();
    User.find({
      active: true,
      notifications: true
    }).then(users => {
      const ids = users.map(user => user.telegramId);
      if (ids.length) {
        commands.price.callback({ match: "" }).then(message => {
          bot.sendNotification(ids, `${message}`);
        });
      }
    });
  });
};
