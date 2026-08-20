const crypto = require('crypto')

const PREFIX = 'MASTER-IP~'

function encodeSession(payload) {
  const json = JSON.stringify(payload)
  return PREFIX + Buffer.from(json, 'utf8').toString('base64url')
}

function decodeSession(sessionId) {
  const raw = String(sessionId || '').trim()
  const value = raw.startsWith(PREFIX) ? raw.slice(PREFIX.length) : raw
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'))
}

function createToken(size = 16) {
  return crypto.randomBytes(size).toString('hex')
}

module.exports = {
  PREFIX,
  createToken,
  decodeSession,
  encodeSession
}
