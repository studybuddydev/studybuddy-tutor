import { MyContext } from './types';
import { NextFunction } from 'grammy';
import * as schedule from 'node-schedule';
import { getDailyEvents } from './calendarhelp';
import logger from 'euberlog';

export let dailyJobs: Record<number, schedule.Job> = {};
export let previewJobs: Record<number, schedule.Job[]> = {};
export let reviewJobs: Record<number, schedule.Job[]> = {};

export const jobIdToJob: Record<string, schedule.Job> = {};


export async function dailyEvents(ctx: MyContext, next: NextFunction,): Promise<void> {
    try {
        if (!ctx.chat) return;

        logger.info('saving  daily events')

        // Schedule a job to send daily events at a specific time (e.g., 9 AM)
        if (ctx.session.daily) {                                                                        // if the user wants to receive daily events
        // the job
        const job = schedule.scheduleJob('0 9 * * *', async () => {
            if (!ctx.session.calendar) return;
            const dailyEvents = getDailyEvents(ctx.session.calendar);
            // Assuming ctx.chat.id is the user's chat ID
            await ctx.reply(dailyEvents);
        });

        dailyJobs[ctx.chat.id] = job;                                                               // store the job in the dailyJobs object

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
                const eventStart = new Date(event.start);
                const jobId = `${event.summary}-${eventStart.getTime()}`; // Unique identifier for the job

                if (!jobIdToJob[jobId]) {

                    const previewjob = createPreviewJob(eventStart, event.summary, ctx);
                    previewJobs[ctx.chat.id] = [...(previewJobs[ctx.chat.id] || []), previewjob];
                    jobIdToJob[jobId] = previewjob;
                }else{
                    logger.debug('job preview already scheduled')
                }
                
            }


        }else{
            logger.debug('cleaning preview jobs')
            previewJobs[ctx.chat.id]?.forEach(job => job?.cancel());
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
                const eventEnd = new Date(event.end);
                const jobId = `${event.summary}-${eventEnd.getTime()}`; // Unique identifier for the job

                if (!jobIdToJob[jobId]) {
                        
                    const reviewjob = createReviewJob(eventEnd, event.summary, ctx);
                    reviewJobs[ctx.chat.id] = [...(reviewJobs[ctx.chat.id] || []), reviewjob];
                    jobIdToJob[jobId] = reviewjob;
                }
                
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







function createPreviewJob(date: Date, event: string, ctx: MyContext) {
    logger.debug('schedulo un preview evento', date)

    date.setMinutes(date.getMinutes() - 30);
    const job = schedule.scheduleJob(date, async () => {
        await ctx.reply(`Your event "${event}" is starting in 30 minutes.`);
    });
    return job;
}

function createReviewJob(date: Date, event: string, ctx: MyContext) {
    logger.debug('schedulo  review un evento', date)
    date.setMinutes(date.getMinutes() +10 );
    const job = schedule.scheduleJob(date, async () => {
        await ctx.conversation.enter('review');
    });
    return job;
}

