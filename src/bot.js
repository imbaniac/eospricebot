const TelegramBot = require("node-telegram-bot-api");
const BigNumber = require("bignumber.js");
const commands = require("./commands");
const User = require("./User");
// const Web3 = require("web3");
// const Web3Utils = require("web3-utils");

// const web3 = new Web3(
//   new Web3.providers.HttpProvider(
//     "https://mainnet.infura.io/ca9CUtSN86YnQPxj8Gie"
//   )
// );
// const getBalancePromise = promisify(web3.eth.getBalance);

// getBalancePromise("0xd0a6E6C54DbC68Db5db3A091B171A77407Ff7ccf").then(res =>
//   console.log(Web3Utils.fromWei(res))
// );

module.exports = (config, logger) => {
  const token = config.telegram_api_key;
  const bot = new TelegramBot(token, { polling: true });

  bot.onText(/\/help/, msg => {
    bot.sendMessage(
      msg.from.id,
      "Hello! I am EOS bot\n\n" +
        "The following commands are available to you:\n" +
        commandDescriptions() +
        "\n" +
        "/help - Display this message"
    );
  });

  bot.on("callback_query", msg => {
    console.log(msg);
    // Если присланный вариант совпадает с вариантом из массива
    bot.sendMessage(msg.from.id, msg.data);
  });

  Object.keys(commands).map(key => {
    const command = commands[key];
    bot.onText(command.pattern, (msg, match) => {
      User.findOrCreate({ telegramId: msg.from.id })
        .then(({ doc: user, created }) => {
          const replyMessagePromise = command.callback({
            msg,
            match,
            user,
            created
          });
          replyMessagePromise.then(replyMessage => {
            if (replyMessage && typeof replyMessage === "string") {
              bot.sendMessage(msg.from.id, replyMessage, {
                parse_mode: "html",
                reply_markup: JSON.stringify({
                  keyboard: generateReplyKeyboard(user)
                })
              });
            }
          });
        })
        .catch(err => {
          logger.error(err);
          return;
        });
    });
  });
  exports.sendNotification = (users, caption) => {
    users.map(user => {
      bot.sendMessage(user, caption, {
        parse_mode: "html",
        reply_markup: JSON.stringify({
          keyboard: generateReplyKeyboard(user)
        })
      });
    });
  };
  return exports;
};

const generateReplyKeyboard = user => {
  const enabledCommandNames = Object.keys(commands)
    .map(key => commands[key])
    .filter(command => {
      // Get enabled commands
      if (typeof command.showInMenu === "function") {
        return command.showInMenu(user);
      } else return !!command.showInMenu;
    })
    .map(command => {
      // Construct Telegram API KeyboardButton objects
      const notificationText = user.notifications
        ? "/notifications 🔉"
        : "/notifications 📵";
      return [
        {
          text:
            command.name === "/notifications" ? notificationText : command.name
        }
      ];
    });

  return enabledCommandNames;
};

const commandDescriptions = () =>
  Object.keys(commands).map(key => commands[key].description).join("\n");
