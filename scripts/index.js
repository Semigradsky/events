const path = require('path')

const readEvents = require('./readEvents')
const generateMd = require('./generateMd')
const writeFiles = require('./writeFiles')

const PATH_EVENTS = path.resolve(__dirname, '../events')

;(async () => {
    const events =  await readEvents(PATH_EVENTS)
    const markdowns = await generateMd(events.filter(Boolean))
    await writeFiles(markdowns)
})()
