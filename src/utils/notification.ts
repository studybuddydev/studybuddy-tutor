import { MyContext } from './types';
import { NextFunction } from 'grammy';
import * as schedule from 'node-schedule';
import { getDailyEvents } from './calendarhelp';

export const dailyJobs: Record<number, schedule.Job> = {};


export async function dailyEvents(ctx: MyContext, next: NextFunction,): Promise<void> {
    try {
        if (!ctx.chat) return;

        console.log('saving events')

        // Schedule a job to send daily events at a specific time (e.g., 9 AM)
        if (ctx.session.daily) {
        const job = schedule.scheduleJob('1 * * * * *', async () => {
            if (!ctx.session.calendar) return;
            const dailyEvents = getDailyEvents(ctx.session.calendar);
            // Assuming ctx.chat.id is the user's chat ID
            await ctx.reply(dailyEvents);
        });
        dailyJobs[ctx.chat.id] = job;

        }
        else {
            const job = dailyJobs[ctx.chat.id];
            if (job) {
                job.cancel();
                delete dailyJobs[ctx.chat.id];
            }
        }


        // Store the job so you can cancel it later if needed
    } catch (error) {
        console.error('Error in dailyEvents middleware:', error);
        await ctx.reply('An error occurred while scheduling your daily events.');
    } finally {
        await next();
    }   
}