import { Menu, MenuRange } from "@grammyjs/menu";
import { MyContext } from './../utils/types';
import logger from 'euberlog';
// settingsmenu used to handle notification of the bot




export const feedbackMenu = new Menu<MyContext>("feedback-menu")
    .text(
        "bug",
        (ctx) => {

            ctx.reply('bene hai selezionato bug')
            //ctx.conversation.enter("reportBug")
        },
    )
    .text(
        "feature",
        (ctx) => {

            ctx.reply('bene hai selezionato feature')
        },
    )

