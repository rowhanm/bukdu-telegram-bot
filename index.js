const TelegramBot = require('node-telegram-bot-api');
const token = '812346853:AAFRrmH0uJPZbc24DtIY-bl0NH0J5jFm1gI';
// const token = '729825458:AAHZY05zU_Aurt64-09vCPZl0FAQso7Stso';
const bot = new TelegramBot(token, {polling: true});
const loki = require("lokijs");

const db = new loki('loki.json', {
 	autosave: true, 
	autosaveInterval: 10000 
});

let userData;
let clickData;

function databaseInitialize() {
  userData = db.getCollection('userData');
  clickData = db.getCollection('clickData');
  if (userData === null) {
    userData = db.addCollection("userData");
  }
  if (clickData === null) {
    clickData = db.addCollection("clickData");
  }
  userData.find().forEach(element => {
    const j = schedule.scheduleJob(element.entryVariable, element.cron_string, function(){
      bot.sendMessage(element.id, `Time to read ${element.book}!!`, keyboard_options);
      console.log('Sending daily reminder');
    });
  });
}

db.loadDatabase({}, function(err) {
  if (err) throw err;
  databaseInitialize();
  console.log("db initialized");
});


const schedule = require('node-schedule');

var keyboard_options = {
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [{ text: `I'll read now!`, callback_data: 'read' }, { text: `I'll read later`, callback_data: 'dontread' }],
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


bot.on("message", (msg) => {
    let checker = msg.text.toString().toLowerCase(); 
    if (checker === "/remind") {
      bot.sendMessage(msg.chat.id, "Incorrect usage, /remind {book name} {time hh:mm}");
      bot.sendMessage(msg.chat.id, "Make sure book name is space separated!");
      bot.sendMessage(msg.chat.id, "E.g. /remind Half blood prince 21:30 or /remind 1984 09:15");
    } else if (checker === "/remove") {
      bot.sendMessage(msg.chat.id, "Incorrect usage, /remove {book name}");
    }
});

bot.onText(/\/remind(.+)/, (msg, match) => {
  let params = match.slice(1)[0].split(" ");
  let book = params.slice(0, params.length - 1).join(" ");
  let time = params[params.length-1];
  if (params.length < 2) {
    bot.sendMessage(msg.chat.id, "Incorrect usage, /remind {book name} {time hh:mm}");
    bot.sendMessage(msg.chat.id, "Make sure book name is space separated!");
    bot.sendMessage(msg.chat.id, "E.g. /remind Half blood prince 21:30 or /remind 1984 09:15");
  } else if (time.indexOf(":") < 2) {
    bot.sendMessage(msg.chat.id, "Incorrect usage, /remind {book name} {time hh:mm}");
    bot.sendMessage(msg.chat.id, "Make sure book name is space separated!");
    bot.sendMessage(msg.chat.id, "E.g. /remind Half blood prince 21:30 or /remind 1984 09:15");
  } else {
    bot.sendMessage(msg.chat.id, `Nice choice ${book} is a good book and ${time} is statistically the best time to read!`);
    let hh = time.substring(0, time.indexOf(":"));
    let mm = time.substring(time.indexOf(":") + 1);
    let clean_book = book.replace(/\s/g, '_');
    let entryVariable = `${msg.chat.id}<>${clean_book}`
    // const cron_string = `*/2 * * * *`
    const cron_string = `${mm} ${hh} * * *`
    console.log(`Adding ${entryVariable}`);
    const j = schedule.scheduleJob(entryVariable, cron_string, function(){
      bot.sendMessage(msg.chat.id, `Time to read ${book}!!`, keyboard_options);
      console.log('Sending daily reminder');
    });
    userData.insert({id: msg.chat.id, book, time, cron_string, entryVariable});
    clickData.insert({id: msg.chat.id, book, yes: 0, no: 0});
    db.saveDatabase();
  }
});

bot.onText(/\/remove (.+)/, (msg, match) => {
  let params = match.slice(1)[0];
  params = params.replace(/\s/g, '_');
  let entryVariable = `${msg.chat.id}<>_${params}`
  console.log(`Removing ${entryVariable}`);
  if (!!schedule.scheduledJobs[entryVariable]) {
    const my_job = schedule.scheduledJobs[entryVariable];
    my_job.cancel();
    bot.sendMessage(msg.chat.id, `Canceled reminder, hopefully you finished reading`);
    // userData.chain().find({id: msg.chat.id, book: params}).remove();
    // Remove from lokijs not working, cant find fix online. Shall look at it later
  } else {
    bot.sendMessage(msg.chat.id, `No such reminder. Make sure the book name matches what you entered while creating it`);
  }
})

bot.onText(/\/list/, (msg) => {
  let all = userData.find({id: msg.chat.id});
  const userThoughts = all.filter(thought => thought.id === msg.chat.id);
  userThoughts.forEach(element => {
    bot.sendMessage(msg.chat.id, `${element.book} -> ${element.time}`);
  });
});

bot.onText(/\/stats/, (msg) => {
  var user = clickData.findObject({id: msg.chat.id});
  bot.sendMessage(msg.chat.id, `Times read: ${user.yes}`);
  bot.sendMessage(msg.chat.id, `Times procrastinated: ${user.no}`);
});

bot.on('callback_query', function onCallbackQuery(callbackQuery) {
  const action = callbackQuery.data;
  const msg = callbackQuery.message;
  const opts = {
    chat_id: msg.chat.id,
    message_id: msg.message_id,
  };
  let text;
  var user = clickData.findObject({id: msg.chat.id});
  if (action === 'read') {
    text = 'Thanks for reading!';
    user.yes += 1; 
  }
  if (action === 'dontread') {
    text = 'Please read soon!';
    user.no += 1; 
  }
  clickData.update(user);
  db.saveDatabase();
  bot.editMessageText(text, opts);
});