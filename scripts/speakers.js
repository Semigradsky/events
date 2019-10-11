const Mustache = require('mustache')
const pify = require('pify')
const yaml = require('js-yaml')

const fs = require('fs')
const path = require('path')

const readFile = pify(fs.readFile)

function toFullDateString(date) {
    if (Array.isArray(date)) {
        const [dayName1, month1, day1, year1] = date[0].toString().split(' ')
        const [dayName2, month2, day2, year2] = date[1].toString().split(' ')
        return `${year1} ${month1} ${day1}-${day2}`
    }

    const [dayName, month, day, year] = date.toString().split(' ')
    return `${year} ${month} ${day}`
}

function getSpeakersData(speakerString, event, talk) {
    let speakers = []

    for (const s of speakerString.split(',')) {
        speakers = speakers.concat(s.trim().split(/\sи\s/))
    }

    return speakers.map(speaker => ({
        speaker: speaker.trim(),
        event,
        talk,
    }))
}

function parseSpeakersData(content) {
    try {
        const data = yaml.safeLoad(content)

        return data
    } catch (err) {
        console.error(`Failed to read speakers.yaml`)
        console.error(err)
    }
}

async function writeAllSpeakers(groupedDataBySpeakers) {
    const allSpeakersPattern = await readFile(path.resolve(__dirname, 'allSpeakers.mst'), 'utf-8')

    const speakers = []
    for (const [speaker, data] of groupedDataBySpeakers.entries()) {
        speakers.push({
            speaker,
            countTalks: data.talks.length,
            speakerLink: speaker.replace(/ /g, '%20') + '.md',
        })
    }

    const speakersByCount = speakers.filter(({ countTalks, speaker }) => countTalks > 1 && speaker !== 'Unknown')

    speakers.sort((s1, s2) => s1.speaker.localeCompare(s2.speaker))
    speakersByCount.sort((s1, s2) => {
        if (s2.countTalks === s1.countTalks) {
            return s1.speaker.localeCompare(s2.speaker)
        }

        return s2.countTalks - s1.countTalks
    })

    return Mustache.render(allSpeakersPattern.toString(), { speakers, speakersByCount })
}

function formatTalkName(talkName) {
    return talkName.replace(/\s/g, ' ').replace(/ - /g, ' — ').trim()
}

function getGroupedDataBySpeakers(speakers, speakersData) {
    const groupedBySpeakers = new Map()

    for (const speaker of speakers) {
        const talksData = speakersData.filter(speakerData => speakerData.speaker === speaker).reduce((acc, speakerData) => {
            const talkName = formatTalkName(speakerData.talk.name)

            const foundTalkIndex = acc.findIndex(x => x.talk === talkName)

            if (foundTalkIndex === -1) {
                acc.push({
                    talk: talkName,
                    events: [{
                        ...speakerData.event,
                        url: speakerData.talk.video || speakerData.talk.url,
                        lang: speakerData.talk.lang,
                        presentation: speakerData.talk.presentation,
                        code: speakerData.talk.code,
                        text: speakerData.talk.text,
                        date: toFullDateString(speakerData.event.date),
                    }],
                })
                return acc
            }

            acc[foundTalkIndex].events.push({
                ...speakerData.event,
                url: speakerData.talk.video || speakerData.talk.url,
                lang: speakerData.talk.lang,
                presentation: speakerData.talk.presentation,
                code: speakerData.talk.code,
                text: speakerData.talk.text,
                date: toFullDateString(speakerData.event.date),
            })

            return acc
        }, [])

        groupedBySpeakers.set(speaker,{
            speaker,
            talks: talksData,
        })
    }

    return groupedBySpeakers
}

async function writeBySpeakers(groupedDataBySpeakers) {
    const speakerPattern = await readFile(path.resolve(__dirname, 'bySpeaker.mst'), 'utf-8')
    const speakersData = parseSpeakersData(await readFile('speakers.yaml', 'utf-8'))

    const groupedBySpeakers = new Map()

    for (const [speaker, data] of groupedDataBySpeakers.entries()) {
        const speakerData = speakersData.find(s => s.name === speaker)

        if (speakerData) {
            const links = []
            let photo = ''

            if (speakerData.github) {
                links.push({
                    emoji: ':octocat:',
                    url: `https://github.com/${speakerData.github}`
                })
            }

            if (speakerData.site) {
                links.push({
                    emoji: ':page_facing_up:',
                    url: speakerData.site
                })
            }

            if (speakerData.twitter) {
                links.push({
                    emoji: ':bird:',
                    url: `https://twitter.com/${speakerData.twitter}`
                })

                photo = `https://avatars.io/twitter/${speakerData.twitter}/large`
            }

            if (speakerData.facebook) {
                links.push({
                    emoji: ':blue_book:',
                    url: `https://facebook.com/${speakerData.facebook}`
                })

                if (!photo) {
                    photo = `https://avatars.io/facebook/${speakerData.facebook}/large`
                }
            }

            if (speakerData.vk) {
                links.push({
                    emoji: ':v:',
                    url: `https://vk.com/${speakerData.vk}`
                })
            }

            if (links.length) {
                data.links = links
                data.photo = photo
            }
        }

        groupedBySpeakers.set(speaker, Mustache.render(speakerPattern.toString(), data))
    }

    return groupedBySpeakers
}

async function generateMd (events) {
    const speakers = new Set()
    const speakersData = []

    for (const event of events) {
        for (const talk of event.talks || []) {
            if (!talk.speaker) {
                continue
            }

            for (const speakerData of getSpeakersData(talk.speaker, event, talk)) {
                speakers.add(speakerData.speaker.trim())
                speakersData.push(speakerData)
            }
        }
    }

    const groupedDataBySpeakers = getGroupedDataBySpeakers(speakers, speakersData)

    return [
        writeBySpeakers(groupedDataBySpeakers),
        writeAllSpeakers(groupedDataBySpeakers),
    ]
}

module.exports = {
    generateMd,
}
