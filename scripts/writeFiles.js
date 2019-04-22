const pify = require('pify')

const fs = require('fs')

const writeFile = pify(fs.writeFile)

async function writeFiles(groupedByYears) {
    const currentYear = new Date().getFullYear()

    return Promise.all([...groupedByYears.entries()].map(async ([year, content]) => {
        if (year === currentYear) {
            await writeFile('README.md', content)
        }

        return writeFile(`${year}.md`, content)
    }))
}

module.exports = writeFiles
