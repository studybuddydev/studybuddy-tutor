
import {  Keyboard } from "grammy";
import { getEvents } from "./calendarhelp";
import { MyContext, MyConversation, ReviewLesson, type Event, type Calendar } from "./types";
import { settingsMenu } from './menu';

export async function addcalendario(conversation: MyConversation, ctx: MyContext) {
    console.log('entro nella conversazione addcalendario', ctx.update.update_id)

    await ctx.reply("mandami l'url del calendario");
    try {
        console.log('url')
        let calendar : Calendar = { url: '', events: [] }

        const url = await conversation.form.url();


        await ctx.reply('Fetching events from the calendar...');
        
        calendar.url = url.href;
        calendar.events = await getEvents(url.href);
        

        conversation.session.calendar = calendar;

       await ctx.reply('Aggiunti ' + calendar.events.length + ' eventi al calendario');
    } catch (error) {
        console.error('Error fetching calendar events:', error);
        await ctx.reply('Sorry, there was an error fetching the calendar events. Please try again later.');
    }

}

// after a lesson it asks you if you went
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
    await ctx.reply('ok, grazie, lo salvo su StudyBuddy')


}

export async function setUpBot(conversation: MyConversation, ctx: MyContext) {



    await ctx.reply(`*Ciao, benvenuto nel bot di StudyBuddy\\!* Il tuo tutor che ti aiuterà a studiare e a stare al passo con le lezioni\\. Il bot offre le seguenti funzionalità\\: \n
    ❓ *Chat* Risponderà a tutte le tue domande\\. \n
    📆 *Calendario* Aggiungi il calendario delle lezioni, e potrai ricevere ogni mattina un resoconto della giornata \\(daily\\)\\. \n
    👀 *Preview:* Ti ricorda 30 minuti prima della lezione di dare un'occhiata al materiale\\.    \n
    ✅ *Review:* Ti chiederà se sei andato a lezione facendoti inserire titolo e descrizione, verrà poi salvato tutto nel tuo StudyBuddy\\. \n
    🌄 *Generare Immagini:* Ti genererà un'immagine a partire da un prompt\\. \n
    📂 *Caricare documenti:* Il tutor può leggere i tuoi documenti e imparare, potrà quindi rispondere alle tue domande, oppure generare domande a partire da un documento\\. \n 
    puoi settare qui sotto le tue preferenze oppure piu tardi con /settings`, { parse_mode: 'MarkdownV2', reply_markup: settingsMenu });



}