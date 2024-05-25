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






export async function getSyllabusExams(){

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
            const url = urlEsami + urlElement ? urlElement : '';

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
        console.log("Hours:", urlEsami + exam.url);
        console.log();
    });

    return exams 


}



// get url of a syllabus from unitn course catalogue and scrape it 
export async function scrapeSyllabus(url: string): Promise<void> {
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

// use gpt for creating a json of the scraped syllabus parsing in the correct way chapetes and sections
export async function processSyllabus(syllabus: CourseInfo) {


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



