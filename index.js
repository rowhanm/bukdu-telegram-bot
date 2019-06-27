const TelegramBot = require('node-telegram-bot-api');
const token = '812346853:AAFRrmH0uJPZbc24DtIY-bl0NH0J5jFm1gI';
const bot = new TelegramBot(token, {polling: true});

const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync('./db.json')
const db = low(adapter)

const schedule = require('node-schedule');

db.defaults({user: {}})
  .write()

var keyboard_option = {
  "reply_markup": JSON.stringify({
      "inline_keyboard": [
        [{ text: 'yess', callback_data: '1' }],
        [{ text: 'nope', callback_data: '2' }],
        [{ text: 'Snooze', callback_data: '3' }]
      ],
    resize_keyboard: true
  })
};


bot.onText(/\/ssup/, (msg) => {
  console.log(msg.chat.id);
})

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
    let data = {
      id: msg.chat.id,
      book,
      time
    }
    let hh = time.substring(0, time.indexOf(":"));
    let mm = time.substring(time.indexOf(":") + 1);
    console.log(hh, mm);
    let clean_book = book.replace(/\s/g, '');
    const cron_string = `${mm} ${hh} * * *`
    const j = schedule.scheduleJob(`${msg.chat.id}_${clean_book}`, `*/3 * * * *`, function(){
      bot.sendMessage(msg.chat.id, `Time to read ${book}!!`);
      console.log('Sending daily reminder');
    });
    // const j = schedule.scheduleJob(`${msg.chat.id}_${book}`, cron_string, function(){
    //   bot.sendMessage(msg.chat.id, `Time to read ${book}!!`);
    //   console.log('Sending daily reminder');
    // });
  }
});

bot.onText(/\/remove (.+)/, (msg, match) => {
  let params = match.slice(1)[0];
  params = params.replace(/\s/g, '');
  const my_job = schedule.scheduledJobs[`${msg.chat.id}_${params}`];
  my_job.cancel();
  bot.sendMessage(msg.chat.id, `Canceled reminder, hopefully you finished reading`);
})

bot.onText(/\/list/, (msg) => {
  let list = Object.keys(schedule.scheduledJobs)
  if (list.length < 1) {
    bot.sendMessage(msg.chat.id, `No reminders set!`);
  }
  list.forEach(element => {
    let name = element.split("_")[1];
    bot.sendMessage(msg.chat.id, `${name}`);
  });
});

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, `Hi ${msg.chat.first_name}! I'm Tim and i'll be your guide in your book reading journey!`);
  bot.sendMessage(msg.chat.id, `At least till the Bukdu app comes out.`);
  bot.sendMessage(msg.chat.id, `Send a /remind {book name} {time(hh:mm)} message to set a book and a reminder`);
  bot.sendMessage(msg.chat.id, `Send a /remove {book name} message to remove an existing reminder`);
  bot.sendMessage(msg.chat.id, `Send a /list message to see all your existing reminders`);
})

const optRemove = {
  reply_markup: {
     remove_keyboard: true
  }
};

bot.on('callback_query', function onCallbackQuery(callbackQuery) {
  const action = callbackQuery.data;
  const msg = callbackQuery.message;
  const opts = {
    chat_id: msg.chat.id,
    message_id: msg.message_id,
  };

  if (action === '1') {
    bot.sendMessage(msg.chat.id, "Nice, I knew you were a good boy!", optRemove);
    bot.deleteMessage(msg.chat.id, opts.message_id);
  }
  if (action === '2') {
    bot.sendMessage(msg.chat.id, "Bad doggie!", optRemove);
    bot.deleteMessage(msg.chat.id, opts.message_id);
  }
  if (action === '3') {
    bot.sendMessage(msg.chat.id, "Bad doggie!", optRemove);
    bot.deleteMessage(msg.chat.id, opts.message_id);
  }
});