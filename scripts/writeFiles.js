const fs = require('fs').promises
const path = require('path')

const PATH_SPEAKERS = path.resolve(__dirname, '../speakers')
const PATH_EVENTS = path.resolve(__dirname, '../events')

async function writeYearFile(maxYear, year, content) {
    if (year === maxYear) {
        await fs.writeFile('README.md', content)
    }

    return fs.writeFile(`${year}.md`, content)
}

async function writeOrganizerFile(organizer, content) {
    const fullPath = path.resolve(PATH_EVENTS, organizer, 'README.md')
    return fs.writeFile(fullPath, content)
}

async function writeAllSpeakersFile(content) {
    return fs.writeFile('speakers.md', content)
}

async function writeSpeakerFile(speaker, content) {
    const fullPath = path.resolve(PATH_SPEAKERS, `${speaker}.md`)
    return fs.writeFile(fullPath, content)
}

async function writeFiles(groupedByYears, groupedByOrganizers, groupedBySpeakers, allSpeakers) {
    for (const file of await fs.readdir(PATH_SPEAKERS)) {
        await fs.unlink(path.join(PATH_SPEAKERS, file))
    }

    const maxYear = Math.max(...groupedByYears.keys())

    return Promise.all([
        ...[...groupedByYears.entries()].map(entry => writeYearFile(maxYear, ...entry)),
        ...[...groupedByOrganizers.entries()].map(entry => writeOrganizerFile(...entry)),
        ...[...groupedBySpeakers.entries()].map(entry => writeSpeakerFile(...entry)),
        writeAllSpeakersFile(allSpeakers),
    ])
}

module.exports = writeFiles
