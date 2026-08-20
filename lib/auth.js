function normalizePhone(phone) {
  return String(phone || '').replace(/[^0-9]/g, '')
}

function validatePhone(phone) {
  const clean = normalizePhone(phone)
  if (!clean) return { ok: false, message: 'Enter your WhatsApp number with country code.' }
  if (clean.length < 8 || clean.length > 16) return { ok: false, message: 'Use a valid number with country code, for example 26378xxxxxxx.' }
  return { ok: true, phone: clean }
}

function json(res, status, payload) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => {
      body += chunk
      if (body.length > 1024 * 128) {
        reject(new Error('Request body is too large.'))
        req.destroy()
      }
    })
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch {
        reject(new Error('Invalid JSON body.'))
      }
    })
    req.on('error', reject)
  })
}

module.exports = {
  json,
  readBody,
  validatePhone
}
