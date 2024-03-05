import { InlineKeyboard } from 'grammy';
import { MyContext } from '../types';


// not used anymore, use menu instead
export function settingsKeyboard(ctx: MyContext): InlineKeyboard {
    const keyboard = new InlineKeyboard()
       .text(ctx.session.preview ? '✅ Preview' : '❌ Preview', 'preview')
       .text(ctx.session.daily ? '✅ daily' : '❌ daily', 'daily')
       .text(ctx.session.review ? '✅ Review' : '❌ Review', 'review');
   
    return keyboard;
   }
  