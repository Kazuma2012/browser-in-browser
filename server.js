import express from 'express'
import puppeteer from 'puppeteer'
import { WebSocketServer } from 'ws'

const app = express()
app.use(express.static('public'))

let browser, page

async function setupBrowser() {
  browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 720 })
}

// --- 高速MJPEGストリーム ---
app.get('/stream', async (req, res) => {
  if (!page) await setupBrowser()

  res.writeHead(200, {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Content-Type': 'multipart/x-mixed-replace; boundary=frame'
  })

  let sending = true
  async function sendFrame() {
    if (!sending) return
    try {
      const img = await page.screenshot({ encoding: 'base64', type: 'jpeg', quality: 45 })
      res.write(`--frame\r\nContent-Type: image/jpeg\r\n\r\n${Buffer.from(img, 'base64')}\r\n`)
    } catch (e) {
      console.error(e)
    }
    setTimeout(sendFrame, 100) // 100msごとに送信
  }
  sendFrame()

  req.on('close', () => { sending = false })
})

// --- WebSocket操作 ---
const server = app.listen(process.env.PORT || 3000, () =>
  console.log('🚀 Running on port', process.env.PORT || 3000)
)
const wss = new WebSocketServer({ server })

wss.on('connection', async (ws) => {
  if (!browser) await setupBrowser()

  ws.on('message', async (msg) => {
    const data = JSON.parse(msg.toString())
    try {
      switch (data.type) {
        case 'navigate': await page.goto(data.url, { waitUntil: 'domcontentloaded' }); break
        case 'click': await page.mouse.click(data.x, data.y); break
        case 'mousemove': await page.mouse.move(data.x, data.y); break
        case 'scroll': await page.evaluate(y => window.scrollTo(0, y), data.scrollY); break
        case 'keydown': await page.keyboard.press(data.key); break
        case 'type': await page.keyboard.type(data.text); break
      }
    } catch (e) {
      console.error(e)
    }
  })
})
