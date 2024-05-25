import { MyContext } from './types'
import { getCatClient, openai } from './ai'
import 'dotenv/config'
import logger from 'euberlog'
import fs from 'fs'
import axios from 'axios'
import sharp from 'sharp'
import { exec } from 'child_process';
import { CourseInfo } from './types'

import puppeteer, { Page } from 'puppeteer';
import { InputFile } from 'grammy'
import { info } from 'console'
//const url = "https://unitn.coursecatalogue.cineca.it/insegnamenti/2023/87758/2008/10003/10114?coorte=2023"

import { scrapeSyllabus, processSyllabus, getSyllabusExams } from './syllabus'




const BOT_TOKEN = process.env.BOT_TOKEN as string
const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/`


function compressAudio(): Promise<void> {
    return new Promise((resolve, reject) => {
        const ffmpegCommand = `ffmpeg -i data/audio.ogg -vn -map_metadata -1 -ac 1 -c:a libopus -b:a 12k -application voip data/audiocompressed.ogg -y`;
        console.log('compressing audio');
        exec(ffmpegCommand, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                reject(error);
                return;
            }
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
            resolve();
        });
    });
}


// handle message 
export async function handleMessage(ctx: MyContext) {
    //it is not a text
    if (!ctx.message?.text) return

    const msg = ctx.message?.text as string

    // its a command 
    if (msg.startsWith('/')) return

    // a is for my test scraping the syllabus list TEST FEATURE
    if (msg.startsWith('a')) {  
        const exams = await getSyllabusExams()
        ctx.reply(JSON.stringify(exams[0]))
        return
    }

    // if it is a link to the syllabus scrape it
    if (msg.startsWith('https://unitn.coursecatalogue')) {
        await scrapeSyllabus('ctx')
        return
    }

    //it is a text message, let's check if they have the rights to chat
    if (ctx.session.wantsChat) {

        const cat = getCatClient(`${ctx.from?.id}`)
        // connect to the cat 
        cat?.onConnected(() => {
            logger.debug('sending message to cat')
            cat?.send(msg)
        })

        cat?.send(msg)  // send the message to the cat


        ctx.replyWithChatAction('typing') // show typing action


        // listen to the response from the cat and reply to the user
        cat?.onMessage(res => {

            if (res.type === 'chat') {
                ctx.reply(res.content);
            }

        })
    } else {
        ctx.reply('attiva la chat da /settings')
    }
}


export async function handleVoice(ctx: MyContext) {
    console.log('voice message')

    const file = await ctx.getFile()
    const filepath = fileUrl + file.file_path

    if (!ctx.session.isTester) return

    if (!fileUrl) {
        ctx.reply('non posso scaricare il file')
        return
    }
    logger.info('processing voice message')

    //download file from filpath
    const tempPath = 'data/audio.ogg'
    const tempPathCompressed = 'data/audiocompressed.ogg'
    const writer = fs.createWriteStream(tempPath)



    const response = await axios({
        url: filepath,
        method: 'GET',
        responseType: 'stream'
    })

    await response.data.pipe(writer)
    await new Promise(resolve => writer.on('finish', resolve));

    console.log('file downloaded')

    await compressAudio()


    const transcription = await openai.audio.transcriptions.create({ file: fs.createReadStream(tempPathCompressed), model: "whisper-1", language: "it" });

    console.log(transcription.text)


    const systemPrompt = "You are a helpful StudyBuddy for university students. Your task is to correct any spelling discrepancies in the transcribed text.  add necessary punctuation such as periods, commas, and capitalization, and use only the context provided. user may talk in italian"
    const brainstormingPrompt = "As an experienced researcher, you are asked to provide a summary of the  brainstorming session including the main ideas and concept, then add 10 potential ideas and help to define the most interesting ones that the users provided, reply in the same language the users talks"
    const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-0125",
        messages: [
            { role: "system", content: brainstormingPrompt },
            { role: "user", content: transcription.text },
        ],
    });
    // if it is too long send it as a file
    if (transcription.text.length < 4096) {
        ctx.reply(JSON.stringify(transcription.text));

        const correctedText = completion.choices[0].message.content
        ctx.reply(JSON.stringify(correctedText))
    } else 
    {   //sent it as a file 

        const inputfile: InputFile = new InputFile(Buffer.from(JSON.stringify(transcription.text, null, 2)), 'transcription.txt')

        ctx.replyWithDocument(inputfile)

        const correctedText = completion.choices[0].message.content
        const inputfile2: InputFile = new InputFile(Buffer.from(JSON.stringify(correctedText, null, 2)), 'corrected.txt')

        ctx.replyWithDocument(inputfile2) 
    }

    //ctx.reply('non posso gestire messaggi vocali')
}


//handle document
export async function handleDocument(ctx: MyContext) {
    ctx.reply('sto caricando il file')
    logger.info('bel documento')
    const cat = getCatClient(`${ctx.from?.id}`)

    const document = ctx.message?.document
    if (!document || !document.mime_type) {
        ctx.reply("Non hai inviato un documento");
        return;
    }
    const docfile = await ctx.getFile()

    const acceptedTypes = (await cat?.api?.rabbitHole.getAllowedMimetypes())?.allowed
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${docfile.file_path}`


    if (!acceptedTypes?.includes(document.mime_type)) {
        ctx.reply(`*il file \`${document?.mime_type}\` non è supportato\\!*`)
        return
    }

    console.log(fileUrl)




    const formData = new FormData();

    const blob = await fetch(fileUrl).then(r => r.blob())
    //const file = new File([blob], 'file.pdf', { type: 'application/pdf' });

    await cat?.api?.rabbitHole.uploadFile({ file: blob });
}

//handle photo
export async function handlePhoto(ctx: MyContext) {

    if (!ctx.session.isAdmin) return

    ctx.reply('grazie, ora faccio le mie magie')

    const photo = await ctx.getFile()
    const caption = ctx.message?.caption ?? 'spiega la foto'
    console.log('la caption è ', caption)
    if (!photo) {
        ctx.reply("Non hai inviato una foto");
        return;
    }

    console.log(photo)

    const photoUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${photo.file_path}`

    console.log(photoUrl)

    //resize image
    // const resizedImage = await sharp(photoUrl).resize(200, 200).toBuffer()





    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            {
                role: "user",
                content: [
                    { type: "text", text: caption },
                    {
                        type: "image_url",
                        image_url: {
                            "url": photoUrl,
                            "detail": "low"
                        },
                    },
                ],
            },
        ],
    })
    //ctx.reply(JSON.stringify(response.choices[0].message));

    sendGeneratedText(ctx, response.choices[0].message.content ?? "")


    // console.log(response.choices[0]);


    // console.log(response.choices);

}

function sendGeneratedText(ctx: MyContext, text: string) {
    if (text.length < 4096) {
        ctx.reply(text)
    } else {
        const inputfile: InputFile = new InputFile(Buffer.from(text), 'output.txt')
        ctx.replyWithDocument(inputfile)
    }
}






// const filesyl = JSON.parse(fs.readFileSync('esame.json', 'utf8')) as CourseInfo
// processSyllabus(filesyl)
