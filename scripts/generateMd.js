const Mustache = require('mustache')
const pify = require('pify')

const fs = require('fs')
const path = require('path')

const readFile = pify(fs.readFile)

function toDateString(date) {
    const [dayName, month, day] = date.toString().split(' ')
    return `${month} ${day}`
}

async function generateMd(events) {
    const pattern = await readFile(path.resolve(__dirname, 'byDate.mst'), 'utf-8')

    const groupedByYears = new Map()
    for (const event of events) {
        const year = event.date.getFullYear()
        const groupedEvents = groupedByYears.get(year) || []

        groupedByYears.set(year, [...groupedEvents, {
            ...event,
            dateString: toDateString(event.date),
        }])
    }

    for (const [year, groupedEvents] of groupedByYears) {
        const content = Mustache.render(pattern.toString(), {
            year,
            events: groupedEvents,
        })

        groupedByYears.set(year, content)
    }

    return groupedByYears
}

module.exports = generateMd
