import { Menu , MenuRange } from "@grammyjs/menu";
import { MyContext } from '../utils/types';
import logger from 'euberlog';
import { get } from 'http';
import {getNextEventsMsg} from '../utils/calendarhelp';
import { createPreviewJob, previewJobs, reviewJobs, userjobsid, formatter } from '../utils/notification';
import { getCatClient  } from '../utils/ai';
import fs from 'fs';
import * as schedule from 'node-schedule';
// settingsmenu used to handle notification of the bot



// Define the higher-order function
// Define the middleware function outside
async function editMsgListNotification(ctx: MyContext) {

  if (!ctx.from) return

  const notificationMsg = fs.readFileSync('./src/messages/notification.md', 'utf8');

  const preview = previewJobs[ctx.from?.id]
  const review = reviewJobs[ctx.from?.id]

  let msg = ' hai ' + (preview?.length || 0) + ' preview in programma'
  msg += '\nhai ' + (review?.length || 0) + ' review in programma'



  try {
    await ctx.editMessageText(notificationMsg, { reply_markup: settingsMenu, parse_mode: 'MarkdownV2'});

  } catch (e) {
     logger.warning(e as string);
  }
 }


async function editMsgCalendar(ctx: MyContext) {

  if (!ctx.from) return
  if (!ctx.session.calendar) return

  const nextEvents = getNextEventsMsg(ctx.session.calendar);
  const msg = ctx.session.calendar ? 'il calendario ' + ctx.session.calendar?.title + ' ha ' + ctx.session.calendar?.events.length + ' eventi' : 'non hai un calendario'

  try {
      await ctx.editMessageText(msg + '\n' + nextEvents, { reply_markup: settingsMenu, parse_mode: 'MarkdownV2'});
  } catch (e) {
      logger.warning(e as string);
  }
}

async function editMsgFile(ctx: MyContext) {
  
    if (!ctx.from) return
  
    const fileMsg = fs.readFileSync('./src/messages/docs.md', 'utf8');
  
    try {
      await ctx.editMessageText(fileMsg, { reply_markup: settingsMenu, parse_mode: 'MarkdownV2'});
  
    } catch (e) {
      logger.warning(e as string);
    }
  }


export const settingsMenu = new Menu<MyContext>("root-menu")
  .submenu( (ctx: MyContext) => ctx.from && ctx.session.calendar  ?  "📆 Calendario ✅": "📆 Calendario  ❌" , "calendar-menu", editMsgCalendar)
  .submenu("🔔 Notifiche 🔕", "notification-menu" , editMsgListNotification ).row()
  .text(
    (ctx: MyContext) => ctx.from && ctx.session.wantsChat  ?  "💬 chat ✅": "💬 chat ❌" ,
    async (ctx) => {
      if (!ctx.session.isTester) {
        await ctx.reply('per utilizzare la chat devi essere un tester certificato, contattaci')
      }else {
        ctx.session.wantsChat = !ctx.session.wantsChat;
        if (ctx.session.wantsChat) {
            getCatClient(`${ctx.from?.id}`)
        }
        ctx.menu.update(); // update the menu!
      }

    })
  .submenu( (ctx: MyContext) => ctx.from && ctx.session.wantsDocs  ?  "📁 files ✅": "📁 files ❌", "file-menu", editMsgFile)


const fileMenu = new Menu<MyContext>("file-menu")
  .text(
    (ctx: MyContext) => ctx.from && !ctx.session.wantsDocs  ?  "📁 entra nella waitlist 📁": "📁 sei nella waitilist ✅",
    async (ctx) => {
      ctx.session.wantsDocs = !ctx.session.wantsDocs;
      ctx.menu.update(); // update the menu!
    
    },
  ).row()
  .back("Go Back",async (ctx) => {

    try {
      const welcomeText = fs.readFileSync('./src/messages/welcome.md', 'utf8');
      await ctx.editMessageText(welcomeText, { reply_markup: settingsMenu, parse_mode: 'MarkdownV2'});
    }catch (e) { logger.error(e as string)}
      

  });


//calendar menu 
const calendarMenu = new Menu<MyContext>("calendar-menu")
  .text(
    (ctx: MyContext) => ctx.from && ctx.session.calendar ? "aggiorna calendario" : "aggiungi calendario",
    async (ctx) => {
      await ctx.conversation.enter("addcalendario");

    })
  .text(
    ">",
    async (ctx) => {
      if (!ctx.session.calendar) return
      const nextEvents = getNextEventsMsg(ctx.session.calendar);
      try {
      await ctx.editMessageText('il calendario ' + ctx.session.calendar?.title + ' ha ' + ctx.session.calendar?.events.length + ' eventi e ' + nextEvents,  { parse_mode: 'MarkdownV2'})
      }catch (e) { logger.error(e as string)}
      //await ctx.reply('il calendario ' + ctx.session.calendar?.title + ' ha ' + ctx.session.calendar?.events.length + ' eventi ')

    }).row()
  .back("Go Back",async (ctx) => {

    try {
      const welcomeText = fs.readFileSync('./src/messages/welcome.md', 'utf8');
      await ctx.editMessageText(welcomeText, { reply_markup: settingsMenu, parse_mode: 'MarkdownV2'});
    }catch (e) { logger.error(e as string)}
      

  });


//notification menu
const notificationSettings = new Menu<MyContext>("notification-menu")
  .text(
  (ctx: MyContext) => ctx.from && ctx.session.daily ? "🔔 daily" : "🔕 daily",
  (ctx) => {
    ctx.session.daily = !ctx.session.daily;
    ctx.menu.update(); // update the menu!
  })
  .text(
    (ctx: MyContext) => ctx.from && ctx.session.preview ? "🔔 preview" : "🔕 preview",
    async (ctx) => {
      ctx.session.preview = !ctx.session.preview;

      ctx.menu.update(); // update the menu!
    },
  )
  .text(
    (ctx: MyContext) => ctx.from && ctx.session.review ? "🔔 review" : "🔕 review",
    (ctx) => {
      ctx.session.review = !ctx.session.review;
      ctx.menu.update(); // update the menu!
    },
  )
  .row()
  .text(
    "lista prossime notifiche",
    async (ctx) => {

      const jobs = schedule.scheduledJobs

      // sort jobs alphabetically
      const jobsArray = Object.keys(jobs).map((job) => jobs[job].nextInvocation());
      jobsArray.sort((a, b) => a.getTime() - b.getTime());

      let msg = 'hai ' + jobsArray?.length + ' eventi in programma'

      for (const job of jobsArray?.slice(0,5) || []) {
        const date = formatter.format(new Date(job))
        msg += '\n' + date
      }
      try {
        await ctx.editMessageText(msg, { reply_markup: notificationSettings, parse_mode: 'MarkdownV2'});
      }
      catch (e) {
        logger.error(e as string)
      }
    })
    .back("Go Back",async (ctx) => {

      try {
        const welcomeText = fs.readFileSync('./src/messages/welcome.md', 'utf8');
        await ctx.editMessageText(welcomeText, {  parse_mode: 'MarkdownV2'});
      }catch (e) { logger.error(e as string)}
        
  
    });





settingsMenu.register(notificationSettings);
settingsMenu.register(calendarMenu);
settingsMenu.register(fileMenu);




