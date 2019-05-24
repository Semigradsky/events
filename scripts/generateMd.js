const Mustache = require('mustache')
const pify = require('pify')

const fs = require('fs')
const path = require('path')

const readFile = pify(fs.readFile)

function toDateString(date) {
    if (Array.isArray(date)) {
        const [year1, month1, day1] = date[0].toString().split(' ')
        const [year2, month2, day2] = date[1].toString().split(' ')
        return `${month1} ${day1}-${day2}`
    }

    const [year, month, day] = date.toString().split(' ')
    return `${month} ${day}`
}

function toFullDateString(date) {
    if (Array.isArray(date)) {
        const [year1, month1, day1] = date[0].toString().split(' ')
        const [year2, month2, day2] = date[1].toString().split(' ')
        return `${year1} ${month1} ${day1}-${day2}`
    }

    const [year, month, day] = date.toString().split(' ')
    return `${year} ${month} ${day}`
}

function getFirstDay(date) {
    return Array.isArray(date) ? date[0]: date;
}

function formatTalk(talk) {
    return {
        ...talk,
        url: talk.video || talk.url,
        lang: talk.lang === 'ru' ? undefined : talk.lang,
    }
}

function sortEvents(events) {
    return events.sort((a, b) => `${a.firstDay} ${a.name}` < `${b.firstDay} ${b.name}` ? 1 : -1)
}

async function generateByYears(events) {
    const pattern = await readFile(path.resolve(__dirname, 'byDate.mst'), 'utf-8')

    const groupedByYears = new Map()
    for (const event of events) {
        if (!event.talks || !event.talks.some(t => t.video || t.link || t.presentation || t.code)) {
            continue;
        }

        const year = (Array.isArray(event.date) ? event.date[0] : event.date).getFullYear()
        const groupedEvents = groupedByYears.get(year) || []

        groupedByYears.set(year, [...groupedEvents, {
            ...event,
            talks: event.talks.map(formatTalk),
            firstDay: getFirstDay(event.date).toISOString(),
            dateString: toDateString(event.date),
        }])
    }

    const allYears = [...groupedByYears.keys()].sort().reverse()

    for (const [year, groupedEvents] of groupedByYears) {
        const content = Mustache.render(pattern.toString(), {
            year,
            yearsLinks: allYears.map(y => ({ year: y, link: y !== year ? `/${y}.md` : undefined })),
            events: sortEvents(groupedEvents),
        })

        groupedByYears.set(year, content)
    }

    return groupedByYears
}

async function generateByOrganizers(events) {
    const pattern = await readFile(path.resolve(__dirname, 'byOrganizer.mst'), 'utf-8')

    const groupedByOrganizers = new Map()
    for (const event of events) {
        if (!event.talks || !event.talks.some(t => t.video || t.link || t.presentation || t.code)) {
            continue;
        }

        const organizer = event.organizer
        const groupedEvents = groupedByOrganizers.get(organizer) || []

        groupedByOrganizers.set(organizer, [...groupedEvents, {
            ...event,
            talks: event.talks.map(formatTalk),
            firstDay: getFirstDay(event.date).toISOString(),
            dateString: toFullDateString(event.date),
        }])
    }

    for (const [organizer, groupedEvents] of groupedByOrganizers) {
        const content = Mustache.render(pattern.toString(), {
            organizer,
            events: sortEvents(groupedEvents),
        })

        groupedByOrganizers.set(organizer, content)
    }

    return groupedByOrganizers
}

async function generateMd(events) {
    return Promise.all([
        generateByYears(events),
        generateByOrganizers(events),
    ])
}

module.exports = generateMd
