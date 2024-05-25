import { Context, InlineKeyboard, SessionFlavor } from "grammy";
import {
    type Conversation,
    type ConversationFlavor,
    conversations,
    createConversation,
  } from "@grammyjs/conversations";
import { SessionData } from './session';

import { bold, fmt, hydrateReply, italic, link } from "@grammyjs/parse-mode";
import type { ParseModeFlavor } from "@grammyjs/parse-mode";

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
    title?: string;
    events: Event[];
}

export interface CourseInfo {
    name: string;
    chapters: string[];
    books: string;
    examDetails: string;
    learningGoals: string;
    methods: string;
}


export type MyContext = Context & ConversationFlavor & SessionFlavor<SessionData> //& ParseModeFlavor;
export type MyConversation = Conversation<MyContext>;