import { Menu } from "@grammyjs/menu";
import { MyContext } from './types';
import logger from 'euberlog';
import { get } from 'http';
import {getNextEvents } from './calendarhelp';
import { createPreviewJob, previewJobs, reviewJobs } from './notification';

// settingsmenu used to handle notification of the bot

const formatter = new Intl.DateTimeFormat('it-IT', {
  weekday: 'short', // Short weekday name (e.g., "gio")
  day: 'numeric', // Day of the month (e.g., "20")
  month: 'short', // Short month name (e.g., "mar")
  hour: '2-digit', // Hour in 2-digit format (e.g., "12")
  minute: '2-digit', // Minute in 2-digit format (e.g., "30")
  hour12: false, // Use 24-hour format
 });

// Define the higher-order function
// Define the middleware function outside
async function editMsgListNotification(ctx: MyContext) {

  if (!ctx.from) return

  const preview = previewJobs[ctx.from?.id]
  const review = reviewJobs[ctx.from?.id]

  let msg = ' hai ' + (preview?.length || 0) + ' preview in programma'
  msg += '\nhai ' + (review?.length || 0) + ' review in programma'



  try {
     await ctx.editMessageText(msg);
  } catch (e) {
     logger.warning(e as string);
  }
 }


export const settingsMenu = new Menu<MyContext>("root-menu")
  .submenu( (ctx: MyContext) => ctx.from && ctx.session.calendar  ?  "📆 Calendario ✅": "📆 Calendario  ❌" , "calendar-menu")
  .submenu("🔔 Notifiche 🔕", "notification-menu" , editMsgListNotification ).row()
  .text(
    (ctx: MyContext) => ctx.from && ctx.session.wantsChat  ?  "💬 chat ✅": "💬 chat ❌" ,
    async (ctx) => {
      if (!ctx.session.isTester) {
        await ctx.reply('per utilizzare la chat devi essere un tester certificato, contattaci')
      }else {
        ctx.session.wantsChat = !ctx.session.wantsChat;
        ctx.menu.update(); // update the menu!
      }

    })
  .submenu( (ctx: MyContext) => ctx.from && ctx.session.wantsDocs  ?  "📁 files ✅": "📁 files ❌", "file-menu")


const fileMenu = new Menu<MyContext>("file-menu")
  .text(
    (ctx: MyContext) => ctx.from && !ctx.session.wantsDocs  ?  "📁 entra nella waitlist 📁": "📁 sei nella waitilist ✅",
    async (ctx) => {
      ctx.session.wantsDocs = !ctx.session.wantsDocs;
      ctx.menu.update(); // update the menu!
    
    },
  ).row()
  .back("Go Back");


//calendar menu 
const calendarMenu = new Menu<MyContext>("calendar-menu")
  .text(
    (ctx: MyContext) => ctx.from && ctx.session.calendar ? "aggiorna calendario" : "aggiungi calendario",
    async (ctx) => {
      await ctx.conversation.enter("addcalendario");

    })
  .text(
    "prossimi eventi",
    async (ctx) => {
      if (!ctx.session.calendar) return
      const nextEvents = getNextEvents(ctx.session.calendar);
      try {
      await ctx.editMessageText('il calendario ' + ctx.session.calendar?.title + ' ha ' + ctx.session.calendar?.events.length + ' eventi e ' + nextEvents)
      }catch (e) { logger.error(e as string)}
      //await ctx.reply('il calendario ' + ctx.session.calendar?.title + ' ha ' + ctx.session.calendar?.events.length + ' eventi ')

    }).row()
  .back("Go Back",async (ctx) => {

    try {
        await ctx.editMessageText('scegli qualcosa')
    }catch (e) { logger.error(e as string)}
      

  });


//notification menu
const notificationSettings = new Menu<MyContext>("notification-menu")
  .text(
    (ctx: MyContext) => ctx.from && ctx.session.preview ? "🔔 preview" : "🔕 preview",
    async (ctx) => {
      ctx.session.preview = !ctx.session.preview;

      // trigger an update so the middleware can update the jobs 
      // update the menu!
      // const previewJobs = previewJobs[ctx.from?.id]


      // const nextJobs = previewJobs[ctx.from?.id]
      // let msg = nextJobs?.length ? 'hai ' + nextJobs.length + ' eventi in programma' : 'non hai eventi in programma'

      // for (const job of nextJobs?.slice(0,10) || []) {
      //   msg += '\n' + job.nextInvocation().toLocaleString().substring(0, 10)
      // }
      // //ctx.reply(msg)


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
  .text(
    (ctx: MyContext) => ctx.from && ctx.session.daily ? "🔔 daily" : "🔕 daily",
    (ctx) => {
      ctx.session.daily = !ctx.session.daily;
      ctx.menu.update(); // update the menu!
    }).row()
  .text(
    "lista prossime notifiche",
    async (ctx) => {
      const nextPJobs = previewJobs[ctx.from?.id]
      let msg = nextPJobs?.length ? 'hai ' + nextPJobs.length + ' eventi preview  in programma' : 'non hai preview in programma'

      for (const job of nextPJobs?.slice(0,5) || []) {
        const date = new Date(job.nextInvocation())
        msg += '\n' + formatter.format(date)
      }

      const nextRJobs = reviewJobs[ctx.from?.id]
      msg += '\n\n'
      msg += nextRJobs?.length ? 'hai ' + nextRJobs.length + ' eventi review in programma' : 'non hai review in programma'

      for (const job of nextRJobs?.slice(0,5) || []) {
        const date = new Date(job.nextInvocation())
        msg += '\n' + formatter.format(date)
      }
      
      try {
        await ctx.editMessageText(msg);
      }
      catch (e) {
        logger.error(e as string)
      }
    })
  
  .back("Go Back");





settingsMenu.register(notificationSettings);
settingsMenu.register(calendarMenu);
settingsMenu.register(fileMenu);





export const todoMenu = new Menu<MyContext>("todo-menu")
  .text(
    "ok scrivilo",
    (ctx) => {
      //edit message 
      ctx.session.todo?.push(ctx.message?.text || '');
      ctx.editMessageText('todo list aggiunta n'+ ctx.session.todo?.length )  //   }catch (e) { console.log(e)} 
      
    },
  ) .text(
    "list todo",
    (ctx) => {
      //edit message 
      if (ctx.message?.text != 'todo list') {
        //ctx.editMessageText('todo list')
      }
      ctx.session.preview = !ctx.session.preview;
    },
  )  
  

const addTodoMenu = new Menu<MyContext>("add-todo")

  .text(
    "aggiungi",
    async (ctx) => {
      await ctx.session.todo?.push(ctx.message?.text || '');
    }
  ).row()
  .back("Go Back");


todoMenu.register(addTodoMenu);
