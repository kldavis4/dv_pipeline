require('dotenv/config')
const Koa = require('koa')
const fetch = require('isomorphic-fetch')

const app = new Koa()

const {
  CLIENT_ID,
  CLIENT_SECRET,
  PORT,
  SCOPE
} = process.env

const redirectUri = `http://localhost:${PORT}`

app.use(async (ctx) => {
  if (ctx.req.url === '/favicon.ico') {
    ctx.body = ''
    return
  }
  const code = ctx.req.url.split('&')[0].split('=').pop()
  ctx.body = 'DONE'

  const payload = JSON.stringify({
    code,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code'
  })

  fetch(`https://www.googleapis.com/oauth2/v3/token`, {
    body: payload,
    headers: {
      // Check what headers the API needs. A couple of usuals right below
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    method: 'POST'
  })
    .then(async function(response) {
      if (response.status >= 400) {
        throw new Error("Bad response from server");
      }

      return response.json();
    })
    .then(function(stories) {
      console.log('REFRESH_TOKEN', stories.refresh_token);
      process.exit(0)
    });
})

console.log(`Visit https://accounts.google.com/o/oauth2/auth?scope=${SCOPE}&redirect_uri=${redirectUri}&response_type=code&client_id=${CLIENT_ID}&access_type=offline&prompt=consent`)
if (!module.parent) {
  app.listen(3000)
}
