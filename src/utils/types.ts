import { Context, InlineKeyboard, SessionFlavor } from "grammy";
import {
    type Conversation,
    type ConversationFlavor,
    conversations,
    createConversation,
  } from "@grammyjs/conversations";
import { SessionData } from './session';

export interface ReviewLesson {
    attendance: boolean;
    title: string;
    description?: string;
}

export interface Event {
    id?: string;
    room?: string;
    department: string;
    start: Date;
    end: Date;
    summary: string;
}

export interface Calendar {
    url: string;
    events: Event[];
}



export type MyContext = Context & ConversationFlavor & SessionFlavor<SessionData>;
export type MyConversation = Conversation<MyContext>;