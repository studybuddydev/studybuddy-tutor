
import {  Keyboard } from "grammy";
import { getEvents } from "./calendarhelp";
import { MyContext, MyConversation, ReviewLesson, type Event, type Calendar } from "./types";
import { settingsMenu } from './bin/menu';
import fs from 'fs';
import 'dotenv/config'
import logger from 'euberlog';



export async function addcalendario(conversation: MyConversation, ctx: MyContext) {
    conversation.log('entro nella conversazione addcalendario', ctx.update.update_id)

    await ctx.reply("mandami l'url del calendario");
    try {
        conversation.log('url')
        let calendar : Calendar = { url: '', events: [] }

        const url = await conversation.form.url();


        await ctx.reply('Fetching events from the calendar...');

        calendar =  await getEvents(url.href);
        

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


    await ctx.reply('ok, grazie, lo salvo su StudyBuddy')


}

export async function setUpBot(conversation: MyConversation, ctx: MyContext) {

    const welcomeText = fs.readFileSync('./src/messages/welcome.md', 'utf8');
    await ctx.reply(welcomeText, { reply_markup: settingsMenu, parse_mode: 'MarkdownV2'});
}


export async function setRole(conversation: MyConversation, ctx: MyContext) {
    //conversation.log('setRole')
    await ctx.reply('inserisci la parla d\'ordine');
    const password = await conversation.form.text();

    if (password === process.env.PASSWORD_ADMIN) {
        conversation.session.isAdmin = true;
        conversation.session.isTester = true;
        await ctx.reply('ruolo aggiornato, sei admin adesso');
    } else if (password === process.env.PASSWORD_TESTER) {
        conversation.session.isTester = true;
        await ctx.reply('ruolo aggiornato, sei un tester');
    }else {
        await ctx.reply('la parola d\'ordine non è corretta');
    }

}


export async function addTodo (conversation: MyConversation, ctx: MyContext) {
    await ctx.reply('cosa devi fare?');
    const todo = await conversation.form.text();
    conversation.session.todo.push(todo);
    await ctx.reply('aggiunto alla lista');
}