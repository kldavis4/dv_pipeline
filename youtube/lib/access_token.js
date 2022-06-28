require('dotenv/config')
const fetch = require('isomorphic-fetch')

const {
  CLIENT_ID,
  CLIENT_SECRET,
  REFRESH_TOKEN,
  SCOPE
} = process.env

const fetchAccessToken = async () => {
  const payload = JSON.stringify({
    refresh_token: REFRESH_TOKEN,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: 'refresh_token'
  })

  return fetch(`https://www.googleapis.com/oauth2/v3/token`, {
    body: payload,
    headers: {
      // Check what headers the API needs. A couple of usuals right below
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    method: 'POST'
  })
    .then(async function (response) {
      if (response.status >= 400) {
        console.log(await response.json())
        throw new Error("Bad response from server");
      }

      return response.json();
    })
    .then(function (stories) {
      return stories
    });
}

fetchAccessToken().then(result => {
  console.log(result)
})
