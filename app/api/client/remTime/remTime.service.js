const RemTime = require('../../../models/rem_time');
const User = require('../../../models/user');
const Serie = require('../../../models/serie');
const Episode = require('../../../models/episode');


const getRemTime = async ({ userId, seriesId, episodeId }) => {
  console.log({seriesId, episodeId})
  const episode = await Episode.findOne({
    serie: seriesId,
    chapter: episodeId,
  })

  const remTime = await RemTime.findOne({
    user: userId,
    episode: episode._id,
    series: seriesId,
  })

  if (!remTime) throw new Error("REMTIME.REMTIME_NOT_FOUND")
  return remTime.time
}

const updateRemTime = async ({ userId, seriesId, episodeId, time }) => {

  const user = await User.findOne({
    _id: userId,
  })

  if(!user) throw new Error("REMTIME.USER_NOT_FOUND")

  const serie = await Serie.findOne({
    _id: seriesId,
  })

  if(!serie) throw new Error("REMTIME.SERIE_NOT_FOUND")

  const episode = await Episode.findOne({
    serie: seriesId,
    chapter: episodeId,
  })

  if(!episode) throw new Error("REMTIME.EPISODE_NOT_FOUND")

  const remTime = await RemTime.findOne({
    user: userId,
    episode: episode._id,
    series: seriesId,
  })

  if (!remTime) {
    const newRemTime = new RemTime({
      user: userId,
      episode: episode._id,
      series: seriesId,
      time: time,
    });

    await newRemTime.save();

    return true;
  } else {
    await RemTime.updateOne(
      {
        user: userId,
        episode: episode._id,
        series: seriesId,
      },
      {
        $set: {
          time: time,
        },
      }
    );

    return true;
  }
}

module.exports = {
  getRemTime,
  updateRemTime,
};
