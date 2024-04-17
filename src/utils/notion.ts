import { Client } from '@notionhq/client'
import * as dotenv from 'dotenv';

dotenv.config();


const notion = new Client({ auth: process.env.NOTION_TOKEN });
const db_id = process.env.DB_ID ?? '';
const tododev_id = process.env.TODODEV_ID ?? '';


export async function getFeedBacks() {
    const response = await notion.databases.query({
        database_id: db_id,
    });

    let feedbacks: { title: string, type: string }[] = [];

    
    for (const page of response.results as any) {
        feedbacks.push({
           title: page['properties']['text']['title'][0]['plain_text'],
           type: page['properties']['type']['select']['name']
        })
        console.log( page)
        
    }
    return feedbacks
}

export async function addFeedback(feedback: { title: string, type: string }) {

    await notion.pages.create({
        parent: { database_id: db_id },
        properties: {
            text: {
                title: [
                    {
                        type: "text",
                        text: {
                            content: feedback.title,
                        },
                    },
                ],
            },
            type: {
                select: {
                    name: feedback.type,
                },
            },
        },
    });
}