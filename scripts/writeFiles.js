const pify = require('pify')

const fs = require('fs')

const writeFile = pify(fs.writeFile)

async function writeFiles(groupedByYears) {
    return [...groupedByYears.entries()].map(([year, content]) => {
        return writeFile(`${year}.md`, content)
    })
}

module.exports = writeFiles
