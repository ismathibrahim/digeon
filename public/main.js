const nameInput = document.querySelector(".name-input");
const messages = document.querySelector(".messages");
const messageInput = document.querySelector(".message-input");

const loginPage = document.querySelector(".login-page");
const chatPage = document.querySelector(".chat-page");

// Prompt for setting a username
let username;
let connected = false;
let typing = false;
let lastTypingTime;
let currentInput = nameInput;
nameInput.focus();

const socket = io();

const addParticipantsMessage = (data) => {
  let message = "";
  if (data.numUsers === 1) {
    message = `there's 1 participant`;
  } else {
    message = `there are ${data.numUsers} participants`;
  }
  log(message);
};

// Set the clients username
const setUsername = () => {
  username = nameInput.value.trim();

  // If the username is valid
  if (username) {
    loginPage.style.display = "none";
    chatPage.style.display = "flex";
    currentInput = messageInput;
    messageInput.focus();

    //Tell the server your name
    socket.emit("add user", username);
  }
};

// Send chat message
const sendMessage = () => {
  let message = messageInput.value;

  // If there is a non-empty message and a socket connection
  if (message && connected) {
    messageInput.value = "";
    addChatMessage({ username: username, message: message });
    socket.emit("new message", message);
  }
};

// Log a message
const log = (message) => {
  let logMessage = document.createElement("div");
  logMessage.classList.add("log");
  logMessage.textContent = message;
  addMessageElement(logMessage);
};

// Add the visual chat message to the message list
const addChatMessage = (data) => {
  let usernameDiv = document.createElement("span");
  usernameDiv.classList.add("username");
  usernameDiv.textContent = data.username;

  let messageBodyDiv = document.createElement("span");
  messageBodyDiv.classList.add("messageBody");
  messageBodyDiv.textContent = data.message;

  let messageDiv = document.createElement("div");
  messageDiv.classList.add("message");
  messageDiv.appendChild(usernameDiv);
  messageDiv.appendChild(messageBodyDiv);

  addMessageElement(messageDiv);
};

// Adds a message element to the messages and scrolls to the bottom
// @param element - the element to add as a message
const addMessageElement = (element) => {
  messages.appendChild(element);
  messages.scrollTop = messages.scrollHeight;
};

/* Keyboard Events */

window.addEventListener("keydown", (e) => {
  // Auto-focus the current input when a key is typed
  if (!(event.ctrlKey || event.metaKey || event.altKey)) {
    currentInput.focus();
  }
  // When the client hits ENTER on their keyboard
  if (e.keyCode === 13) {
    if (username) {
      sendMessage();
    } else {
      setUsername();
    }
  }
});

/* Click Events */

/* Socket Events */

// Whenever the server emits 'join', log the join message
socket.on("join", (data) => {
  connected = true;
  // Display the welcome message
  let message = "Welcome to Digeon";
  log(message);
  addParticipantsMessage(data);
});

// Whenever the server emits 'new message', update the chat body
socket.on("new message", (data) => addChatMessage(data));

// Whenever the server emits 'user joined', log it in the chat
socket.on("user joined", (data) => {
  log(`${data.username} joined`);
  addParticipantsMessage(data);
});

// Whenever the server emits 'user left', log it in the chat
socket.on("user left", (data) => {
  log(`${data.username} left`);
  addParticipantsMessage(data);
});

socket.on("disconnect", () => log("you have been disconnected"));

socket.on("reconnect", () => {
  log("you have been reconnected");
  if (username) {
    socket.emit("add user", username);
  }
});

socket.on("reconnect_error", () => log("attempt to reconnect has failed"));
