import { Menu } from "@grammyjs/menu";
import { MyContext } from './types';


// settingsmenu used to handle notification of the bot

export const dsettingsMenu = new Menu<MyContext>("settings")
  .text(
    (ctx: MyContext) => ctx.from && ctx.session.preview  ? "🔔 preview" : "🔕 preview",
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
    },
  ).row()
  .text(
    (ctx: MyContext) => ctx.from && ctx.session.calendarUrl ? "aggiorna calendario" : "aggiungi calendario",
    async (ctx) => {
        await ctx.conversation.enter("addcalendario");
        //ctx.menu.update(); // update the menu!
    })
  .text(
    (ctx: MyContext) => ctx.from && ctx.session.calendarUrl ? "✅ chat" : "❌ chat",
    async (ctx) => {
        await ctx.reply('non hai ancora aggiunto un calendario, /addcalendar')
    })


    export const settingsMenu = new Menu<MyContext>("root-menu")
    .submenu("📆 Calendario 📆", "calendar-menu")
    .submenu("🔔 Notifiche 🔕", "credits-menu");
  
    const notificationSettings = new Menu<MyContext>("credits-menu")
    .text(
      (ctx: MyContext) => ctx.from && ctx.session.preview  ? "🔔 preview" : "🔕 preview",
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


    const calendarMenu = new Menu<MyContext>("calendar-menu")
    .text(
      (ctx: MyContext) => ctx.from && ctx.session.calendarUrl ? "aggiorna calendario" : "aggiungi calendario",
      async (ctx) => {
          await ctx.conversation.enter("addcalendario");
          
      })
    .text(
      (ctx: MyContext) => ctx.from && ctx.session.calendarUrl ? "aggiorna calendario" : "aggiungi calendario",
      async (ctx) => {
          await ctx.conversation.enter("addcalendario");
          
      })
    .back("Go Back");

    settingsMenu.register(notificationSettings);
    settingsMenu.register(calendarMenu);
