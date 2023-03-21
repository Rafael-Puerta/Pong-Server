const express = require('express')
const fs = require('fs/promises')
const url = require('url')
const post = require('./post.js')
const { v4: uuidv4 } = require('uuid')

// Wait 'ms' milliseconds
function wait (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Start HTTP server
const app = express()

// Set port number
const port = process.env.PORT || 3000

// Activate HTTP server
const httpServer = app.listen(port, appListen)
function appListen () {
  //console.log(`Listening for HTTP queries on: http://localhost:${port}`)
}

// Run WebSocket server
const WebSocket = require('ws')
const wss = new WebSocket.Server({ server: httpServer })
const socketsClients = new Map()
console.log(`Listening for WebSocket queries on ${port}`)

// What to do when a websocket client connects
wss.on('connection', (ws) => {

  console.log("Client connected")

  // Add client to the clients list
  const id = uuidv4()
  // const color = Math.floor(Math.random() * 360)
  // const metadata = { id, color }
  if(socketsClients.has("pl1")){
    if(socketsClients.has("pl2")){
      ws.close();
    }else{

      socketsClients.set("pl2",ws)
      //TODO start game
      
    }

  }else{
    socketsClients.set("pl1",ws)
  }

  // Send clients list to everyone
  // sendClients()

  // What to do when a client is disconnected
  ws.on("close", () => {
    if(socketsClients.has("pl1")){
      if(socketsClients.has("pl2")){
        if(socketsClients.get("pl2").ws==ws){
          socketsClients.delete("pl2")
        }
      }
      if(socketsClients.get("pl1").ws==ws){
        socketsClients.delete("pl1")
      }
    }
    
  })

  // What to do when a client message is received
  ws.on('message', (bufferedMessage) => {
    var messageAsString = bufferedMessage.toString()
    var messageAsObject = {}
    
    try { messageAsObject = JSON.parse(messageAsString) } 
    catch (e) { console.log("Could not parse bufferedMessage from WS message") }

    if (messageAsObject.type == "bounce") {
      var rst = { type: "bounce", message: messageAsObject.message }
      ws.send(JSON.stringify(rst))
    } else if (messageAsObject.type == "broadcast") {
      var rst = { type: "broadcast", origin: id, message: messageAsObject.message }
      broadcast(rst)
    } else if (messageAsObject.type == "private") {
      var rst = { type: "private", origin: id, destination: messageAsObject.destination, message: messageAsObject.message }
      private(rst)
    }
  })
})

// Send clientsIds to everyone
// function sendClients () {
//   var clients = []
//   socketsClients.forEach((value, key) => {
//     clients.push(value.id)
//   })
//   wss.clients.forEach((client) => {
//     if (client.readyState === WebSocket.OPEN) {
//       var id = socketsClients.get(client).id
//       var messageAsString = JSON.stringify({ type: "clients", id: id, list: clients })
//       client.send(messageAsString)
//     }
//   })
// }

// Send a message to all websocket clients
async function broadcast (obj) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      var messageAsString = JSON.stringify(obj)
      client.send(messageAsString)
    }
  })
}

// Send a private message to a specific client
async function private (obj) {
  wss.clients.forEach((client) => {
    if (socketsClients.get(client).id == obj.destination && client.readyState === WebSocket.OPEN) {
      var messageAsString = JSON.stringify(obj)
      client.send(messageAsString)
      return
    }
  })
}

