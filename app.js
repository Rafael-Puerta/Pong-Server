const express = require("express");
const fs = require("fs/promises");
const url = require("url");
const post = require("./post.js");
const { v4: uuidv4 } = require("uuid");
const utils = require("./functions/gameLogic.js");
const utilsdb = require('./functions/dbUtils.js');

// Wait 'ms' milliseconds
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Start HTTP server
const app = express();

// Set port number
const port = process.env.PORT || 3000;

// Activate HTTP server
const httpServer = app.listen(port, appListen);
function appListen() {
  //console.log(`Listening for HTTP queries on: http://localhost:${port}`)
}

// Run WebSocket server
const WebSocket = require("ws");
const wss = new WebSocket.Server({ server: httpServer });
const socketsClients = new Map();
console.log(`Listening for WebSocket queries on ${port}`);
// utils.run(30)
// What to do when a websocket client connects
wss.on("connection", (ws) => {
  console.log("Client connected");
  // Add client to the clients list
  const id = uuidv4();
  // const color = Math.floor(Math.random() * 360)
  // const metadata = { id, color }
  if (socketsClients.has("pl1")) {
    if (socketsClients.has("pl2")) {
      ws.close();
    } else {
      socketsClients.set("pl2", ws);
      socketsClients.set(ws, 2);
      ws.send(JSON.stringify({ type: "setPlayer", player: 2 }))
      //TODO start game
    }
  } else {
    socketsClients.set("pl1", ws);
    socketsClients.set(ws, 1);
    ws.send(JSON.stringify({ type: "setPlayer", player: 1 }))
  }
  var rst = { type: "connectionTest", message: "OK" };
  ws.send(JSON.stringify(rst));

  gameLoop();
  // Send clients list to everyone
  // sendClients()

  // What to do when a client is disconnected
  ws.on("close", () => {
  });

  // What to do when a client message is received
  ws.on("message", (bufferedMessage) => {
    var messageAsString = bufferedMessage.toString();
    var messageAsObject = {};
    try {
      messageAsObject = JSON.parse(messageAsString);
    } catch (e) {
      console.log("Could not parse bufferedMessage from WS message");
    }
    if (messageAsObject.type == "bounce") {
      var rst = { type: "bounce", message: messageAsObject.message };
      ws.send(JSON.stringify(rst));
    } else if (messageAsObject.type == "broadcast") {
      var rst = {
        type: "broadcast",
        origin: id,
        message: messageAsObject.message,
      };
      broadcast(rst);
    } else if (messageAsObject.type == "private") {
      var rst = {
        type: "private",
        origin: id,
        destination: messageAsObject.destination,
        message: messageAsObject.message,
      };
      private(rst);
    // Update players' movement state
    } else if (messageAsObject.type == "playerDirection") {
      utils.updateDirection(messageAsObject.player, messageAsObject.direction)
    } else if (messageAsObject.type == "kickBall") {
      utils.kickBall(messageAsObject.player)
    // Reset players data on disconnect
    } else if (messageAsObject.type == "disconnectPlayer") {
      utils.setPlayer(1, "", "")
      utils.setPlayer(2, "", "")
      utils.reset()
      socketsClients.delete("pl1")
      socketsClients.delete("pl2")
      socketsClients.delete(ws)
      broadcast({ type: "disconnect" })
      // }
      //  else if (messageAsObject.type == "setPlayerName") {
      //   console.log(messageAsObject.player, messageAsObject.name)
      //   utils.setPlayerName(messageAsObject.player, messageAsObject.name)

    } else if (messageAsObject.type == "login") {
      if (messageAsObject.user && messageAsObject.password) {
        utilsdb.login(messageAsObject.user, messageAsObject.password).then(
          (result) => {
            console.log("player:", socketsClients.get(ws));
            if (result) {
              var rst = { type: "login", message: 'OK', name:result.name, color:result.color };
              ws.send(JSON.stringify(rst));
            } else {
              var rst = { type: "login", message: 'KO' };
              ws.send(JSON.stringify(rst));
            }
          }
        )
      } else {
        var rst = { type: "login", message: 'KO' };
        ws.send(JSON.stringify(rst));
      }
    } else if (messageAsObject.type == "singup") {
      if (messageAsObject.user && messageAsObject.password && messageAsObject.color) {
        utilsdb.singup(messageAsObject.user, messageAsObject.password, messageAsObject.color).then(
          (result) => {
            if (result) {
              var rst = { type: "signup", message: 'OK', name:result.name, color:result.color };
              ws.send(JSON.stringify(rst));
            } else {
              var rst = { type: "signup", message: 'KO' };
              ws.send(JSON.stringify(rst));
            }
          })
      } else {
        var rst = { type: "signup", message: 'KO' };
        ws.send(JSON.stringify(rst));
      }

    // List all players
    } else if (messageAsObject.type == "listUsers") {
      var rst = { type: "listUser", message: 'KO' };
      utilsdb.list().then(
        (result) => {
          rst = { type: "listUser", message: 'OK', data: result };
          ws.send(JSON.stringify(rst));
        });

    // get stats of a single player
    } else if (messageAsObject.type == "stats") {
      var rst = { type: "stats", message: 'KO' };
      if (messageAsObject.user) {
        utilsdb.stats(messageAsObject.user).then((result) => {
          if (result) {
            rst = { type: "stats", message: 'OK', data: result };
          }
          ws.send(JSON.stringify(rst));
        })
      }

    // Set player data in gameLogic
    } else if (messageAsObject.type == "playerReady") {
      var rst = { type: "playerReady", message: 'KO' };
      if (messageAsObject.player && messageAsObject.username && messageAsObject.color) {
        utils.setPlayer(messageAsObject.player, messageAsObject.username, messageAsObject.color);
        rst = {type:"playerReady", message: "OK"}
        ws.send(JSON.stringify(rst));
      }
    }
  });
});

// Send a message to all websocket clients
async function broadcast(obj) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      var messageAsString = JSON.stringify(obj);
      client.send(messageAsString);
    }
  });
}

// Send a private message to a specific client
async function private(obj) {
  wss.clients.forEach((client) => {
    if (
      socketsClients.get(client).id == obj.destination &&
      client.readyState === WebSocket.OPEN
    ) {
      var messageAsString = JSON.stringify(obj);
      client.send(messageAsString);
      return;
    }
  });
}

const TARGET_FPS = 60;
const TARGET_MS = 1000 / TARGET_FPS;
let frameCount = 0;
let fpsStartTime = Date.now();
let currentFPS = 0;

// function that executes gameLogic every server frame
function gameLoop() {

  const startTime = new Date();

  if (currentFPS >= 1) {
    if (socketsClients.has("pl1")) {
      if (socketsClients.has("pl2")) {
        // if the players are online the game starts
        utils.run(currentFPS.toFixed(2));
        broadcast(utils.getRst());
      }
    }
  }

  const endTime = Date.now();
  const elapsedTime = endTime - startTime;
  const remainingTime = Math.max(1, TARGET_MS - elapsedTime);

  frameCount++;
  const fpsElapsedTime = endTime - fpsStartTime;
  if (fpsElapsedTime >= 500) {
    currentFPS = (frameCount / fpsElapsedTime) * 1000;
    frameCount = 0;
    fpsStartTime = endTime;
  }
  if (socketsClients.has("pl1") && socketsClients.has("pl2")) {
    setTimeout(() => {
      setImmediate(gameLoop);
    }, remainingTime);
  }
}
