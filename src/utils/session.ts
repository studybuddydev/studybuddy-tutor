import { Calendar } from './types';

export interface SessionData {
    preview: boolean;
    review: boolean;
    daily: boolean;
    isTester: boolean;
    isAdmin: boolean;
    calendar? : Calendar;

}

function defaultSession(): SessionData {
    return { preview: true, review: true, daily: true, isTester: false, isAdmin: false};
  }

export const initialSession : () => SessionData = defaultSession;

// export function initSession(): SessionData {
//     return { preview: true, review: true, daily: true, calendarUrl: '' };
//   }