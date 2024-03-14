import { Menu } from "@grammyjs/menu";
import { MyContext } from './types';
import logger from 'euberlog';

// settingsmenu used to handle notification of the bot



export const settingsMenu = new Menu<MyContext>("root-menu")
  .submenu( (ctx: MyContext) => ctx.from && ctx.session.calendar  ?  "📆 Calendario ✅": "📆 Calendario  ❌" , "calendar-menu")
  .submenu("🔔 Notifiche 🔕", "notification-menu").row()
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


  
const calendarMenu = new Menu<MyContext>("calendar-menu")
  .text(
    (ctx: MyContext) => ctx.from && ctx.session.calendar ? "aggiorna calendario" : "aggiungi calendario",
    async (ctx) => {
      await ctx.conversation.enter("addcalendario");

    })
  .text(
    (ctx: MyContext) => ctx.from && ctx.session.calendar?.title ? ctx.session.calendar?.title : "aggiungi calendario",
    async (ctx) => {
      await ctx.reply('il calendario ' + ctx.session.calendar?.title + ' ha ' + ctx.session.calendar?.events.length + ' eventi ')

    }).row()
  .back("Go Back");

const notificationSettings = new Menu<MyContext>("notification-menu")
  .text(
    (ctx: MyContext) => ctx.from && ctx.session.preview ? "🔔 preview" : "🔕 preview",
    (ctx) => {
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
  .text(
    (ctx: MyContext) => ctx.from && ctx.session.daily ? "🔔 daily" : "🔕 daily",
    (ctx) => {
      ctx.session.daily = !ctx.session.daily;
      ctx.menu.update(); // update the menu!
    }).row()
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
