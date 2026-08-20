const fs = require('fs')
const path = require('path')
const pino = require('pino')
const {
  default: makeWASocket,
  useMultiFileAuthState,
  Browsers,
  DisconnectReason
} = require('baileys')
const {
  buildSessionId,
  createPairRecord,
  getAuthPath,
  getPairRecord,
  updatePairRecord
} = require('./session')

const activePairs = new Map()

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function readCreds(authPath) {
  const credsPath = path.join(authPath, 'creds.json')
  if (!fs.existsSync(credsPath)) return null
  return JSON.parse(fs.readFileSync(credsPath, 'utf8'))
}

async function finalizeSession(record, authPath, sock) {
  const current = getPairRecord(record.id)
  if (current?.sessionId) return true

  const creds = readCreds(authPath)
  if (!creds?.registered) return false

  const sessionId = buildSessionId(creds)
  updatePairRecord(record.id, {
    status: 'connected',
    sessionId,
    error: null
  })

  try {
    const ownJid = sock.user?.id
    if (ownJid) {
      await sock.sendMessage(ownJid, {
        text: [
          'MASTER-IP SESSION CONNECTED',
          '',
          'Your Session ID is ready.',
          '',
          sessionId,
          '',
          'Paste this into SESSION_ID in your bot .env file, or choose Paste Session ID when starting the bot.'
        ].join('\n')
      })
    }
  } catch (err) {
    updatePairRecord(record.id, {
      error: `Connected, but could not send Session ID message: ${err.message}`
    })
  }

  try {
    sock.end()
  } catch {}

  return true
}

async function startPairing(phone) {
  const record = createPairRecord(phone)
  const authPath = getAuthPath(record.id)

  const runner = runPairing(record, authPath).catch(err => {
    updatePairRecord(record.id, {
      status: 'error',
      error: err.message
    })
  }).finally(() => {
    setTimeout(() => activePairs.delete(record.id), 60000)
  })

  activePairs.set(record.id, runner)
  return record
}

async function runPairing(record, authPath) {
  const { state, saveCreds } = await useMultiFileAuthState(authPath)
  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    browser: Browsers.ubuntu('MASTER-IP Session'),
    printQRInTerminal: false,
    markOnlineOnConnect: false,
    syncFullHistory: false
  })

  sock.ev.on('creds.update', async () => {
    await saveCreds()
    await finalizeSession(record, authPath, sock)
  })

  sock.ev.on('connection.update', async update => {
    const reason = update.lastDisconnect?.error?.output?.statusCode || update.lastDisconnect?.error?.statusCode
    if (update.connection === 'open') {
      await finalizeSession(record, authPath, sock)
    }
    if (update.connection === 'close' && reason === DisconnectReason.loggedOut) {
      updatePairRecord(record.id, {
        status: 'error',
        error: 'WhatsApp logged this pairing out. Generate a new code.'
      })
    }
  })

  await wait(1200)
  const code = await sock.requestPairingCode(record.phone, 'MASTERIP')
  updatePairRecord(record.id, {
    status: 'code',
    code
  })

  setTimeout(() => {
    const creds = readCreds(authPath)
    if (!creds?.registered) {
      updatePairRecord(record.id, {
        status: 'expired',
        error: 'Pairing code expired. Generate a new one.'
      })
      try {
        sock.end()
      } catch {}
    }
  }, 1000 * 60 * 4)
}

module.exports = {
  startPairing
}
