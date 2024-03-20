import { MyContext } from './types';
import { NextFunction } from 'grammy';
import * as schedule from 'node-schedule';
import { getDailyEvents } from './calendarhelp';
import logger from 'euberlog';

export let dailyJobs: Record<number, schedule.Job> = {};
export let previewJobs: Record<number, schedule.Job[]> = {};
export let reviewJobs: Record<number, schedule.Job[]> = {};

export const userjobsid: Record<string, string[]> = {};

const formatter = new Intl.DateTimeFormat('it-IT', {
    day: 'numeric', // Day of the month (e.g., "20")
    weekday: 'short', // Short weekday name (e.g., "gio")
    month: 'short', // Short month name (e.g., "mar")
    hour: '2-digit', // Hour in 2-digit format (e.g., "12")
    minute: '2-digit', // Minute in 2-digit format (e.g., "30")
    hour12: false, // Use 24-hour format
});




export async function dailyEvents(ctx: MyContext, next: NextFunction,): Promise<void> {
    try {
        if (!ctx.chat) return;

        logger.info('saving  daily events')

        // Schedule a job to send daily events at a specific time (e.g., 9 AM)
        if (ctx.session.daily) {                                                                        // if the user wants to receive daily events
        // the job

        const jobid = `daily: alle 9`;  
                                                                // Unique identifier for the job
        const job = schedule.scheduleJob('0 9 * * *', async () => {
            if (!ctx.session.calendar) return;
            const dailyEvents = getDailyEvents(ctx.session.calendar);
            // Assuming ctx.chat.id is the user's chat ID
            await ctx.reply(dailyEvents);
        });

        dailyJobs[ctx.chat.id] = job;                                                               // store the job in the dailyJobs object
        userjobsid[ctx.chat.id] = [...(userjobsid[ctx.chat.id] || []), jobid];                     // store the job id in the userjobsid object

        }
        else {
            // Cancel the job if the user doesn't want to receive daily events
            const job = dailyJobs[ctx.chat.id];
            if (job) {
                job.cancel();
                delete dailyJobs[ctx.chat.id];
            }
        }

    } catch (error) {
        logger.error('Error in dailyEvents middleware:', error);
        await ctx.reply('An error occurred while scheduling your daily events.');
    } finally {
        await next();
    }   
}


export async function previewEvents(ctx: MyContext, next: NextFunction,): Promise<void> {
    try {
        if (!ctx.chat) return;


        // schedule a job 30 min before all the events in the calendar
        if (ctx.session.preview) {
        
            let events = ctx.session.calendar?.events;                                     // get the events from the calendar    
            events = events?.filter(event => new Date(event.start) > new Date());       // filter out the events that are already passed
            if (!events) return;

            for (const event of events) {
                createPreviewJob(new Date(event.start), event.summary, ctx);
            }

        }else{
            logger.debug('cleaning preview jobs')
            previewJobs[ctx.chat.id]?.forEach(job => job?.cancel());
            userjobsid[ctx.chat.id] = [];
            
            delete previewJobs[ctx.chat.id];
        }

    
    }
    catch (error) {
        logger.error('Error in preview Events middleware:', error);
        await ctx.reply('An error occurred while scheduling your preview events.');
    } finally {
        await next();
    }
}



export async function reviewEvents(ctx: MyContext, next: NextFunction,): Promise<void> {
    try {
        if (!ctx.chat) return;

        // schedule a job 10 min after all the events in the calendar
        if (ctx.session.review) {
        
            let events = ctx.session.calendar?.events;                                     // get the events from the calendar    
            events = events?.filter(event => new Date(event.start) > new Date());
            if (!events) return;

            for (const event of events) {
                createReviewJob(new Date(event.end), event.summary, ctx);
            }

        }else {
            logger.info('cleaning review jobs')
            reviewJobs[ctx.chat.id]?.forEach(job => job?.cancel());
            delete reviewJobs[ctx.chat.id];
        }
    }
    catch (error) {
        logger.error('Error in review Events middleware:', error);
        await ctx.reply('An error occurred while scheduling your review events.');
    } finally {
        await next();
    }
}







export function createPreviewJob(date: Date, event: string, ctx: MyContext) {
    logger.debug('schedulo un preview evento', date)

    if (!ctx.chat) return;

    date.setMinutes(date.getMinutes() - 15); // 30 minutes before the event

    let id: number = 0



    const jobid = `id-${formatter.format(date.getTime())} - ${event.substring(0,5)}-preview`; // Unique identifier for the job

    if (!userjobsid[ctx.chat.id]?.includes(jobid)) {
        const job = schedule.scheduleJob(date, async () => {
            await ctx.reply(`Your event "${event}" is starting in 30 minutes.`);
        });

        previewJobs[ctx.chat.id] = [...(previewJobs[ctx.chat.id] || []), job];
        userjobsid[ctx.chat.id] = [...(userjobsid[ctx.chat.id] || []), jobid];
        id+=1;

    }

  
}

export function createReviewJob(date: Date, event: string, ctx: MyContext) {
    logger.debug('schedulo  review un evento', date)
    if (!ctx.chat) return;


    date.setMinutes(date.getMinutes() + 10 );

    const jobid = `${formatter.format(date.getTime())}- ${event.substring(0,5)}- review`; // Unique identifier for the job

    if (!userjobsid[ctx.chat.id]?.includes(jobid)) {
         const job = schedule.scheduleJob(date, async () => {
            await ctx.conversation.enter('review');
        });

        reviewJobs[ctx.chat.id] = [...(reviewJobs[ctx.chat.id] || []), job];
        userjobsid[ctx.chat.id] = [...(userjobsid[ctx.chat.id] || []), jobid];

    }


}

