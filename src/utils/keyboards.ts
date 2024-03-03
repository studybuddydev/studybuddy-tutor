import { InlineKeyboard } from 'grammy';
import { MyContext } from './types';


// Helper function to update the keyboard based on the current session state
export function settingsKeyboard(ctx: MyContext): InlineKeyboard {
    const keyboard = new InlineKeyboard()
       .text(ctx.session.preview ? '✅ Preview' : '❌ Preview', 'preview')
       .text(ctx.session.daily ? '✅ daily' : '❌ daily', 'daily')
       .text(ctx.session.review ? '✅ Review' : '❌ Review', 'review');
   
    return keyboard;
   }
  