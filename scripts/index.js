const readEvents = require('./readEvents')
const generateMd = require('./generateMd')
const writeFiles = require('./writeFiles')

;(async () => {
    const events = (await readEvents()).filter(Boolean)
    const [byYears, byOrganizers, bySpeakers, allSpeakers] = await generateMd(events)
    await writeFiles(byYears, byOrganizers, bySpeakers, allSpeakers)
})()
