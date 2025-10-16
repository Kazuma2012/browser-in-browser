const ws = new WebSocket(`wss://${window.location.host}`)
const overlay = document.getElementById('overlay')
const keyboard = document.getElementById('keyboard')
let scrollY = 0

// URL移動
document.getElementById('go').onclick = () => {
  const url = document.getElementById('url').value
  ws.send(JSON.stringify({ type: 'navigate', url }))
}

// マウスクリック
overlay.addEventListener('click', e => {
  const rect = overlay.getBoundingClientRect()
  ws.send(JSON.stringify({
    type: 'click',
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  }))
})

// マウス移動
overlay.addEventListener('mousemove', e => {
  const rect = overlay.getBoundingClientRect()
  ws.send(JSON.stringify({
    type: 'mousemove',
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  }))
})

// スクロール
overlay.addEventListener('wheel', e => {
  scrollY += e.deltaY
  ws.send(JSON.stringify({ type: 'scroll', scrollY }))
})

// テキスト入力（Enterで送信）
keyboard.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    ws.send(JSON.stringify({ type: 'type', text: keyboard.value }))
    keyboard.value = ''
  }
})
