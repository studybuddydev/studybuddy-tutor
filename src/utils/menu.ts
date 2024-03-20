import { Menu , MenuRange } from "@grammyjs/menu";
import { MyContext } from './types';
import logger from 'euberlog';
import { get } from 'http';
import {getNextEvents } from './calendarhelp';
import { createPreviewJob, previewJobs, reviewJobs, userjobsid } from './notification';
import { getCatClient  } from './ai';


// settingsmenu used to handle notification of the bot



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


async function editMsgCalendar(ctx: MyContext) {

  if (!ctx.from) return
  const msg = ctx.session.calendar ? 'il calendario ' + ctx.session.calendar?.title + ' ha ' + ctx.session.calendar?.events.length + ' eventi' : 'non hai un calendario'

  try {
      await ctx.editMessageText(msg);
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
      // const nextPJobs = previewJobs[ctx.from?.id]
      // let msg = nextPJobs?.length ? 'hai ' + nextPJobs.length + ' eventi preview  in programma' : 'non hai preview in programma'

      // for (const job of nextPJobs?.slice(0,5) || []) {
      //   const date = new Date(job.nextInvocation())
      //   msg += '\n' + formatter.format(date)
      // }

      // const nextRJobs = reviewJobs[ctx.from?.id]
      // msg += '\n\n'
      // msg += nextRJobs?.length ? 'hai ' + nextRJobs.length + ' eventi review in programma' : 'non hai review in programma'

      // for (const job of nextRJobs?.slice(0,5) || []) {
      //   const date = new Date(job.nextInvocation())
      //   msg += '\n' + formatter.format(date)
      // }
      const jobs = userjobsid[ctx.from?.id]
      // sort jobs alphabetically
      jobs?.sort()

      let msg = 'hai ' + jobs?.length + ' eventi in programma'

      for (const job of jobs?.slice(0,10) || []) {
        
        msg += '\n' + job
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



