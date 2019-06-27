const TelegramBot = require('node-telegram-bot-api');
const token = '812346853:AAFRrmH0uJPZbc24DtIY-bl0NH0J5jFm1gI';
const bot = new TelegramBot(token, {polling: true});

const schedule = require('node-schedule');

var keyboard_options = {
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [{ text: '👍', callback_data: 'read' }, { text: '👎', callback_data: 'dontread' }],
        ],
        resize_keyboard: true
      })
    };

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, `Hi ${msg.chat.first_name}! I'm Tim and i'll be your guide in your book reading journey!`);
  bot.sendMessage(msg.chat.id, `At least till the Bukdu app comes out.`);
  bot.sendMessage(msg.chat.id, `Send a /help message to find out how to use this`);
});

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id, `Send a /remind {book name} {time(hh:mm)} message to set a book and a reminder`);
  bot.sendMessage(msg.chat.id, "E.g. /remind Half blood prince 21:30 or /remind 1984 09:15");
  bot.sendMessage(msg.chat.id, `Send a /remove {book name} message to remove an existing reminder`);
  bot.sendMessage(msg.chat.id, `Send a /list message to see all your existing reminders`);
});

bot.onText(/\/remind (.+)/, (msg, match) => {
  let params = match.slice(1)[0].split(" ");
  let book = params.slice(0, params.length - 1).join(" ");
  let time = params[params.length-1];
  if (params.length < 2) {
    bot.sendMessage(msg.chat.id, "Incorrect usage, /remind {book name} {time hh:mm}");
    bot.sendMessage(msg.chat.id, "Make sure book name is space separated!");
    bot.sendMessage(msg.chat.id, "E.g. /remind Half blood prince 21:30 or /remind 1984 09:15");
  } else if (time.indexOf(":") < 0) {
    bot.sendMessage(msg.chat.id, "Incorrect usage, /remind {book name} {time hh:mm}");
    bot.sendMessage(msg.chat.id, "Make sure book name is space separated!");
    bot.sendMessage(msg.chat.id, "E.g. /remind Half blood prince 21:30 or /remind 1984 09:15");
  } else {
    bot.sendMessage(msg.chat.id, `Nice choice ${book} is a good book and ${time} is statistically the best time to read!`);
    let hh = time.substring(0, time.indexOf(":"));
    let mm = time.substring(time.indexOf(":") + 1);
    let clean_book = book.replace(/\s/g, '_');
    // const cron_string = `*/2 * * * *`
    const cron_string = `${mm} ${hh} * * *`
    console.log(`Adding ${msg.chat.id}<>${clean_book}`);
    const j = schedule.scheduleJob(`${msg.chat.id}<>${clean_book}`, cron_string, function(){
      bot.sendMessage(msg.chat.id, `Time to read ${book}!!`, keyboard_options);
      console.log('Sending daily reminder');
    });
  }
});

bot.onText(/\/remove (.+)/, (msg, match) => {
  let params = match.slice(1)[0];
  params = params.replace(/\s/g, '_');
  console.log(`Removing ${msg.chat.id}<>${params}`);
  if (!!schedule.scheduledJobs[`${msg.chat.id}<>${params}`]) {
    const my_job = schedule.scheduledJobs[`${msg.chat.id}<>${params}`];
    my_job.cancel();
    bot.sendMessage(msg.chat.id, `Canceled reminder, hopefully you finished reading`);
  } else {
    bot.sendMessage(msg.chat.id, `No such reminder. Make sure the book name matches what you entered while creating it`);
  }
})

bot.onText(/\/list/, (msg) => {
  let list = Object.keys(schedule.scheduledJobs);
  new_list = list.filter((elem) => {
    return elem.indexOf(msg.chat.id) >= 0;
  });
  if (new_list.length < 1) {
    bot.sendMessage(msg.chat.id, `No reminders set!`);
  }
  new_list.forEach(element => {
    let name = element.split("<>")[1];
    name = name.replace(/_/g, ' ');
    bot.sendMessage(msg.chat.id, `${name}`);
  });
});

bot.on('callback_query', function onCallbackQuery(callbackQuery) {
  const action = callbackQuery.data;
  const msg = callbackQuery.message;
  const opts = {
    chat_id: msg.chat.id,
    message_id: msg.message_id,
  };
  let text;

  if (action === 'read') {
    text = 'Thanks for reading!';
  }
  if (action === 'dontread') {
    text = 'Please read soon!';
  }

  bot.editMessageText(text, opts);
});