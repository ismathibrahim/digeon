// Setup express server
const express = require("express");
const app = express();
const path = require("path");
const http = require("http");
const server = http.createServer(app);
const socketio = require("socket.io");
const io = socketio(server);

const PORT = process.env.PORT || 3000;

server.listen(PORT, console.log(`Server running on port ${PORT}`));

// Routing
app.use(express.static(path.join(__dirname, "public")));

// Chatroom
let numUsers = 0;

io.on("connection", (socket) => {
  let addedUser = false;

  // When the client emits 'new message' this listens and executes
  socket.on("new message", (data) => {
    //Tell the client to execute 'new message'
    socket.broadcast.emit("new message", {
      username: socket.username,
      message: data,
    });
  });

  // When the client emits 'add user' this listens and execute
  socket.on("add user", (username) => {
    if (addedUser) return;

    // Store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    addedUser = true;
    socket.emit("join", { numUsers: numUsers });

    // Echo globally (to all clients) that a new user joined
    socket.broadcast.emit("user joined", {
      username: socket.username,
      numUsers: numUsers,
    });
  });

  // When the client emits 'typing', broadcast it to others
  socket.on("typing", () => {
    socket.broadcast.emit("typing", { username: socket.username });
  });

  // When the client emits 'stop typing', broadcast it to others
  socket.on("stop typing", () => {
    socket.broadcast.emit("stop typing", { username: socket.username });
  });

  // When the user disconnects
  socket.on("disconnect", () => {
    if (addedUser) {
      --numUsers;

      // Echo globally that this client has left
      socket.broadcast.emit("user left", {
        username: socket.username,
        numUsers: numUsers,
      });
    }
  });
});
