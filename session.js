const { json } = require('../lib/auth')
const { getPairRecord } = require('../lib/session')

module.exports = async function session(req, res) {
  if (req.method !== 'GET') return json(res, 405, { ok: false, error: 'GET only' })

  const url = new URL(req.url, 'http://localhost')
  const id = url.searchParams.get('id')
  const record = getPairRecord(id)
  if (!record) return json(res, 404, { ok: false, error: 'Session request not found.' })

  return json(res, 200, {
    ok: true,
    id: record.id,
    phone: record.phone,
    status: record.status,
    code: record.code,
    sessionId: record.sessionId,
    error: record.error,
    updatedAt: record.updatedAt
  })
}
