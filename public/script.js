const canvas = document.getElementById('matrix')
const ctx = canvas.getContext('2d')
const form = document.getElementById('pairForm')
const phone = document.getElementById('phone')
const generateBtn = document.getElementById('generateBtn')
const serverStatus = document.getElementById('serverStatus')
const pairCode = document.getElementById('pairCode')
const pairStatus = document.getElementById('pairStatus')
const sessionId = document.getElementById('sessionId')
const copyBtn = document.getElementById('copyBtn')

let pollTimer = null

function resizeMatrix() {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}

resizeMatrix()
window.addEventListener('resize', resizeMatrix)

const letters = 'MASTERIP0123456789'
let drops = []

function drawMatrix() {
  const fontSize = 15
  const columns = Math.ceil(canvas.width / fontSize)
  if (drops.length !== columns) drops = Array(columns).fill(1)

  ctx.fillStyle = 'rgba(4, 17, 31, 0.12)'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#28f0ff'
  ctx.font = `${fontSize}px monospace`

  for (let i = 0; i < drops.length; i++) {
    const text = letters[Math.floor(Math.random() * letters.length)]
    ctx.fillText(text, i * fontSize, drops[i] * fontSize)
    if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0
    drops[i]++
  }
}

setInterval(drawMatrix, 42)

async function api(path, options) {
  const res = await fetch(path, options)
  const data = await res.json()
  if (!res.ok || !data.ok) throw new Error(data.error || 'Request failed')
  return data
}

async function checkServer() {
  try {
    const data = await api('/api/status')
    serverStatus.textContent = `${data.name} online on ${data.node}`
  } catch (err) {
    serverStatus.textContent = err.message
  }
}

function setStatus(status, code) {
  pairStatus.textContent = status
  if (code) pairCode.textContent = code
}

async function pollSession(id) {
  try {
    const data = await api(`/api/session?id=${encodeURIComponent(id)}`)
    setStatus(data.status, data.code)

    if (data.error) pairStatus.textContent = data.error

    if (data.sessionId) {
      clearInterval(pollTimer)
      pollTimer = null
      sessionId.value = data.sessionId
      copyBtn.disabled = false
      generateBtn.disabled = false
      generateBtn.textContent = 'Generate'
      setStatus('Connected', data.code)
    }

    if (data.status === 'expired' || data.status === 'error') {
      clearInterval(pollTimer)
      pollTimer = null
      generateBtn.disabled = false
      generateBtn.textContent = 'Generate'
    }
  } catch (err) {
    pairStatus.textContent = err.message
  }
}

form.addEventListener('submit', async event => {
  event.preventDefault()
  clearInterval(pollTimer)
  sessionId.value = ''
  copyBtn.disabled = true
  generateBtn.disabled = true
  generateBtn.textContent = 'Generating'
  setStatus('Starting', 'Waiting')

  try {
    const data = await api('/api/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone: phone.value })
    })

    setStatus('Generating code', 'Waiting')
    pollTimer = setInterval(() => pollSession(data.id), 2200)
    await pollSession(data.id)
  } catch (err) {
    pairStatus.textContent = err.message
    generateBtn.disabled = false
    generateBtn.textContent = 'Generate'
  }
})

copyBtn.addEventListener('click', async () => {
  await navigator.clipboard.writeText(sessionId.value)
  copyBtn.textContent = 'Copied'
  setTimeout(() => {
    copyBtn.textContent = 'Copy'
  }, 1400)
})

checkServer()
