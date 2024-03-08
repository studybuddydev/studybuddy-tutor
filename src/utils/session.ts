import { Calendar } from './types';

export interface SessionData {
    preview: boolean;
    review: boolean;
    daily: boolean;
    calendarUrl: string;
    calendar? : Calendar;
}

function defaultSession(): SessionData {
    return { preview: true, review: true, daily: true, calendarUrl: '' };
  }

export const initialSession : () => SessionData = defaultSession;

// export function initSession(): SessionData {
//     return { preview: true, review: true, daily: true, calendarUrl: '' };
//   }