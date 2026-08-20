const { json } = require('../lib/auth')

module.exports = async function status(req, res) {
  return json(res, 200, {
    ok: true,
    name: 'MASTER-IP Session',
    status: 'online',
    runtime: Math.floor(process.uptime()),
    node: process.version
  })
}
