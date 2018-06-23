const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000
const async = require('async')
const axios = require('axios')
const cloudinary = require('cloudinary')
const SpotifyApi = require('./common/SpotifyApi')
const env = require('./config/env');


cloudinary.config({
  cloud_name: env.cloudinary_cloud_name,
  api_key: env.cloudinary_api_key,
  api_secret: env.cloudinary_api_secret
});

const spotifyApi = new SpotifyApi({
  client_id: env.spotify_client_id,
  client_secret: env.spotify_client_secret
});

var imgArt = "";
var imgTs = "";


async function tsgen(req, res) {

  await spotifyApi.setAccessToken();
  playlistData = await spotifyApi.getPlaylistData('2X3SX875sosVFp58m8puKv');
  console.log('Playlist is...')
  console.log(playlistData)


  const calls = []
  const trackAry = playlistData.tracks.items
  const artAry = []

  for (let i in trackAry) {
    if (i in [0, 1, 2, trackAry.length - 3, trackAry.length - 2, trackAry.length - 1]) {
      calls.push(function (callback) {
        cloudinary.v2.uploader.upload(trackAry[i].track.album.images[0].url,
          function (err, result) {
            if (err) {
              callback(err)
            } else {
              callback(null, result)
            }
          });
      })
    }
  }
  calls.push(function (callback) {
    cloudinary.v2.uploader.upload('https://scannables.scdn.co/uri/plain/jpeg/FFFFFF/black/1280/spotify:user:spotify:playlist:' + req.query.pl,
      function (err, result) {
        if (err) {
          callback(err)
        } else {
          callback(null, result)
        }
      });
  })

  var privateIdAry = []
  async.parallel(calls, function (err, result) {
    if (err) {
      console.log(err);
      return console.log(err);
    }
    for (let el of result) { privateIdAry.push(el.public_id) }
    console.log(privateIdAry)

    const pre = 'http://res.cloudinary.com/hdeoovqgo/image/upload/'
    const art1 = 'l_' + privateIdAry[0] + ',w_420,h_420,g_north_west/'
    const art2 = 'l_' + privateIdAry[1] + ',w_420,h_420,g_north_west,x_420/'
    const art3 = 'l_' + privateIdAry[2] + ',w_420,h_420,g_north_west,x_840/'
    const art4 = 'l_' + privateIdAry[3] + ',w_420,h_420,g_north_west,y_420/'
    const art5 = 'l_' + privateIdAry[4] + ',w_420,h_420,g_north_west,x_420,y_420/'
    const art6 = 'l_' + privateIdAry[5] + ',w_420,h_420,g_north_west,x_840,y_420/'
    const title = 'l_text:Sawarabi%20Mincho_160_center:' + playlistData.name + ',y_262/'
    const qr = 'l_' + privateIdAry[6] + ',w_1260,g_south/'
    const suf = 'template.png'
    const url = pre + art1 + art2 + art3 + art4 + art5 + art6 + title + qr + suf

    console.log(url)
    cloudinary.v2.uploader.upload(url,
      function (error, result) {
        imgArt = result.public_id
        cloudinary.v2.uploader.upload('http://res.cloudinary.com/hdeoovqgo/image/upload/l_' + imgArt + ',w_600/ts.png',
          function (error, result) {
            tsArt = result.public_id
            res.type('json')
            res.json({
              "title": playlistData.name,
              "imgArt": 'http://res.cloudinary.com/hdeoovqgo/image/upload/' + imgArt + '.png',
              "tsArt": 'http://res.cloudinary.com/hdeoovqgo/image/upload/' + tsArt + '.png',
            })
          });
      });
  });
}

express()
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => {
    res.send("Server is working!!!");
  })
  .get('/tsgen', (req, res) => {
    tsgen(req, res)
  })
  .listen(PORT, () => console.log(`Listening on ${PORT}`))
