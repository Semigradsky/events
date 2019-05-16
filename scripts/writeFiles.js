const pify = require('pify')

const fs = require('fs')
const path = require('path')

const PATH_EVENTS = path.resolve(__dirname, '../events')
const CURRENT_YEAR = new Date().getFullYear()

const writeFile = pify(fs.writeFile)

async function writeYearFile(year, content) {
    if (year === CURRENT_YEAR) {
        await writeFile('README.md', content)
    }

    return writeFile(`${year}.md`, content)
}

async function writeOrganizerFile(organizer, content) {
    const fullPath = path.resolve(PATH_EVENTS, organizer, 'README.md')
    return writeFile(fullPath, content)
}

async function writeFiles(groupedByYears, groupedByOrganizers) {
    return Promise.all([]
        .concat([...groupedByYears.entries()].map(entry => writeYearFile(...entry)))
        .concat([...groupedByOrganizers.entries()].map(entry => writeOrganizerFile(...entry)))
    )
}

module.exports = writeFiles
