import { Menu } from "@grammyjs/menu";
import { MyContext } from './types';


// settingsmenu used to handle notification of the bot

export const settingsMenu = new Menu<MyContext>("settings")
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
    (ctx) => {
        ctx.conversation.enter("addcalendario");
        ctx.menu.update(); // update the menu!
    })