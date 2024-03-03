
import getIcsUri from './calendar';
import ical from 'node-ical';

// calendar stuff
export interface Event {
    id: string;
    room: string;
    department: string;
    start: Date;
    end: Date;
    summary: string;
}



export async function getEvents(url: string) {
    let events: any = []
    let calendar: Event[] = []
    console.log('getting events from ', url)

    if (!url.endsWith('.ics')) {  //university url 
        url = getIcsUri(url) as any
        console.log('url is not ics')
    }


    try {
        events = await ical.async.fromURL(url)     // parse the ics file
        console.log('events', events)
    }
    catch (err) {
        console.log('error with url', url)
    }



    for (const event in events) {
        if (events[event].type === 'VEVENT') {
            calendar.push(parseEvent(events[event]))
        }
    }



    console.log(calendar)
    return calendar
}

function parseEvent(rawEvent: any): Event {
    const regex = /(\d+)([^[]*)(\[.*?\])/;


    //console.log(rawEvent.uid)

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
        console.log('error with ', eventString)
        return event;
    }
}

