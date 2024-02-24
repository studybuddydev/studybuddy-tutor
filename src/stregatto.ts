import { CatClient } from 'ccat-api'
import dotenv from 'dotenv'
import { Bot } from "grammy";
dotenv.config()

const { URL, PORT, AUTH_KEY, CHAT_ACCESS } = process.env

const BOT_TOKEN = process.env.BOT_TOKEN

const bot = new Bot(BOT_TOKEN as string); // <-- put your bot token between the ""

const cat = new CatClient({
	baseUrl: URL as any,
	port: PORT ? parseInt(PORT) : undefined,
    authKey: AUTH_KEY,
})

bot.on('message', ctx => {
    const msg = ctx.message.text as string

    if (msg.startsWith('/')) return

    console.log('sending message to cat')



    cat.send(msg)
    cat.onMessage(res => ctx.reply(res.content))
})

bot.command("start", async (ctx) => {
    //console.log(cat)
    await ctx.reply("ciao benvenuto nel bot di studybuddy, aggiungti caldnario /addcalendario!");
  } );




bot.start();

console.log('bot started')