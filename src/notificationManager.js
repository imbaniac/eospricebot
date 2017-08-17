const Moment = require("moment");
const MomentRange = require("moment-range");
const moment = MomentRange.extendMoment(Moment);
const fetch = require("node-fetch");
const User = require("./User");
const commands = require("./commands");
const schedule = require("node-schedule");
const dates = require("../dates");
const rule = new schedule.RecurrenceRule();
const updateWindowRule = new schedule.RecurrenceRule();

const getCurrentWindow = () => {
  return dates.find((day, i) => {
    if (i === 0) return false;
    const range = moment.range(day.begins, day.ends);
    return range.contains(Date.now());
  });
};

let currentWindow = getCurrentWindow();

rule.hour = moment(currentWindow.ends).subtract(1, "hour").hours();
rule.minute = [0, 30, 45, 55, 59];

updateWindowRule.hour = moment(currentWindow.ends).add(1, "hour").hours();
const j = schedule.scheduleJob(rule, () => {
  rule.hour = moment(currentWindow.ends).subtract(1, "hour").hours();
});

module.exports = function(config, bot) {
  const logger = config.logger;
  const j = schedule.scheduleJob(rule, function(y) {
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
