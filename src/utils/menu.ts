import { Menu } from "@grammyjs/menu";
import { MyContext } from './types';


// settingsmenu used to handle notification of the bot



export const settingsMenu = new Menu<MyContext>("root-menu")
  .submenu("📆 Calendario 📆", "calendar-menu")
  .submenu("🔔 Notifiche 🔕", "notification-menu").row()
  .text(
    (ctx: MyContext) => ctx.from && ctx.session.isTester  ?  "💬 chat ✅": "💬 chat ❌" ,
    async (ctx) => {
      await ctx.reply('per utilizzare la chat devi essere un tester certificato, contattaci')

    })
  .text(
    (ctx: MyContext) => ctx.from && ctx.session.isTester  ?  "📁 files ✅": "📁 files ❌",
    async (ctx) => {
      await ctx.reply('entra nella waiting list per poter caricare i file')

    })



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
