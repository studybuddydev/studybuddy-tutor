
import getIcsUri from './calendar';
import ical from 'node-ical';
import { Event, Calendar, MyContext } from './types';
import logger from 'euberlog';

// Load the environment variables from the .env file.
//calendars for testing
const url = 'https://easyacademy.unitn.it/AgendaStudentiUnitn/index.php?view=easycourse&include=corso&txtcurr=1+-+Computational+and+theoretical+modelling+of+language+and+cognition&anno=2023&corso=0708H&anno2%5B%5D=P0407%7C1&date=14-09-2023&_lang=en&highlighted_date=0&_lang=en&all_events=1&'
const url2 = 'https://easyacademy.unitn.it/AgendaStudentiUnitn/index.php?view=easycourse&form-type=corso&include=corso&txtcurr=2+-+Economics+and+Management&anno=2023&corso=0117G&anno2%5B%5D=P0201%7C2&date=25-02-2024&periodo_didattico=&_lang=en&list=&week_grid_type=-1&ar_codes_=&ar_select_=&col_cells=0&empty_box=0&only_grid=0&highlighted_date=0&all_events=0&faculty_group=0'
const url3 = 'https://easyacademy.unitn.it/AgendaStudentiUnitn/index.php?view=easycourse&form-type=corso&include=corso&txtcurr=1+-+Scienze+e+Tecnologie+Informatiche&anno=2023&corso=0514G&anno2%5B%5D=P0405%7C1&date=01-03-2024&periodo_didattico=&_lang=en&list=&week_grid_type=-1&ar_codes_=&ar_select_=&col_cells=0&empty_box=0&only_grid=0&highlighted_date=0&all_events=0&faculty_group=0#'
//const url4 = 'https://calendari.unibs.it/PortaleStudenti/index.php?view=easycourse&form-type=corso&include=corso&txtcurr=1+-+GENERALE+-+Cognomi+M-Z&anno=2023&scuola=IngegneriaMeccanicaeIndustriale&corso=05742&anno2%5B%5D=3%7C1&visualizzazione_orario=cal&date=07-03-2024&periodo_didattico=&_lang=en&list=&week_grid_type=-1&ar_codes_=&ar_select_=&col_cells=0&empty_box=0&only_grid=0&highlighted_date=0&all_events=0&faculty_group=0#'


// calendar stuff
export async  function refreshCalendar(ctx: MyContext) {
    if (ctx.session.calendar) {
        const calendar = await getEvents(ctx.session.calendar.url)
        ctx.session.calendar.events = calendar.events
      }
      else {
        ctx.conversation.enter("addcalendario");
      }
      
}

export function getNextEvents(calendar: Calendar, n: number = 3) {

    // sort calendar by date
    const today = new Date()
    const nextEvents = calendar.events.filter(event => new Date(event.start) > today);



    //sort by date
    nextEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    let nextEventsString = "I tuoi prossimi eventi:\n\n"
    // get next 3 events with date and time
    nextEvents.slice(0, n).forEach(event => {
        const start = new Date(event.start).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        const end = new Date(event.end).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        const date = new Date(event.start).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric' });
        nextEventsString += `${date}, ${start} - ${end} \n${event.summary}\n\n`;
    });

    if (nextEventsString === "I tuoi prossimi eventi:\n\n") {
        nextEventsString = "Non ci sono eventi in programma\n\n";
    }

    return nextEventsString

}

export function getDailyEvents(calendar: Calendar){

    const today = new Date()



    const todayEvents = calendar.events.filter(event => new Date(event.start).getDate() === today.getDate() && new Date(event.start).getMonth() === today.getMonth())

    todayEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());



    let dailyEvents = ""
    dailyEvents = 'Buongiorno, oggi hai da fare:\n\n'

    todayEvents.forEach(event => {

        const start = new Date(event.start).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
        dailyEvents += `${start} - ${event.summary}\n\n`
    })

    if (dailyEvents === 'Buongiorno, oggi hai da fare:\n\n') {
        dailyEvents = 'Buongiorno, oggi non hai lezioni\n\n'
    }

    return dailyEvents
}



export async function getEvents(url: string) {
    let events: any = []
    let calendar: Calendar = {
        url: url,
        events: [],
        title: 'calendar'
    }
    logger.info('getting events from ', url)

    if (!url.endsWith('.ics')) {  //university url 
        url = getIcsUri(url) as any
        logger.info('url is not ics')
    }


    try {
        events = await ical.async.fromURL(url)     // parse the ics file
    }
    catch (err) {
        logger.error('error with url', url)
    }




    for (const event in events) {

        if (events[event].type === 'VEVENT' && new Date(events[event].start) > new Date()) {
            calendar.events.push(parseEvent(events[event]))
        } else if(events[event].type === 'VCALENDAR'){
            calendar.title = events[event]['WR-CALNAME']
        }
    }



    return calendar
}

function parseEvent(rawEvent: any): Event {
    const regex = /(\d+)([^[]*)(\[.*?\])/;



    const eventString = rawEvent['uid'] as string;
    const match = eventString.match(regex);

    let event: Event = {
        id: '',
        room: '',
        department: '',
        start: rawEvent.start,
        end: rawEvent.end,
        summary: rawEvent.summary,
    }

    if (match) {
        event.id = match[1];
        event.room = match[2];
        event.department = match[3].replace(/[\[\]@]/g, ''); // Remove brackets and '@'
        event.start = rawEvent.start;
        event.end = rawEvent.end;
        event.summary = rawEvent.summary;
        return event;

    } else {
        logger.error('error with ', eventString)
        return event;
    }
}



