const moment = require("moment");

const isBetween = date => {
  console.log(moment(moment.now()).isBetween(date.begins, date.ends));
  return (
    moment(moment.now()).isBetween(date.begins, date.ends) ||
    moment(moment.now()).isSame(date.begins) ||
    moment(moment.now()).isSame(date.ends)
  );
};
module.exports = { isBetween };
