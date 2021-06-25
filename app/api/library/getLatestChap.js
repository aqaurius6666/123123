const {Types} = require("mongoose")
const Episode = require("../../models/episode")
const Serie = require("../../models/serie")

const mapping = {}

const generateMapping = async () => {
    const episodes = await Episode.find({})
    return Promise.all(episodes.map(ep => {
        mapping[ep.serie.toString()] = (mapping[ep.serie.toString()] ?? 0) + 1
    }))
}

const getLatestChap = (serieId) => {
    mapping[serieId] = (mapping[serieId] ?? 0) + 1
    return mapping[serieId]
}

module.exports = {
    getLatestChap,
    generateMapping
}