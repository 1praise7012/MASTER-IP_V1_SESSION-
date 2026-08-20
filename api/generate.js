const { json, readBody, validatePhone } = require('../lib/auth')
const { startPairing } = require('../lib/pairing')

module.exports = async function generate(req, res) {
  if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'POST only' })

  try {
    const body = await readBody(req)
    const validated = validatePhone(body.phone)
    if (!validated.ok) return json(res, 400, { ok: false, error: validated.message })

    const record = await startPairing(validated.phone)
    return json(res, 200, {
      ok: true,
      id: record.id,
      phone: record.phone,
      status: record.status
    })
  } catch (err) {
    return json(res, 500, { ok: false, error: err.message })
  }
}
