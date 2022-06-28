(async () => {
  require('dotenv').config()
  const { google } = require('googleapis')
  const youtubeData = google.youtube('v3')
  const fs = require('fs')
  const path = require('path')

  const args = process.argv.slice(2)

  const filepath = args[0]
  const parts = filepath.split('/')
  const filename = parts.pop()
  const folder = parts.pop()

  const titlePrefix = folder.replace(/_/g, ' ')
  const timestampRE = /clip-(?<year>[0-9]{4})-(?<month>[0-9]{2})-(?<day>[0-9]{2})_(?<hour>[0-9]{2})-(?<min>[0-9]{2})-(?<sec>[0-9]{2}).+/

  const matches = timestampRE.exec(filename)

  const videoTitle = `${titlePrefix}: clip-${matches.groups['date']} ${matches.groups['hour']};${matches.groups['min']};${matches.groups['sec']}.dv`
  const recordingDate = `${matches.groups['year']}-${matches.groups['month']}-${matches.groups['day']}T${matches.groups['hour']}:${matches.groups['min']}:${matches.groups['sec']}Z`

  // const res = await youtubeData['playlists'].list({
  //                     part: 'snippet,contentDetails',
  //                     mine: true,
  //                     auth: oauth2Client
  //                 })
  // console.log(res)

  const oauth2Client = new google.auth.OAuth2(process.env.CLIENT_ID, process.env.CLIENT_SECRET, `${process.env.BASE_URL}/services/youtube/connect/callback`)
  oauth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN
  })

  const res = await youtubeData['videos'].insert({
    part: 'recordingDetails,snippet,status',
    media: {
      body: fs.createReadStream(filepath)
    },
    autoLevels: true,
    notifySubscribers: false,
    stabilize: false,
    requestBody: {
      snippet: {
        title: videoTitle,
        description: '',
      },
      status: {
        selfDeclaredMadeForKids: false,
        privacyStatus: 'unlisted'
      },
      recordingDetails: {
        recordingDate
      }
    },
    auth: oauth2Client
  })

  if (res.status !== 200) {
    process.exit(1)
  }
  console.log(JSON.stringify(res.data))
})();
