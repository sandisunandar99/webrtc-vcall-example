const express = require('express')
const app = express()

const http = require('http').createServer(app)

const path = require('path')
const receiverPath = path.join(__dirname, './receiver')


app.use(express.static(receiverPath))

http.listen(3002, () => {
  console.log('Receiver : http://localhost:3002')
})