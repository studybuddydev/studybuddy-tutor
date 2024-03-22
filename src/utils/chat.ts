import { MyContext } from './types'
import { getCatClient  } from './ai'
import 'dotenv/config'
import logger from 'euberlog'

const BOT_TOKEN  = process.env.BOT_TOKEN as string


// handle message 
export async function handleMessage(ctx: MyContext) {
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



  //   const response = await axios.get(url, { responseType: 'arraybuffer' });
  //   const fileBuffer = Buffer.from(response.data, 'binary');

  //   //fs.writeFileSync('/data/file.pdf', fileBuffer);

  //   const fileBlob = new Blob([fileBuffer], { type: 'application/pdf' }); // Adjust the MIME type as necessary

  //   formData.append('file', fileBuffer, {
  //     filename: 'file.pdf', // The name of the file
  //     contentType: 'application/pdf', // The MIME type of the file
  //   });
  //   await cat.api?.rabbitHole.uploadFile({ file: fileBlob });

  //   ctx.reply('file uploaded')


  // } catch (err) {
  //   console.log('errore', err);
  //   console.log('errore', docfile.file_path);
  //   return;
  // }

