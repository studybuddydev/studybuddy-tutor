import { MyContext } from './types'
import { getCatClient, openai } from './ai'
import 'dotenv/config'
import logger from 'euberlog'
import fs from 'fs'
import axios from 'axios'
import sharp from 'sharp'




const BOT_TOKEN = process.env.BOT_TOKEN as string
const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/`


// handle message 
export async function handleMessage(ctx: MyContext) {
    //is is a voice message 
    if(!ctx.message?.text) return

    const msg = ctx.message?.text as string
    if (msg.startsWith('/')) return

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

    const file = await ctx.getFile()
    const filepath  =  fileUrl + file.file_path

    if (!ctx.session.isAdmin) return

    if (!fileUrl) {
        ctx.reply('non posso scaricare il file')
        return
    }
    logger.info('processing voice message')

    //download file from filpath
    const tempPath = 'data/audio.ogg'
    const writer = fs.createWriteStream(tempPath)



    const response = await axios({
        url: filepath,
        method: 'GET',
        responseType: 'stream'
    })

    await response.data.pipe(writer)
    await new Promise(resolve => writer.on('finish', resolve));

    console.log('file downloaded')


    //wait 5 second 
    

    const transcription = await openai.audio.transcriptions.create({ file: fs.createReadStream(tempPath) , model: "whisper-1", language: "en"});

    ctx.reply(JSON.stringify(transcription.text));
    console.log(transcription.text)


    const systemPrompt = "You are a helpful StudyBuddy for university students. Your task is to correct any spelling discrepancies in the transcribed text. Make sure that the names of the following products are spelled correctly: StudyBuddy, extract possible exam dates or relevent information ,add necessary punctuation such as periods, commas, and capitalization, and use only the context provided. user may talk in italian";
    const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-0125",
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: transcription.text },
        ],
    });

    ctx.reply(JSON.stringify(completion.choices[0].message.content))

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
                            "detail" : "low"
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

