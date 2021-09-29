const express = require('express')
const app = express()

const http = require('http').createServer(app)

const path = require('path')
const senderPath = path.join(__dirname, './sender')


app.use(express.static(senderPath))

http.listen(3001, () => {
  console.log('Sender : http://localhost:3001')
})