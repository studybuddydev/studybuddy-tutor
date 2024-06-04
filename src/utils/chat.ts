import { MyContext } from './types'
import { getCatClient, openai } from './ai'
import 'dotenv/config'
import logger from 'euberlog'
import fs from 'fs'
import axios from 'axios'
import sharp from 'sharp'
import { exec } from 'child_process';
import { CourseInfo } from './types'
import * as ai from './ai'

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

    // here it happens the ai stuff
    const transcription = await openai.audio.transcriptions.create({ file: fs.createReadStream(tempPathCompressed), model: "whisper-1" });

    console.log(transcription.text)

    

    const correctedText = await ai.postprocessTranscription(transcription.text)



    // if it is too long send it as a file
    if (transcription.text.length < 4096) {
        ctx.reply(JSON.stringify(transcription.text).replace(/\\n/g, '\n'));
        ctx.reply(JSON.stringify(correctedText).replace(/\\n/g, '\n'));
    } else 
    {   //sent it as a file 

        const inputfile: InputFile = new InputFile(Buffer.from(JSON.parse(JSON.stringify(transcription.text, null, 2))), 'transcription.txt')

        ctx.replyWithDocument(inputfile)

        const inputfile2: InputFile = new InputFile(Buffer.from(JSON.parse(JSON.stringify(correctedText, null, 2))), 'corrected.txt')

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


    const response = await  ai.readImage(photoUrl, caption)


    //ctx.reply(JSON.stringify(response.choices[0].message));

    sendGeneratedText(ctx, response)


    // console.log(response.choices[0]);


    // console.log(response.choices);

}

function sendGeneratedText(ctx: MyContext, text: string) {
    if (text.length < 4096) {
        //escape markdown
        text = text.replace(/([_.*[\]()~`>#\+=\-|{}.!])/g, '\\$1');

        ctx.reply(text, { parse_mode: 'MarkdownV2' })
    } else {
        const inputfile: InputFile = new InputFile(Buffer.from(text), 'output.txt')
        ctx.replyWithDocument(inputfile)
    }
}






// const filesyl = JSON.parse(fs.readFileSync('esame.json', 'utf8')) as CourseInfo
// processSyllabus(filesyl)
