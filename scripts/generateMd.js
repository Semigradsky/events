const Mustache = require('mustache')
const pify = require('pify')

const fs = require('fs')
const path = require('path')

const readFile = pify(fs.readFile)

function toDateString(date) {
    if (Array.isArray(date)) {
        const [dayName1, month1, day1] = date[0].toString().split(' ')
        const [dayName2, month2, day2] = date[1].toString().split(' ')
        return `${month1} ${day1}-${day2}`
    }

    const [dayName, month, day] = date.toString().split(' ')
    return `${month} ${day}`
}

function formatTalk(talk) {
    return {
        ...talk,
        url: talk.video || talk.url,
        lang: talk.lang === 'ru' ? undefined : talk.lang,
    }
}

async function generateMd(events) {
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
            dateString: toDateString(event.date),
        }])
    }

    const allYears = [...groupedByYears.keys()].sort().reverse()

    for (const [year, groupedEvents] of groupedByYears) {
        const content = Mustache.render(pattern.toString(), {
            year,
            yearsLinks: allYears.map(y => ({ year: y, link: y !== year ? `/${y}.md` : undefined })),
            events: groupedEvents,
        })

        groupedByYears.set(year, content)
    }

    return groupedByYears
}

module.exports = generateMd
