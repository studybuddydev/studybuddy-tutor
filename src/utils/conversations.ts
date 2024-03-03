import {
    type Conversation,
    type ConversationFlavor,
    conversations,
    createConversation,
} from "@grammyjs/conversations";
import { Bot, Context, session, Keyboard, GrammyError, HttpError, InlineKeyboard, SessionFlavor } from "grammy";
import { getEvents } from "./calendarhelp";
import { MyContext, MyConversation, ReviewLesson } from "./types";
import { settingsKeyboard } from "./keyboards";

export async function addcalendario(conversation: MyConversation, ctx: MyContext) {
    await ctx.reply("mandami l'url del calendario");
    const url = await conversation.form.url();

    getEvents(url.href)


}


export async function reviewLesson(conversation: MyConversation, ctx: MyContext) {
    const keyboard = new Keyboard().text("Si").text("No").resized().oneTime(true);
    await ctx.reply("ciao è finita la lezione di franco, sei andato?", { reply_markup: keyboard, });

    const attendance = await conversation.form.text();
    let review: ReviewLesson = { attendance: false, title: '' };

    if (attendance === 'Si') {
        await ctx.reply('bene, ora dimmi il titolo della lezione')
        const title = await conversation.form.text();
        await ctx.reply('ora dimmi una descrizione della lezione')
        const description = await conversation.form.text();

        review = {
            attendance: true,
            title: title,
            description: description
        }
    }
    else {
        await ctx.reply(`ok, mi dispiace, spero che tu stia bene recuperala al piu presto `)
        review = {
            attendance: false,
            title: '',
            description: ''
        }
    }

    console.log(review)


}

export async function setUpBot(conversation: MyConversation, ctx: MyContext) {



    await ctx.reply(`*Ciao, benvenuto nel bot di StudyBuddy\\!* Il tuo tutor che ti aiuterà a studiare e a stare al passo con le lezioni\\. Il bot offre le seguenti funzionalità\\: \n
    ❓ *Chat* Risponderà a tutte le tue domande\\. \n
    📆 *Calendario* Aggiungi il calendario delle lezioni, e potrai ricevere ogni mattina un resoconto della giornata \\(daily\\)\\. \n
    👀 *Preview:* Ti ricorda 30 minuti prima della lezione di dare un'occhiata al materiale\\.    \n
    ✅ *Review:* Ti chiederà se sei andato a lezione facendoti inserire titolo e descrizione, verrà poi salvato tutto nel tuo StudyBuddy\\. \n
    🌄 *Generare Immagini:* Ti genererà un'immagine a partire da un prompt\\. \n
    📂 *Caricare documenti:* Il tutor può leggere i tuoi documenti e imparare, potrà quindi rispondere alle tue domande, oppure generare domande a partire da un documento\\. \n 
        puoi settare qui sotto le tue preferenze oppure piu tardi con /settings`, { parse_mode: 'MarkdownV2', reply_markup: settingsKeyboard(ctx) });



}