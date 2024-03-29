import { session } from 'grammy';
import { Calendar } from './types';
import { FileAdapter } from '@grammyjs/storage-file';

export interface SessionData {
    username?: string;
    preview: boolean;
    previewChanged?: boolean;
    review: boolean;
    reviewChanged?: boolean;
    daily: boolean;
    dailyChanged?: boolean;
    isTester: boolean;
    isAdmin: boolean;
    wantsDocs: boolean;
    wantsChat: boolean;
    calendar? : Calendar;
    todo : string[];


}

function defaultSession(): SessionData {
    return { preview: true, review: true, daily: true, isTester: false, isAdmin: false, wantsDocs: false, wantsChat: false, todo: []};
  }

export const initialSession : () => SessionData = defaultSession;



export const sessionMiddleware = session({
 initial: () => initialSession(),
 storage: new FileAdapter<SessionData>({ dirName: "data/sessions", }),
});


// export function initSession(): SessionData {
//     return { preview: true, review: true, daily: true, calendarUrl: '' };
//   }