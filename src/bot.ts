
import { Bot, GrammyError, HttpError } from "grammy";
import { conversations, createConversation, } from "@grammyjs/conversations";
import logger from 'euberlog';
import 'dotenv/config'

import { rootMenu } from "./Menu/startMenu";
import { todoMenu } from "./Menu/todoMenu";
import { MyContext } from "./utils/types";
import { sessionMiddleware } from "./utils/session";
import { dailyEvents, previewEvents, reviewEvents,  } from './utils/notification';
import * as cmd from './utils/commands'
import * as chat from './utils/chat'
import * as cnv from './utils/conversations';



const {BOT_TOKEN } = process.env;



async function main(){
  logger.debug('creating bot')

  //============================ BOT =======================================
  const bot = new Bot<MyContext>(BOT_TOKEN as string);


  //----------------------middlewares ------------------------------

  //session
  logger.debug('loading session')
  bot.use(sessionMiddleware);

  //conversations
  logger.debug('loading conversations')
  bot.use(conversations());
  bot.use(createConversation(cnv.addcalendario));
  bot.use(createConversation(cnv.reviewLesson));
  bot.use(createConversation(cnv.setUpBot));
  bot.use(createConversation(cnv.setRole));
  bot.use(createConversation(cnv.addTodo));

  //menus
  logger.debug('loading menus')
  bot.use(rootMenu);
  bot.use(todoMenu);

  //notification handlers
  logger.debug('loading notification handlers')
  bot.use(dailyEvents);
  bot.use(previewEvents);
  bot.use(reviewEvents);


  //commands 
  logger.debug('loading commands')
  bot.command('start', cmd.startCommand);
  bot.command('calendar', cmd.calendarCommand);
  bot.command('notification', cmd.notificationCommand);
  bot.command('chat', cmd.chatCommand);
  bot.command('todo', cmd.todoCommand);

  bot.command('refresh', cmd.refreshCalendarCommand);
  bot.command('daily', cmd.getDailyCommand);
  bot.command("nextevents", cmd.nextEventsCommand);
  bot.command("addcalendar", cmd.addCalendarCommand);
  bot.command("jobs", cmd.logJobsCommand);
  bot.command("review", cmd.reviewLessonCommand);
  bot.command('buddha', cmd.buddhaCommand);
  bot.command('image', cmd.imageCommand);
  bot.command('help', cmd.helpCommand);
  bot.command('settings', cmd.settingsCommand);
  bot.command('admin', cmd.adminCommand);
  //bot.command('pomo', cmd.pomoCommand);


  //chat 
  logger.debug('loading chat handlers')
  bot.on(':photo', chat.handlePhoto); // if you put this after message it will not be evaluated
  bot.on(':voice', chat.handleVoice); 
  bot.on(':document', chat.handleDocument);
  bot.on('message', chat.handleMessage);


  await bot.api.setMyCommands(cmd.myCommands);

  bot.start({ drop_pending_updates: true });
  logger.info('bot started')

  bot.catch((err) => {
    const ctx = err.ctx;
    logger.error(`Error while handling update ${ctx.update.update_id}:`);
    const e = err.error;
    if (e instanceof GrammyError) {
      logger.error("Error in request:", e);
    } else if (e instanceof HttpError) {
      logger.error("Could not contact Telegram:", e);
    } else {
      logger.error("Unknown error:", e);
    }
  });

}



main()









// bot.command("todo", async (ctx) => {


//   const keyboard = new InlineKeyboard()
//   .text("lista todo", 'list-todo').row()

//   const todoKeyboard = new InlineKeyboard().text("aggiungi", "click-payload");

//   ctx.conversation.enter("addTodo");

 

//   ctx.reply( "inviami il titolod della todo ",{ reply_markup: keyboard });

// });

// bot.callbackQuery("list-todo", async (ctx) => {

  
//   await ctx.answerCallbackQuery({
//     text: "scrivi il todo",
//   });

//   const todo: string[] = ctx.session.todo
 
//   ctx.reply('lista')




  
// });










