let ws
let scrollY = 0

const overlay = document.getElementById('overlay')
const keyboard = document.getElementById('keyboard')
const goBtn = document.getElementById('go')
goBtn.disabled = true  // 接続前は無効化

// --- WebSocket接続関数（再接続対応） ---
function connectWS() {
  ws = new WebSocket(`wss://${window.location.host}`)

  ws.onopen = () => {
    console.log('✅ WebSocket接続成功')
    goBtn.disabled = false
  }

  ws.onclose = () => {
    console.warn('⚠️ WebSocket切断、1秒後に再接続...')
    goBtn.disabled = true
    setTimeout(connectWS, 1000)
  }

  ws.onerror = (e) => console.error('WebSocketエラー', e)

  ws.onmessage = (msg) => {
    // 今回は操作用なので、画像はimgタグが自動更新するMJPEG利用
  }
}

// --- 初回接続 ---
connectWS()

// --- URL移動 ---
goBtn.onclick = () => {
  const url = document.getElementById('url').value
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'navigate', url }))
  } else {
    console.warn('WebSocketがまだ接続されていません')
  }
}

// --- マウスクリック ---
overlay.addEventListener('click', e => {
  const rect = overlay.getBoundingClientRect()
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'click',
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }))
  }
})

// --- マウス移動 ---
overlay.addEventListener('mousemove', e => {
  const rect = overlay.getBoundingClientRect()
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'mousemove',
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }))
  }
})

// --- スクロール ---
overlay.addEventListener('wheel', e => {
  scrollY += e.deltaY
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'scroll', scrollY }))
  }
})

// --- キーボード入力（Enterで送信） ---
keyboard.addEventListener('keydown', e => {
  if (e.key === 'Enter' && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'type', text: keyboard.value }))
    keyboard.value = ''
  }
})
