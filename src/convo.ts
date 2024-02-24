import { Bot, Context, session } from "grammy";
import {
  type Conversation,
  type ConversationFlavor,
  conversations,
  createConversation,
} from "@grammyjs/conversations";

import dotenv from 'dotenv'
dotenv.config()

type MyContext = Context & ConversationFlavor;
type MyConversation = Conversation<MyContext>;

const bot = new Bot<MyContext>(process.env.BOT_TOKEN as string);

bot.use(session({ initial: () => ({}) }));
bot.use(conversations());

/** Defines the conversation */
async function movie(conversation: MyConversation, ctx: MyContext) {
    await ctx.reply("How many favorite movies do you have?");
    const count = await conversation.form.number();
    const movies: string[] = [];
    for (let i = 0; i < count; i++) {
        await ctx.reply(`Tell me number ${i + 1}!`);
        const titleCtx = await conversation.waitFor(":text");
        movies.push(titleCtx.msg.text);
    }
    await ctx.reply("Here is a better ranking!");
    movies.sort();
    await ctx.reply(movies.map((m, i) => `${i + 1}. ${m}`).join("\n"));
    }


bot.use(createConversation(movie));

bot.command("start", async (ctx) => {
  // enter the function "greeting" you declared
  await ctx.conversation.enter("movie");
});

bot.start();