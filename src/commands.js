const fetch = require("node-fetch");
const moment = require("moment");
const logger = require("winston");

require("moment-duration-format");

const EOSpromise = fetch("https://eos.io/eos-sales-statistic.php").then(data =>
  data.json()
);
const CryptoComparePromise = fetch(
  "https://min-api.cryptocompare.com/data/pricemulti?fsyms=BTC,EOS,ETH&tsyms=USD,BTC,ETH"
).then(response => response.json());

const getPrices = period =>
  Promise.all([EOSpromise, CryptoComparePromise]).then(([eos, prices]) => {
    const currentWindow =
      parseInt(period) || parseInt(period) === 0
        ? eos[parseInt(period)]
        : eos[eos[0].today];
    const priceETH = currentWindow.price;
    return {
      isPast:
        parseInt(period) === 0 ||
        (parseInt(period) && parseInt(period) < eos[0].today),
      currentWindow,
      priceETH,
      priceUSD: priceETH * prices.ETH.USD,
      priceBTC: priceETH * prices.ETH.BTC,
      marketPriceETH: prices.EOS.ETH,
      marketPriceUSD: prices.EOS.USD,
      marketPriceBTC: prices.EOS.BTC
    };
  });

const getTime = (currentWindow, isPast) => {
  if (isPast) return ``;
  return ` will be end within ${moment
    .duration(moment(currentWindow.ends).diff(moment.now()))
    .format("hh:mm:ss")}`;
};

const priceCallback = period =>
  getPrices(period).then(res => {
    const {
      isPast,
      currentWindow,
      priceBTC,
      priceETH,
      priceUSD,
      marketPriceETH,
      marketPriceUSD,
      marketPriceBTC
    } = res;
    return `
Period ${currentWindow.id} ${getTime(currentWindow, isPast)}

<b>Crowdsale price:</b>

  ${priceUSD.toFixed(4)} USD
  ${priceETH.toFixed(6)} ETH
  ${priceBTC.toFixed(6)} BTC
  
<b>Market price now:</b>

  ${marketPriceUSD.toFixed(4)} USD
  ${marketPriceETH.toFixed(6)} ETH
  ${marketPriceBTC.toFixed(6)} BTC

<b>Profit</b>: ${(marketPriceETH / priceETH - 1).toFixed(5) * 100}%

(${moment(currentWindow.begins).format("MMM DD YYYY HH:mm:ss Z")}
${moment(currentWindow.ends).format("MMM DD YYYY HH:mm:ss Z")})

Enter /price PERIOD_NUMBER to see another period
`;
  });

module.exports = {
  price: {
    name: "/price",
    pattern: /\/(price)(\s?\d*)/,
    showInMenu: true,
    description: "/price - Shows last price for EOS",
    callback: ({ match }) => priceCallback(match[2])
  },
  notifications: {
    name: "/notifications",
    pattern: /\/notifications/,
    showInMenu: true,
    description: "/notifications - Enable/Disable notifications",
    callback: ({ user }) => {
      user.notifications = !user.notifications;
      user.save();
      return Promise.resolve(`
<b>Notification Settings</b>

Enabled: ${user.notifications}
      `);
    }
  },
  info: {
    name: "/info",
    pattern: /\/info/,
    showInMenu: true,
    description: "/info - Credits and contacts",
    callback: () => {
      return Promise.resolve(`
Prices and data is taken from eos.io and cryptocompare.com

For bot, dapp, web apps development or feedback contact me at @tmaniac

<a href="https://github.com/imbaniac">Github</a>
      `);
    }
  },
  donate: {
    name: "/donate",
    pattern: /\/donate/,
    showInMenu: true,
    description:
      "/donate - Author's BTC and ETH address to support development",
    callback: () => {
      return Promise.resolve(`
ETH - 0x78a2C634b844b23e22795EAb1Bd344629f4983c2
BTC - 137dK5SdLuuEew6GJ5UE9p9ykCp4QpvrjZ
      `);
    }
  },
  start: {
    name: "/start",
    pattern: /\/start/,
    description: "/start - Start the bot",
    showInMenu: user => user.active === false,
    callback: function({ msg, match, user, created }) {
      if (created) {
        logger.info("Created new user with id %s", user.telegramId);
      } else {
        user.active = true;
        user.save();
      }

      logger.info("User %s is now active", user.telegramId);
      return Promise.resolve(`
Bot activated! Type /stop to stop.
Type /help to see all available commands
`);
    }
  },
  stop: {
    name: "/stop",
    pattern: /\/stop/,
    description: "/stop - Stop receiving notifications",
    showInMenu: user => user.active,
    callback: ({ msg, match, user, created }) => {
      user.active = false;
      user.notifications = false;
      user.save();
      logger.info("User %s is now inactive", user.telegramId);
      return Promise.resolve(`Bot stopped. /start again later!`);
    }
  }
};
