
import { CatClient } from 'ccat-api'
import OpenAI from "openai";
import 'dotenv/config'
import logger from 'euberlog';

const { AUTH_KEY, URL, PORT } = process.env

export const openai = new OpenAI();


const clients = new Map<string, CatClient>()

// each user has a client
export function getCatClient(userId: string) {
  if (clients.has(userId)) {
    logger.debug('client already exists')
    
  } else {
    logger.debug('creating new client for ', userId)

    const client = new CatClient({
      baseUrl: URL as any,
      user: userId,
      port: PORT ? parseInt(PORT) : undefined,
      authKey: AUTH_KEY,
    })

    clients.set(userId, client)
    
  }
  return clients.get(userId)
}

export async function generateImage(user_prompt: string, size = '1024x1024') {

  const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: user_prompt, // Convert user_prompt to string
      n: 1,
      size: size as any,
  });
  let image_url = response as any;
  

  return image_url.data[0].url;

}

export async function postprocessTranscription(transcription:string){

  const systemPrompt = "You are a helpful StudyBuddy for university students. Your task is to correct any spelling discrepancies in the transcribed text.  add necessary punctuation such as periods, commas, and capitalization, and use only the context provided. user may talk in italian"
  const brainstormingPrompt = "write this but in rhymes"
  const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-0125",
      messages: [
          { role: "system", content: brainstormingPrompt },
          { role: "user", content: transcription },
      ],
  });

  logger.debug('transcription postprocessed', completion.choices[0].message.content)

  return completion.choices[0].message.content;

}

