import { Menu , MenuRange } from "@grammyjs/menu";
import { MyContext } from './types';
import logger from 'euberlog';
import { get } from 'http';
import {getNextEvents } from './calendarhelp';
import { createPreviewJob, previewJobs, reviewJobs, userjobsid, formatter } from './notification';
import { getCatClient  } from './ai';
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

  const nextEvents = getNextEvents(ctx.session.calendar);
  const msg = ctx.session.calendar ? 'il calendario ' + ctx.session.calendar?.title + ' ha ' + ctx.session.calendar?.events.length + ' eventi' : 'non hai un calendario'

  try {
      await ctx.editMessageText(msg + '\n' + nextEvents);
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
    ">",
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
    "add todo",
    (ctx) => {
      //edit message 
      //ctx.session.todo?.push(ctx.message?.text || '');
     //   }catch (e) { console.log(e)} 
      ctx.reply('/todo todo da aggiungere')
    },
  ).submenu("elimina", 'delete-todo').row() 

const addTodoMenu = new Menu<MyContext>("add-todo")

  .text( 
    "aggiungi",
    async (ctx) => {
      await ctx.session.todo?.push(ctx.message?.text || '');
    }
  ).row()
  .back("Go Back");


const deleteTodoMenu = new Menu<MyContext>("delete-todo")
  .dynamic(async (ctx) => {
    // Generate a part of the menu dynamically!
    const range = new MenuRange<MyContext>();

    ctx.session.todo?.forEach((todo, index) => {
      range
        .text((todo).toString(), (ctx) => {
          ctx.session.todo?.splice(index, 1) 
          ctx.menu.update();

          let msg = 'hai ' + ctx.session.todo?.length + ' cose da fare: \n'
          ctx.session.todo?.forEach((todo, index) => {
              msg += `\n${index + 1}. ${todo}`;
          });
          ctx.editMessageText(msg)
          ctx.answerCallbackQuery({text: "todo eliminato",});
        
        })
  });



  return range;
})



todoMenu.register(addTodoMenu);
todoMenu.register(deleteTodoMenu);



