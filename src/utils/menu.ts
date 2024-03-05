import { Menu } from "@grammyjs/menu";import { MyContext } from './types';

export const settingsMenu = new Menu<MyContext>("toggle")
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
  )