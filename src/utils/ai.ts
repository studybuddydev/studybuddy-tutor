
import { CatClient } from 'ccat-api'
import OpenAI from "openai";
import 'dotenv/config'
import logger from 'euberlog';

const { AUTH_KEY, URL, PORT } = process.env

export const openai = new OpenAI();

// export const cat = new CatClient({
//   baseUrl: URL as any,
//   user: "franco",
//   port: PORT ? parseInt(PORT) : undefined,
//   authKey: AUTH_KEY,
// })

const clients = new Map<string, CatClient>()


export function getCatClient(userId: string) {
  if (clients.has(userId)) {
    logger.debug('client already exists')
    return clients.get(userId)
  } else {
    logger.debug('creating new client for ', userId)

    const client = new CatClient({
      baseUrl: URL as any,
      user: userId,
      port: PORT ? parseInt(PORT) : undefined,
      authKey: AUTH_KEY,
    })

    clients.set(userId, client)
    return client
  }
}