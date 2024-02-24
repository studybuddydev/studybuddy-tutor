import { Bot } from "grammy";
import 'dotenv/config'
import getIcsUri from './calendar';
import ical from 'node-ical';
import { get } from 'http';

import OpenAI from "openai";
// Load the environment variables from the .env file.
const openai = new OpenAI();
const BOT_TOKEN = process.env.BOT_TOKEN
import { CatClient } from 'ccat-api'


const { URL, PORT, AUTH_KEY, CHAT_ACCESS } = process.env

console.log(URL, PORT, AUTH_KEY, CHAT_ACCESS)

const cat = new CatClient({
	baseUrl: URL as any,
  user: 'user',
	port: PORT ? parseInt(PORT) : undefined,
    authKey: AUTH_KEY,
})




const url = 'https://easyacademy.unitn.it/AgendaStudentiUnitn/index.php?view=easycourse&include=corso&txtcurr=1+-+Computational+and+theoretical+modelling+of+language+and+cognition&anno=2023&corso=0708H&anno2%5B%5D=P0407%7C1&date=14-09-2023&_lang=en&highlighted_date=0&_lang=en&all_events=1&'

async function getEvents() {
    const uri:string = getIcsUri(url) as any

    const events = await ical.async.fromURL(uri)
    console.log(events)
    return events
}
async function main() {   

    getEvents()
}

async function greeting(conversation: any, ctx: any) {
    await ctx.reply("Hi there! What is your name?");
    const { message } = await conversation.wait();
    await ctx.reply(`Welcome to the chat, ${message.text}!`);
  }

// Create an instance of the `Bot` class and pass your bot token to it.
const bot = new Bot(BOT_TOKEN as string); // <-- put your bot token between the ""

async function addcalendario(ctx: any) {
    ctx.conversation.log('addcalendario')
    getEvents()
}



// Handle the /start command.
bot.command("start", async (ctx) => {
    await ctx.reply("ciao benvenuto nel bot di studybuddy, aggiungti caldnario /addcalendario!");
  });
bot.command("addcalendar", addcalendario)

bot.command("add", async (ctx) => {
    // `item` will be "apple pie" if a user sends "/add apple pie".
    const item = ctx.match;

    await ctx.reply(`You want to add "${item}" to your shopping list.`);
  });


bot.command("image", async (ctx) => {
    // `item` will be "apple pie" if a user sends "/add apple pie".
    const user_prompt = ctx.match;

    if (user_prompt) {
      ctx.reply('spending 4 cent to generate this image, please wait...')

        const response = await openai.images.generate({
            model: "dall-e-2",
            prompt: user_prompt,
            n: 1,
            size: "1024x1024",
          });
          let image_url = response as any;
      
          ctx.reply(image_url.data[0].url);
    }else {
        ctx.reply('please insert a prompt after /image')
    }


   


  });
  bot.command("help", async (ctx) => {
    console.log(cat) 
  
  });
  
  
// Handle other messages.
bot.on('message', ctx => {
  const msg = ctx.message.text as string

  if (msg.startsWith('/')) return

  console.log('sending message to cat')



  cat.send(msg)
  cat.onMessage(res => ctx.reply(res.content))
})



bot.start();