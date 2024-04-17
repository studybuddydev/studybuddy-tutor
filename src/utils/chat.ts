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
    //is is a voice message 
    if (!ctx.message?.text) return

    const msg = ctx.message?.text as string
    if (msg.startsWith('/')) return

    if (msg.startsWith('a')) {
        await getSyllabusExams()
        return
    }

    if (msg.startsWith('https://unitn.coursecatalogue')) {
        await scrapeSyllabus('ctx')
        return
    }

    if (ctx.session.wantsChat) {

        const cat = getCatClient(`${ctx.from?.id}`)

        cat?.onConnected(() => {
            logger.debug('sending message to cat')
            cat?.send(msg)
        })

        cat?.send(msg)


        ctx.replyWithChatAction('typing')



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
    ctx.reply('grazie, ora faccio le mie magie')

    if (!ctx.session.isAdmin) return


    const photo = await ctx.getFile()
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
        model: "gpt-4-vision-preview",
        messages: [
            {
                role: "user",
                content: [
                    { type: "text", text: "spiega l'immagine" },
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
    ctx.reply(JSON.stringify(response.choices[0].message));
    //ctx.reply(JSON.stringify(response.choices[1].message));


    console.log(response.choices[0]);


    console.log(response.choices);




}


async function getSyllabusExams(){

    const urlEsami = 'https://unitn.coursecatalogue.cineca.it/corsi/2023/10114/insegnamenti/9999'
    const browser = await puppeteer.launch();
    const page: Page = await browser.newPage();
    await page.goto(urlEsami, { waitUntil: 'networkidle0' }); // Replace with your target web app URL

    await page.waitForSelector('app-root', { timeout: 5000 });

    //print page content 
    const content = await page.content()

    await page.waitForSelector('card-insegnamento'); // Wait for the presence of the exam cards

    // Extract exam information
    const exams = await page.evaluate(() => {
        const examElements = Array.from(document.querySelectorAll('card-insegnamento'));
        return examElements.map(examElement => {
            const nameElement = examElement.querySelector('.card-insegnamento-header');
            const creditsElement = examElement.querySelector('.card-insegnamento-footer .card-insegnamento-cfu');
            const hoursElement = examElement.querySelector('.card-insegnamento-footer .card-insegnamento-ore');
            const urlElement = examElement.querySelector('.card-insegnamento-header a')?.getAttribute('href');

            // Check if elements are not null before accessing properties
            const name = nameElement ? nameElement.textContent?.trim() : '';
            const credits = creditsElement ? creditsElement.textContent?.trim() : '';
            const hours = hoursElement ? hoursElement.textContent?.trim() : '';
            const url = urlElement ? urlElement : '';

            return {
                name,
                credits,
                hours,
                url
            };
        });
    });

    // Print exam information
    exams.forEach(exam => {
        console.log("Name:", exam.name);
        console.log("Credits:", exam.credits);
        console.log("Hours:", exam.url);
        console.log();
    });

    const url = 'https://unitn.coursecatalogue.cineca.it' + exams[2].url

    scrapeSyllabus(url)


}



// get url of a syllabus from unitn course catalogue and scrape it 
async function scrapeSyllabus(url: string): Promise<void> {
    const browser = await puppeteer.launch();
    const page: Page = await browser.newPage(); 
    //const url = ctx.message?.text as string
    await page.goto(url, { waitUntil: 'networkidle0' }); // Replace with your target web app URL

    await page.waitForSelector('app-root', { timeout: 5000 });

   
    await page.waitForSelector('.u-filetto');

    // Extract the title text
    const title = await page.$eval('.u-filetto', element => element.textContent);


    console.log(`Title: ${title}`);

    await page.waitForSelector('.accordion');
    let infoElements: CourseInfo = { name: '', chapters: [], books: '', examDetails: '', learningGoals: '', methods: '' };

        // unico modo di farlo funzionare, ho provato a tirare fuori sta funzione per pulire un po' il codice ma non funziona
    infoElements = await page.$$eval('.accordion > dt, .accordion > dd', (elements: Element[]) => {
        let currentGroup: Partial<CourseInfo> = {};

        for (const element of elements) {
            if (element.tagName === 'DT') {
                currentGroup.name = element.textContent!.trim();
            } else if (element.tagName === 'DD') {
                const item = element.textContent!.trim();
                switch (currentGroup?.name) {
                    case 'Contenuti':
                        currentGroup.chapters = [item]//.split('-').map(chapter => chapter.trim()).filter(chapter => chapter !== '');
                        break;
                    case 'Testi':
                        currentGroup.books = item
                    case 'Obiettivi formativi':
                        currentGroup.learningGoals = item;
                        break;
                    case 'Metodi didattici':
                        currentGroup.methods = item;
                        break;
                    case 'Verifica dell\'apprendimento':
                        currentGroup.examDetails = item;
                        break;
                    default:
                        break;
                }
            }
        }


        return currentGroup as CourseInfo;
    });

    infoElements.name = title?.trim() || 'no title found';

    console.log('Information:', infoElements);

    console.log(infoElements)

    //save to a json file 



    await browser.close();

   const processedSyllabus = await processSyllabus(infoElements)
   const inputfile: InputFile = new InputFile(Buffer.from(JSON.stringify(processedSyllabus, null, 2)), processedSyllabus?.name + '.json')

    const fs = require('fs');
    fs.writeFileSync('esame.json', JSON.stringify(infoElements, null, 2));





    //ctx.replyWithDocument(inputfile)



}

async function processSyllabus(syllabus: CourseInfo) {


    const systemPromptChapters = `You are a helpful studybuddy for university students, you are given in input a string with the content of the course, 
                        you should infer the chapters and the section( if present), give the output in json format with the following structure:
                      {chapters: [{ name: string, sections: string[]}]`

    const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-0125",
        messages: [
            { role: "system", content: systemPromptChapters },
            { role: "user", content: syllabus.chapters[0] },
        ],
    });

    console.log(completion.choices[0].message.content)
    if (!completion.choices[0].message.content) return

    const chapters = JSON.parse(completion.choices[0].message.content)

    syllabus.chapters = chapters.chapters.map((chapter: any) => chapter)


    


    return syllabus
}



// const filesyl = JSON.parse(fs.readFileSync('esame.json', 'utf8')) as CourseInfo
// processSyllabus(filesyl)
