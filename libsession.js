const fs = require('fs')
const path = require('path')
const { createToken, encodeSession } = require('./encrypt')

const rootDir = path.join(__dirname, '..')
const databaseDir = path.join(rootDir, 'database')
const authDir = path.join(databaseDir, 'auth')
const sessionsFile = path.join(databaseDir, 'sessions.json')

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function safeWriteJson(file, data) {
  ensureDir(path.dirname(file))
  const tmp = `${file}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2))
  fs.renameSync(tmp, file)
}

function readJson(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return fallback
  }
}

function getSessions() {
  ensureDir(databaseDir)
  return readJson(sessionsFile, {})
}

function saveSessions(data) {
  safeWriteJson(sessionsFile, data)
}

function createPairRecord(phone) {
  const requestId = createToken(8)
  const cleanPhone = String(phone || '').replace(/[^0-9]/g, '')
  const record = {
    id: requestId,
    phone: cleanPhone,
    status: 'starting',
    code: null,
    sessionId: null,
    error: null,
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
  const sessions = getSessions()
  sessions[requestId] = record
  saveSessions(sessions)
  return record
}

function updatePairRecord(id, patch) {
  const sessions = getSessions()
  if (!sessions[id]) return null
  sessions[id] = {
    ...sessions[id],
    ...patch,
    updatedAt: Date.now()
  }
  saveSessions(sessions)
  return sessions[id]
}

function getPairRecord(id) {
  return getSessions()[id] || null
}

function getAuthPath(id) {
  ensureDir(authDir)
  return path.join(authDir, id)
}

function buildSessionId(creds) {
  return encodeSession({
    type: 'baileys-creds',
    version: 1,
    createdAt: Date.now(),
    creds
  })
}

module.exports = {
  buildSessionId,
  createPairRecord,
  ensureDir,
  getAuthPath,
  getPairRecord,
  updatePairRecord
}
