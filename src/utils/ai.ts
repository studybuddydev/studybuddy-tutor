
import { CatClient } from 'ccat-api'
import OpenAI from "openai";
import 'dotenv/config'

const { AUTH_KEY, URL, PORT } = process.env

export const openai = new OpenAI();
export const cat = new CatClient({
  baseUrl: URL as any,
  user: 'user',
  port: PORT ? parseInt(PORT) : undefined,
  authKey: AUTH_KEY,
})