// /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --no-first-run --no-default-browser-check --user-data-dir=$(mktemp -d -t 'chrome-remote_data_dir')

(async () => {
  const puppeteer = require('puppeteer-core')

  // const args = process.argv.slice(2)
  // const filepath = args[0]
  // const wsChromeEndpointurl = 'ws://127.0.0.1:9222/devtools/browser/213ac047-0827-41b8-a5c3-4067b3da6390'

  const args = process.argv.slice(2)

  const wsChromeEndpointurl = args[0]
  const filepath = args[1]
  const parts = filepath.split('/')
  const filename = parts.pop()
  const folder = parts.pop()

  const titlePrefix = folder.replace(/_/g, ' ')
  const timestampRE = /clip-(?<year>[0-9]{4})-(?<month>[0-9]{2})-(?<day>[0-9]{2})_(?<hour>[0-9]{2})-(?<min>[0-9]{2})-(?<sec>[0-9]{2}).+/

  const matches = timestampRE.exec(filename)

  const videoTitle = `${titlePrefix}: clip-${matches.groups['year']}-${matches.groups['month']}-${matches.groups['day']} ${matches.groups['hour']};${matches.groups['min']};${matches.groups['sec']}.dv`
  const recordingDate = `${matches.groups['year']}-${matches.groups['month']}-${matches.groups['day']}T${matches.groups['hour']}:${matches.groups['min']}:${matches.groups['sec']}Z`

  const d = new Date()
  d.setYear(Number(matches.groups['year']))
  d.setMonth(Number(matches.groups['month']) - 1)
  d.setDate(Number(matches.groups['day']))

  const dateStr = d.toDateString()
  const dateParts = dateStr.split(' ')
  const month = dateParts[1]

  const dateInputVal = `${month} ${Number(matches.groups['day'])}, ${matches.groups['year']}`

  const browser = await puppeteer.connect({ browserWSEndpoint: wsChromeEndpointurl, })
  const page = await browser.newPage()

  function delay(time) {
     return new Promise(function(resolve) { 
         setTimeout(resolve, time)
     });
  }

  await page.setViewport({ width: 1280, height: 800 })
  await page.goto('https://studio.youtube.com/channel/UC-gegEYz0XUc2Uhi0w4LfJw/videos/upload?d=ud&filter=%5B%5D&sort=%7B%22columnType%22%3A%22date%22%2C%22sortOrder%22%3A%22DESCENDING%22%7D')

  await page.waitForSelector("#select-files-button")
  
  const create = await page.$("#select-files-button")
  
  const [fileChooser] = await Promise.all([
    page.waitForFileChooser(),
    create.click(), // some button that triggers file selection
  ]);

  await fileChooser.accept([filepath])

  // 'Checks complete. No issues found.'

  const titleXPath = "//div[@aria-label='Add a title that describes your video (type @ to mention a channel)']"
  await page.waitForXPath(titleXPath)

  let [titleInput] = await page.$x(titleXPath)
  await titleInput.click({ clickCount: 3 })
  // await input.click({ clickCount: 3 })
  // await titleInput.focus()
  await page.keyboard.press('Backspace')

  await delay(1000)
  // console.log(`Typing title: ${videoTitle}`)
  await page.keyboard.type(videoTitle, {delay: 10})
  // console.log('done typing')
  await delay(1000)

  // console.log('clicking not made for kids')
  const mfkRadioXPath = "//tp-yt-paper-radio-button[@name='VIDEO_MADE_FOR_KIDS_NOT_MFK']"
  await page.waitForXPath(mfkRadioXPath)
  const [mfkRadio] = await page.$x(mfkRadioXPath)
  await mfkRadio.click()

  // console.log('clicking show more')
  const [showMoreDiv] = await page.$x("//div[@class='label style-scope ytcp-button' and contains(., 'Show more')]")
  await showMoreDiv.click()

  // console.log('opening recorded date')
  await page.waitForSelector('#recorded-date')
  const recordedDate = await page.$("#recorded-date")

  await recordedDate.click()

  
  // console.log('entering recorded date')
  const recordedDateInputXPath = "//tp-yt-paper-input[@aria-label='Enter date']"
  await page.waitForXPath(recordedDateInputXPath)
  const [recordedDateInput] = await page.$x(recordedDateInputXPath)

  await recordedDateInput.click({ clickCount: 3 })
  // await recordedDateInput.focus()

  await delay(1000)
  await page.keyboard.press('Backspace')
  await page.keyboard.press('Backspace')
  await page.keyboard.press('Backspace')
  await page.keyboard.press('Backspace')
  await page.keyboard.press('Backspace')
  await page.keyboard.press('Backspace')
  await page.keyboard.press('Backspace')
  await page.keyboard.press('Backspace')
  await page.keyboard.press('Backspace')
  await page.keyboard.press('Backspace')
  await page.keyboard.press('Backspace')
  await page.keyboard.press('Backspace')
  await page.keyboard.press('Backspace')
  await page.keyboard.type(dateInputVal, {delay: 10})
  await delay(1000)
  await page.keyboard.press('Enter')
  // await delay(1000)

  const urlXpath = "//a[@class='style-scope ytcp-video-info']"
  await page.$x(urlXpath)
  const [shareUrl] = await page.$x(urlXpath)
  const yourHref = await page.evaluate(anchor => anchor.getAttribute('href'), shareUrl)

  // console.log('clicking next')
  const nextButtonXPath ="//ytcp-button[@label='Next']"
  await page.waitForXPath(nextButtonXPath)
  const [nextButton] = await page.$x(nextButtonXPath)
  await nextButton.click()
  await nextButton.click()
  await nextButton.click()

  // console.log('clicking unlisted')
  const unlistedRadioXPath = "//tp-yt-paper-radio-button[@name='UNLISTED']"
  await page.waitForXPath(unlistedRadioXPath)
  const [unlistedRadio] = await page.$x(unlistedRadioXPath)
  await unlistedRadio.click()

// contains(., 'Upload complete') or contains(., 'Processing complete') or 
  // console.log('wait for completion')
  await page.waitForXPath("//span[@class='progress-label style-scope ytcp-video-upload-progress' and (contains(., 'Checks complete') or contains(., 'Checking'))]", { timeout: 0 })

  // console.log('closing window')
  const saveButtonXPath = "//ytcp-button[@id='done-button']"
  await page.waitForXPath(saveButtonXPath)
  const [saveButton] = await page.$x(saveButtonXPath)
  await saveButton.click()

  const shareUrlXPath = "//a[@id='share-url']"
  await page.waitForXPath(shareUrlXPath)
  // const [shareUrl] = await page.$x(shareUrlXPath)

  // const yourHref = await page.evaluate(anchor => anchor.getAttribute('href'), shareUrl)
  const result = {
    kind: "youtube#video",
    id: yourHref.split('/').pop()
  }
  console.log(JSON.stringify(result))

  await page.close()

  process.exit(0)
})();
