const yaml = require('js-yaml')

const fs = require('fs').promises
const path = require('path')

function parseEvent(content, uid) {
    try {
        const data = yaml.load(content)

        if (typeof data.date !== 'object') {
            console.error(`Wrong date on ${uid}.yaml`)
        }

        return data
    } catch (err) {
        console.error(`Failed to read ${uid}.yaml`)
        console.error(err)
    }
}

async function readEvent(fullPath, folder) {
    if (!fullPath.includes('.yaml')) {
        return
    }

    const uid = path.basename(fullPath, '.yaml')

    const file = await fs.readFile(fullPath, 'utf-8')
    const parsedData = parseEvent(file, uid)
    return {
        ...parsedData,
        uid,
        organizer: folder,
    }
}

async function readEvents() {
    const srcPath = path.resolve(__dirname, '../events')
    const folders = await fs.readdir(srcPath)

    const events = await Promise.all(folders.map(async folder => {
        const files = await fs.readdir(path.resolve(srcPath, folder))
        return Promise.all(
            files.map(file => readEvent(path.resolve(srcPath, folder, file), folder))
        )
    }))

    return events.reduce((acc, x) => [...acc, ...x]).filter(Boolean).sort((a, b) => b.date - a.date)
}

module.exports = readEvents
