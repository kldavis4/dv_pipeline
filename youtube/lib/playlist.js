(async () => {
  require('dotenv').config()
  const { google } = require('googleapis')
  const youtubeData = google.youtube('v3')
  const fs = require('fs')
  const path = require('path')

  const args = process.argv.slice(2)

  const filepath = args[0]
  
  function checkFileExists(file) {
    return fs.promises.access(file, fs.constants.F_OK)
             .then(() => true)
             .catch(() => false)
  }

  const parts = filepath.split('/')
  const folder = parts.pop()
  const title = folder.replace(/_/g, ' ')

  const oauth2Client = new google.auth.OAuth2(process.env.CLIENT_ID, process.env.CLIENT_SECRET, `${process.env.BASE_URL}/services/youtube/connect/callback`)
  oauth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN })

  if (await checkFileExists(`${filepath}/playlist.json`)) {

  } else {
    const res = await youtubeData['playlists'].insert({
      part: 'snippet,id,status',
      requestBody: {
        snippet: {
          title,
          description: 'DV_IMPORTS',
        },
        status: {
          privacyStatus: 'unlisted'
        },
      },
      auth: oauth2Client
    })

    if (res.status !== 200) {
      process.exit(1)
    }
    console.log(JSON.stringify(res.data))
  }
})();
