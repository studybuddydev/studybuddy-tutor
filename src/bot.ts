import { Bot, session, GrammyError, HttpError } from "grammy";
import 'dotenv/config'
import FormData from 'form-data';
import { CatClient } from 'ccat-api'
import OpenAI from "openai";
import axios from 'axios';
import { getEvents, getDailyEvents, getNextEvents, refreshCalendar } from './utils/calendarhelp'
import { conversations, createConversation, } from "@grammyjs/conversations";
import { settingsMenu } from "./utils/menu";
import { MyContext, type Event, type Calendar } from "./utils/types";
import { SessionData, initialSession } from "./utils/session";
import { addcalendario, reviewLesson, setUpBot, setRole } from './utils/conversations';
import { FileAdapter } from '@grammyjs/storage-file';




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
const bot = new Bot<MyContext>(BOT_TOKEN as string);

// function initSession(): SessionData {
//   return { preview: true, review: true, daily: true, calendarUrl: '' };
// }

bot.use(
  session({
    initial: () => initialSession(),
   // storage: new FileAdapter<SessionData>({ dirName: "sessions", }),
  })
);


bot.use(conversations());
bot.use(createConversation(addcalendario));
bot.use(createConversation(reviewLesson));
bot.use(createConversation(setUpBot));
bot.use(createConversation(setRole));
bot.use(settingsMenu);  





const calendar: Event[] = []



// Create an instance of the `Bot` class and pass your bot token to it.

async function startBot() {

  await bot.api.setMyCommands([
    { command: "start", description: "Start the bot" },
    { command: "help", description: "debug stuff" },
    { command: "settings", description: "settings" },
    { command: "review", description: "review lesson" },
    { command: "addcalendar", description: "add un calendar" },
    { command: "nextevents", description: "get next 3 events from calendar" },
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


// COMMANDS  ================================================================ 

bot.command('daily', async (ctx) => {
  // const events = await getEvents(url3)
  //console.log(events)
  if (!ctx.session.calendar) {
    ctx.reply('non hai ancora aggiunto un calendario, /addcalendar')
    return
  }
  const dailyEvents = getDailyEvents(ctx.session.calendar)


  ctx.reply(dailyEvents)
});



bot.command("nextevents", async (ctx) => {
  const calendar: Calendar | undefined = ctx.session.calendar

  if (!calendar) {
    ctx.reply('non hai ancora aggiunto un calendario, /addcalendar')
    return

  }

  const nextEvents = getNextEvents(calendar)

  ctx.reply(nextEvents)



});



// Handle the /start command.
bot.command("start", async (ctx) => {
  await ctx.conversation.enter("setUpBot");
});

// add a calendar from url
bot.command("addcalendar", async (ctx) => {
  console.log('addcalendar')
  await ctx.conversation.enter("addcalendario");
});

bot.command('review', async (ctx) => {
  await ctx.conversation.enter("reviewLesson");
});


bot.command("refresh", async (ctx) => {
  await refreshCalendar(ctx)

  //console.log(events)
  ctx.reply('calendario aggiornato')

});

bot.command('buddha', async (ctx) => {
  const url = 'https://buddha-api.com/api/random'
  const response = await axios.get(url)
  const text = response.data.text
  const author = response.data.byName
  ctx.reply(`${text}\n\n~${author}`)
});


// generate image from prompt
bot.command("image", async (ctx) => {
  // `item` will be "apple pie" if a user sends "/add apple pie".
  const user_prompt = ctx.match;

  if (user_prompt && ctx.session.isAdmin) {
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

  ctx.reply('Settings: qui puoi scegliere se vuoi \n le preview prima della lezione,  \n review alla fine, \n daily la mattina con la task del giorno', { reply_markup: settingsMenu });

});

bot.command("admin", async (ctx) => {
  await ctx.reply('admin: ' + ctx.session.isAdmin +'\ntester: ' + ctx.session.isTester)

  if (!ctx.session.isTester) {

    await ctx.conversation.enter("setRole");
  }
  

});


// MESSAGES ================================================================

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

  const blob = await fetch(fileUrl).then(r => r.blob())
  //const file = new File([blob], 'file.pdf', { type: 'application/pdf' });

  await cat.api?.rabbitHole.uploadFile({ file: blob });

  // try {

  //   const response = await axios.get(url, { responseType: 'arraybuffer' });
  //   const fileBuffer = Buffer.from(response.data, 'binary');

  //   //fs.writeFileSync('/data/file.pdf', fileBuffer);

  //   const fileBlob = new Blob([fileBuffer], { type: 'application/pdf' }); // Adjust the MIME type as necessary

  //   formData.append('file', fileBuffer, {
  //     filename: 'file.pdf', // The name of the file
  //     contentType: 'application/pdf', // The MIME type of the file
  //   });
  //   await cat.api?.rabbitHole.uploadFile({ file: fileBlob });

  //   ctx.reply('file uploaded')


  // } catch (err) {
  //   console.log('errore', err);
  //   console.log('errore', docfile.file_path);
  //   return;
  // }




  ctx.reply('file uploaded')


  // get blob   





});


// Handle normal messages. this talks with the cat
bot.on('message', ctx => {
  const msg = ctx.message.text as string
  if (msg.startsWith('/')) return

  if (ctx.session.isTester) {

    console.log('sending message to cat')

    //cat.userId = `${ctx.from?.id}`
    cat.send(msg)
    ctx.replyWithChatAction('typing')
    cat.onMessage(res => {

      if (res.type === 'chat') {
        ctx.reply(res.content);
      }

    })
  } else {
    ctx.reply('non sei un tester, contattaci per usare la chat')
  }
});






startBot()
