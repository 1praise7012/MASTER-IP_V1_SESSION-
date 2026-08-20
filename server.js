const fs = require('fs')
const http = require('http')
const path = require('path')
const generate = require('./api/generate')
const session = require('./api/session')
const status = require('./api/status')

const publicDir = path.join(__dirname, 'public')
const port = Number(process.env.PORT || 3000)

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg'
}

function serveFile(req, res) {
  const url = new URL(req.url, 'http://localhost')
  const requested = url.pathname === '/' ? '/index.html' : url.pathname
  const file = path.normalize(path.join(publicDir, requested))

  if (!file.startsWith(publicDir)) {
    res.statusCode = 403
    return res.end('Forbidden')
  }

  fs.readFile(file, (err, data) => {
    if (err) {
      res.statusCode = 404
      return res.end('Not found')
    }
    res.setHeader('content-type', types[path.extname(file)] || 'application/octet-stream')
    res.end(data)
  })
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/generate')) return generate(req, res)
  if (req.url.startsWith('/api/session')) return session(req, res)
  if (req.url.startsWith('/api/status')) return status(req, res)
  return serveFile(req, res)
})

server.listen(port, () => {
  console.log(`MASTER-IP Session running on http://localhost:${port}`)
})
