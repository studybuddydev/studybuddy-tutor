import { Bot, session, GrammyError, HttpError, NextFunction, Keyboard, InlineKeyboard } from "grammy";
import 'dotenv/config'

import { conversations, createConversation, } from "@grammyjs/conversations";
import { settingsMenu, todoMenu } from "./utils/menu";
import { MyContext} from "./utils/types";
import { sessionMiddleware } from "./utils/session";
import { addcalendario, reviewLesson, setUpBot, setRole, addTodo } from './utils/conversations';

import { dailyEvents, previewEvents, reviewEvents,  } from './utils/notification';
import * as cmd from './utils/commands'
import * as chat from './utils/chat'
import logger from 'euberlog';









const {BOT_TOKEN } = process.env;



async function main(){
  // ============================== AI  ==============================
  logger.debug('loading bot')

  //============================ BOT =======================================
  const bot = new Bot<MyContext>(BOT_TOKEN as string);

  //----------------------middlewares ------------------------------

  //session
  logger.debug('loading session')
  bot.use(sessionMiddleware);

  //conversations
  logger.debug('loading conversations')
  bot.use(conversations());
  bot.use(createConversation(addcalendario));
  bot.use(createConversation(reviewLesson));
  bot.use(createConversation(setUpBot));
  bot.use(createConversation(setRole));
  bot.use(createConversation(addTodo));

  //menus
  logger.debug('loading menus')
  bot.use(settingsMenu);
  bot.use(todoMenu);

  //notification handlers
  logger.debug('loading notification handlers')
  bot.use(dailyEvents);
  bot.use(previewEvents);
  bot.use(reviewEvents);


  //commands 
  logger.debug('loading commands')
  bot.command('start', cmd.startCommand);
  bot.command('daily', cmd.getDailyCommand);
  bot.command("nextevents", cmd.nextEventsCommand);
  bot.command("logjobs", cmd.logJobsCommand);
  bot.command("addcalendar", cmd.addCalendarCommand);
  bot.command("review", cmd.reviewLessonCommand);
  bot.command('refresh', cmd.refreshCalendarCommand);
  bot.command('buddha', cmd.buddhaCommand);
  bot.command('image', cmd.imageCommand);
  bot.command('help', cmd.helpCommand);
  bot.command('settings', cmd.settingsCommand);
  bot.command('admin', cmd.adminCommand);


  //chat 
  logger.debug('loading chat handlers')
  bot.on('message', chat.handleMessage);
  bot.on(':document', chat.handleDocument);


  //await bot.api.setMyCommands(cmd.myCommands);

  bot.start();
  logger.info('bot started')

  bot.catch((err) => {
    const ctx = err.ctx;
    logger.error(`Error while handling update ${ctx.update.update_id}:`);
    const e = err.error;
    if (e instanceof GrammyError) {
      logger.error("Error in request:", e.description);
    } else if (e instanceof HttpError) {
      logger.error("Could not contact Telegram:", e);
    } else {
      logger.error("Unknown error:", e);
    }
  });

}



main()



// const bot = new Bot<MyContext>(BOT_TOKEN as string);

//   //----------------------middlewares ------------------------------

//   //session
// logger.debug('loading session')
// bot.use(sessionMiddleware);

// //conversations
// logger.debug('loading conversations')
// bot.use(conversations());
// bot.use(createConversation(addcalendario));
// bot.use(createConversation(reviewLesson));
// bot.use(createConversation(setUpBot));
// bot.use(createConversation(setRole));
// bot.use(createConversation(addTodo));

// //menus
// logger.debug('loading menus')
// bot.use(settingsMenu);
// bot.use(todoMenu);

// //notification handlers
// logger.debug('loading notification handlers')
// bot.use(dailyEvents);
// bot.use(previewEvents);
// bot.use(reviewEvents);


// //commands 
// logger.debug('loading commands')
// bot.command('start', cmd.startCommand);
// bot.command('daily', cmd.getDailyCommand);
// bot.command("nextevents", cmd.nextEventsCommand);
// bot.command("logjobs", cmd.logJobsCommand);
// bot.command("addcalendar", cmd.addCalendarCommand);
// bot.command("review", cmd.reviewLessonCommand);
// bot.command('refresh', cmd.refreshCalendarCommand);
// bot.command('buddha', cmd.buddhaCommand);
// bot.command('image', cmd.imageCommand);
// bot.command('help', cmd.helpCommand);
// bot.command('settings', cmd.settingsCommand);
// bot.command('admin', cmd.adminCommand);


// //chat 
// logger.debug('loading chat handlers')
// bot.on('message', chat.handleMessage);
// bot.on(':document', chat.handleDocument);


// //await bot.api.setMyCommands(cmd.myCommands);

// bot.start().then(() => {
//   logger.info('bot started');
// }).catch((err) => {
//   logger.error('Failed to start the bot:', err);
// });


// bot.catch((err) => {
//   const ctx = err.ctx;
//   logger.error(`Error while handling update ${ctx.update.update_id}:`);
//   const e = err.error;
//   if (e instanceof GrammyError) {
//     logger.error("Error in request:", e.description);
//   } else if (e instanceof HttpError) {
//     logger.error("Could not contact Telegram:", e);
//   } else {
//     logger.error("Unknown error:", e);
//   }
// });






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


