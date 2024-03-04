import { Bot, Context, session, Keyboard, GrammyError, HttpError, InlineKeyboard, SessionFlavor } from "grammy";

import { FileFlavor, hydrateFiles } from "@grammyjs/files";
import 'dotenv/config'

import { CatClient } from 'ccat-api'
import OpenAI from "openai";

import axios from 'axios';
import fs from 'fs';
import { getEvents } from './utils/calendarhelp'
import {
  type Conversation,
  type ConversationFlavor,
  conversations,
  createConversation,
} from "@grammyjs/conversations";

import { settingsKeyboard } from "./utils/keyboards";
import { MyContext, MyConversation, ReviewLesson, SessionData, Event } from "./utils/types";
import { addcalendario, reviewLesson, setUpBot } from './utils/conversations';



// Load the environment variables from the .env file.
//calendars for testing
const url = 'https://easyacademy.unitn.it/AgendaStudentiUnitn/index.php?view=easycourse&include=corso&txtcurr=1+-+Computational+and+theoretical+modelling+of+language+and+cognition&anno=2023&corso=0708H&anno2%5B%5D=P0407%7C1&date=14-09-2023&_lang=en&highlighted_date=0&_lang=en&all_events=1&'
const url2 = 'https://easyacademy.unitn.it/AgendaStudentiUnitn/index.php?view=easycourse&form-type=corso&include=corso&txtcurr=2+-+Economics+and+Management&anno=2023&corso=0117G&anno2%5B%5D=P0201%7C2&date=25-02-2024&periodo_didattico=&_lang=en&list=&week_grid_type=-1&ar_codes_=&ar_select_=&col_cells=0&empty_box=0&only_grid=0&highlighted_date=0&all_events=0&faculty_group=0'
const url3 = 'https://easyacademy.unitn.it/AgendaStudentiUnitn/index.php?view=easycourse&form-type=corso&include=corso&txtcurr=1+-+Scienze+e+Tecnologie+Informatiche&anno=2023&corso=0514G&anno2%5B%5D=P0405%7C1&date=01-03-2024&periodo_didattico=&_lang=en&list=&week_grid_type=-1&ar_codes_=&ar_select_=&col_cells=0&empty_box=0&only_grid=0&highlighted_date=0&all_events=0&faculty_group=0#'
//const url4 = 'https://calendari.unibs.it/PortaleStudenti/index.php?view=easycourse&form-type=corso&include=corso&txtcurr=1+-+GENERALE+-+Cognomi+M-Z&anno=2023&scuola=IngegneriaMeccanicaeIndustriale&corso=05742&anno2%5B%5D=3%7C1&visualizzazione_orario=cal&date=07-03-2024&periodo_didattico=&_lang=en&list=&week_grid_type=-1&ar_codes_=&ar_select_=&col_cells=0&empty_box=0&only_grid=0&highlighted_date=0&all_events=0&faculty_group=0#'



const { URL, PORT, AUTH_KEY, BOT_TOKEN } = process.env

// AI stuff
const openai = new OpenAI();
const cat = new CatClient({
  baseUrl: URL as any,
  user: 'user',
  port: PORT ? parseInt(PORT) : undefined,
  authKey: AUTH_KEY,
})




// bot stuff

function initSession(): SessionData {
  return { preview: false, review: false, daily: false, calendarUrl: '' };
}

const bot = new Bot<MyContext>(BOT_TOKEN as string);
//bot.use(session({ initial: () => ({}) }));
bot.use(session({ initial: () => initSession() }));
bot.use(conversations());
bot.use(createConversation(addcalendario));
bot.use(createConversation(reviewLesson));
bot.use(createConversation(setUpBot));


const calendar: Event[] = []





// settings Callback query handlers
bot.callbackQuery('preview', ctx => {
  ctx.session.preview = !ctx.session.preview;
  ctx.editMessageReplyMarkup({ reply_markup: settingsKeyboard(ctx) });

});

bot.callbackQuery('review', ctx => {
  ctx.session.review = !ctx.session.review;
  ctx.editMessageReplyMarkup({ reply_markup: settingsKeyboard(ctx) });
});

bot.callbackQuery('daily', ctx => {
  ctx.session.daily = !ctx.session.daily;
  ctx.editMessageReplyMarkup({ reply_markup: settingsKeyboard(ctx) });
});




// Create an instance of the `Bot` class and pass your bot token to it.

async function startBot() {

  await bot.api.setMyCommands([
    { command: "start", description: "Start the bot" },
    { command: "help", description: "debug stuff" },
    { command: "settings", description: "settings" },
    { command: "review", description: "review lesson" },
    { command: "addcalendar", description: "add un calendar" },
    { command: "getevents", description: "get events from calendar" },
    { command: "image", description: "generate image from prompt" },
    { command: "daily", description: "get daily events from the clandar" },
  ]);



  // Start the bot
  bot.start();
  bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`Error while handling update ${ctx.update.update_id}:`);
    const e = err.error;
    if (e instanceof GrammyError) {
      console.error("Error in request:", e.description);
    } else if (e instanceof HttpError) {
      console.error("Could not contact Telegram:", e);
    } else {
      console.error("Unknown error:", e);
    }
  });

  console.log("Bot is running");
}




bot.command('daily', async (ctx) => {
  // const events = await getEvents(url3)
  //console.log(events)

  if (ctx.session.calendarUrl) {
    getEvents(ctx.session.calendarUrl)
  }


  const today = new Date()

  const todayEvents = calendar.filter(event => event.start.toDateString() === today.toDateString())
  console.log(todayEvents)


  let dailyEvents = ""
  dailyEvents = 'Buongiorno, oggi hai da fare:\n\n'

  todayEvents.forEach(event => {

    const start = event.start.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
    dailyEvents += `${start} - ${event.summary}\n\n`
  })

  if (dailyEvents === 'Buongiorno, oggi hai da fare:\n\n') {
    dailyEvents = 'Buongiorno, oggi non hai lezioni\n\n'
  }
  ctx.reply(dailyEvents)
});



bot.command("nextevents", async (ctx) => {
  const calendar = ctx.session.calendar

  if (!calendar) {
    ctx.reply('non hai ancora aggiunto un calendario, /addcalendar')
    return

  }
  // sort calendar by date
  const today = new Date()
  const nextEvents = calendar.filter(event => event.start > today)
  console.log(nextEvents)

  //sort by date
  nextEvents.sort((a, b) => a.start.getTime() - b.start.getTime())

  let nextEventsString = "I tuoi prossimi eventi:\n\n"
  // get next 3 events with date and time
  nextEvents.slice(0, 3).forEach(event => {
    const start = event.start.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
    const end = event.end.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
    const date = event.start.toLocaleDateString('it-IT', { weekday: 'short',day: 'numeric'});
    nextEventsString += `${date}, ${start} - ${end} \n${event.summary}\n\n`
  })

  ctx.reply(nextEventsString)

  

});



// Handle the /start command.
bot.command("start", async (ctx) => {
  await ctx.conversation.enter("setUpBot");
});

// add a calendar from url
bot.command("addcalendar", async (ctx) => {
  await ctx.conversation.enter("addcalendario");
});

bot.command('review', async (ctx) => {
  await ctx.conversation.enter("reviewLesson");
});


bot.command("getevents", async (ctx) => {
  const events = await getEvents(url)
  //console.log(events)

});


// generate image from prompt
bot.command("image", async (ctx) => {
  // `item` will be "apple pie" if a user sends "/add apple pie".
  const user_prompt = ctx.match;

  if (user_prompt && (ctx.from?.id === 529895213 || ctx.from?.id === 102841323)) {
    ctx.reply('spending 4 cent to generate this image, please wait...')

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: user_prompt,
      n: 1,
      size: "1024x1024",
    });
    let image_url = response as any;

    ctx.reply(image_url.data[0].url);
  } else {
    ctx.reply('please insert a prompt after /image, or you may not have the rights to do so')
  }
});

// this is for debugging
bot.command("help", async (ctx) => {
  console.log(ctx.session)

  ctx.reply('help')

});

bot.command("settings", async (ctx) => {

  ctx.reply('Settings: qui puoi scegliere se vuoi \n le preview prima della lezione,  \n review alla fine, \n daily la mattina con la task del giorno', { reply_markup: settingsKeyboard(ctx) });

});


bot.on(":document", async (ctx) => {
  ctx.reply('sto caricando il file')
  console.log('bel documento')
  const document = ctx.message?.document
  if (!document || !document.mime_type) {
    ctx.reply("Non hai inviato un documento");
    return;
  }
  const docfile = await ctx.getFile()
  console.log(docfile)
  const acceptedTypes = (await cat.api?.rabbitHole.getAllowedMimetypes())?.allowed
  const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${docfile.file_path}`

  if (!acceptedTypes?.includes(document.mime_type)) {
    ctx.reply(`*il file \`${document?.mime_type}\` non è supportato\\!*`)
    return
  }

  console.log(fileUrl)




  const formData = new FormData();
  let blob: Blob;

  try {

    const response = await axios.get(url, { responseType: 'stream' });
    const file = fs.createWriteStream('file.pdf');

    response.data.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('file downloaded');
    });



    //formData.append('file', blob, 'file.pdf');


    //formData.append('file', blob, 'file.pdf');



  } catch (err) {
    console.log('errore', err);
    console.log('errore', docfile.file_path);
    return;
  }



  //await cat.api?.rabbitHole.uploadFile({ file: formData });

  ctx.reply('file uploaded')


  // get blob   





});

// Handle normal messages. this talks with the cat
bot.on('message', ctx => {
  const msg = ctx.message.text as string

  if (msg.startsWith('/')) return

  console.log('sending message to cat')


  //cat.userId = `${ctx.from?.id}`
  cat.send(msg)

  ctx.replyWithChatAction('typing')
  cat.onMessage(res => {
    // Assuming 'END' is the token indicating the end of the text generation

    if (res.type === 'chat') {
      ctx.reply(res.content);
    }

  })
});







startBot()

// import https from 'https';

// const file = fs.createWriteStream("file.txt");
// const request = https.get("https://api.telegram.org/file/bot5986946687:AAF4JvOy-Kr9y-WnDdYlhdqZjHf1zD6fF4E/documents/file_9.pdf", function(response: any) {
//   console.log(response.data)
//   //response.pipe(file);
// });