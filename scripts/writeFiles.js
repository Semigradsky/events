const pify = require('pify')

const fs = require('fs')
const path = require('path')

const PATH_SPEAKERS = path.resolve(__dirname, '../speakers')
const PATH_EVENTS = path.resolve(__dirname, '../events')

const writeFile = pify(fs.writeFile)
const readdir = pify(fs.readdir)
const unlink = pify(fs.unlink)

async function writeYearFile(maxYear, year, content) {
    if (year === maxYear) {
        await writeFile('README.md', content)
    }

    return writeFile(`${year}.md`, content)
}

async function writeOrganizerFile(organizer, content) {
    const fullPath = path.resolve(PATH_EVENTS, organizer, 'README.md')
    return writeFile(fullPath, content)
}

async function writeAllSpeakersFile(content) {
    return writeFile('speakers.md', content)
}

async function writeSpeakerFile(speaker, content) {
    const fullPath = path.resolve(PATH_SPEAKERS, `${speaker}.md`)
    return writeFile(fullPath, content)
}

async function writeFiles(groupedByYears, groupedByOrganizers, groupedBySpeakers, allSpeakers) {
    for (const file of await readdir(PATH_SPEAKERS)) {
        await unlink(path.join(PATH_SPEAKERS, file))
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
