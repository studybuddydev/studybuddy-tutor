import { Calendar, MyContext } from './types'
import { getDailyEvents, getNextEvents, refreshCalendar } from './calendarhelp'
import { dailyJobs, previewJobs, reviewJobs } from './notification'
import logging from 'euberlog'
import axios from 'axios';
import { settingsMenu, todoMenu } from './bin/menu';
import { openai } from './ai';
import logger from 'euberlog';
import * as schedule from 'node-schedule';
import fs from 'fs';



export const myCommands = [
    { command: "start", description: "Start the bot" },
    { command: "help", description: "debug stuff" },
    { command: "settings", description: "settings" },
    { command: "review", description: "review lesson" },
    { command: "addcalendar", description: "add un calendar" },
    { command: "nextevents", description: "get next 3 events from calendar" },
    { command: "image", description: "generate image from prompt" },
    { command: "daily", description: "get daily events from the clandar" },
  ]


//start command
export async function startCommand(ctx: MyContext) {
    logging.debug(ctx.from + '')
    const welcomeText = fs.readFileSync('./src/messages/welcome.md', 'utf8');
    await ctx.reply(welcomeText, { reply_markup: settingsMenu, parse_mode: 'MarkdownV2'});
}


// help command
export async function helpCommand(ctx: MyContext) {
logging.debug(ctx.from + '')

  ctx.reply('help')
}

export async function getDailyCommand(ctx: MyContext) {
    if (!ctx.session.calendar) {
        ctx.reply('non hai ancora aggiunto un calendario, /addcalendar')
        return
    }

    const dailyEvents = getDailyEvents(ctx.session.calendar)

    ctx.reply(dailyEvents)
}


// Function to handle the "jobs" command
export async function logJobsCommand(ctx: MyContext) {
    if (!ctx.from) return;
    const jobs = schedule.scheduledJobs;
    const jobList = Object.keys(jobs).map((job) => jobs[job].nextInvocation());

    logger.debug('jobs', jobList);
  
    ctx.reply('jobbo')
}


export async function nextEventsCommand(ctx: MyContext) {

    const calendar: Calendar | undefined = ctx.session.calendar

    if (!calendar) {
        ctx.reply('non hai ancora aggiunto un calendario, /addcalendar')
        return

    }

    const nextEvents = getNextEvents(calendar)

    ctx.reply(nextEvents)


}

//add calendar
export async function addCalendarCommand(ctx: MyContext) {
    logging.debug('entro nella conversazione addcalendario', ctx.update.update_id)
    ctx.conversation.enter("addcalendario");
}

//review lesson
export async function reviewLessonCommand(ctx: MyContext) {
    await ctx.conversation.enter("reviewLesson");
}


//refresh
export async function refreshCalendarCommand(ctx: MyContext) {
    await refreshCalendar(ctx)
    ctx.reply('calendario aggiornato')

}

//buddha sentence 
export async function buddhaCommand(ctx: MyContext) {
    const url = 'https://buddha-api.com/api/random'
    const response = await axios.get(url)
    const text = response.data.text
    const author = response.data.byName
    ctx.reply(`${text}\n\n~${author}`)
}


//image generation 
export async function imageCommand(ctx: MyContext) {
    const user_prompt = ctx.match ;

    if (user_prompt && ctx.session.isAdmin) {
        ctx.reply('spending 4 cent to generate this image, please wait...')

        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: user_prompt.toString(), // Convert user_prompt to string
            n: 1,
            size: "1024x1024",
        });
        let image_url = response as any;

        ctx.reply(image_url.data[0].url);
    } else {
        ctx.reply('please insert a prompt after /image, or you may not have the rights to do so')
    }
}

//settings
export async function settingsCommand(ctx: MyContext) {
    ctx.reply('SETTINGS', { reply_markup: settingsMenu });
}

//admin
export async function adminCommand(ctx: MyContext) {
    await ctx.reply('admin: ' + ctx.session.isAdmin + '\ntester: ' + ctx.session.isTester)

    if (!ctx.session.isTester) {
      await ctx.conversation.enter("setRole");
    }
}


//todo
export async function todoCommand(ctx: MyContext) {

    if(ctx.message?.text != '/todo' && ctx.message?.text != undefined) {
        // remove the command from the message
        ctx.message.text = ctx.message.text.replace('/todo', '').trim()
        ctx.session.todo?.push(ctx.message?.text || '');
    }

    let msg = 'hai ' + ctx.session.todo?.length + ' cose da fare: \n'
    ctx.session.todo?.forEach((todo, index) => {
        msg += `\n${index + 1}. ${todo}`;
    });
    ctx.reply(msg, { reply_markup: todoMenu });
}