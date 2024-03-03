import { Context, InlineKeyboard, SessionFlavor } from "grammy";
import {
    type Conversation,
    type ConversationFlavor,
    conversations,
    createConversation,
  } from "@grammyjs/conversations";


export interface SessionData {
    preview: boolean;
    review: boolean;
    daily: boolean;
    calendar: string | URL;
}
export interface ReviewLesson {
    attendance: boolean;
    title: string;
    description?: string;
}


export type MyContext = Context & ConversationFlavor & SessionFlavor<SessionData>;
export type MyConversation = Conversation<MyContext>;