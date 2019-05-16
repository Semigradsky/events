const pify = require('pify')
const yaml = require('js-yaml')

const fs = require('fs')
const path = require('path')

const readDir = pify(fs.readdir)
const readFile = pify(fs.readFile)

function parseEvent(content, uid) {
    try {
        const data = yaml.safeLoad(content)

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
        return;
    }

    const uid = path.basename(fullPath, '.yaml')

    const file = await readFile(fullPath, 'utf-8')
    const parsedData = parseEvent(file, uid)
    return {
        ...parsedData,
        uid,
        organizer: folder,
    }
}

async function readEvents(srcPath) {
    const folders = await readDir(srcPath)

    const events = await Promise.all(folders.map(async folder => {
        const files = await readDir(path.resolve(srcPath, folder))
        return Promise.all(
            files.map(file => readEvent(path.resolve(srcPath, folder, file), folder))
        )
    }))

    return events.reduce((acc, x) => [...acc, ...x]).filter(Boolean).sort((a, b) => b.date - a.date)
}

module.exports = readEvents
