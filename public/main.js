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
    loginPage.removeEventListener("click", () => currentInput.focus());
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
  removeChatTyping(data);

  let usernameDiv = document.createElement("span");
  usernameDiv.classList.add("username");
  usernameDiv.textContent = data.username;

  let messageBodyDiv = document.createElement("span");
  messageBodyDiv.classList.add("message-body");
  messageBodyDiv.textContent = data.message;

  let messageDiv = document.createElement("div");
  messageDiv.classList.add("message");
  messageDiv.appendChild(usernameDiv);
  messageDiv.appendChild(messageBodyDiv);

  // Username is current user, change it's style
  if (data.username === username) {
    messageDiv.classList.add("ownMessage");
  }

  if (data.typing) {
    messageDiv.classList.add("typing");
  }

  addMessageElement(messageDiv);
};

// Add visual chat typing message
const addChatTyping = (data) => {
  data.typing = true;
  data.message = "typing...";
  addChatMessage(data);
};

// Remove the visual chat typing message
const removeChatTyping = (data) => {
  // Get list of all typing messages
  typingMessages = document.querySelectorAll(".typing");

  // Filter typing messages to find this user's typing message
  typingMessages.forEach((element) => {
    if (element.firstChild.textContent === data.username) {
      element.remove();
    }
  });
};

// Adds a message element to the messages and scrolls to the bottom
const addMessageElement = (element) => {
  messages.appendChild(element);
  messages.scrollTop = messages.scrollHeight;
};

//Update the typing event
const updateTyping = () => {
  if (connected) {
    if (!typing) {
      typing = true;
      socket.emit("typing");
    }
    lastTypingTime = new Date().getTime();

    setTimeout(() => {
      let typingTimer = new Date().getTime();
      let timeDiff = typingTimer - lastTypingTime;
      if (timeDiff >= 500 && typing) {
        socket.emit("stop typing");
        typing = false;
      }
    }, 500);
  }
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

messageInput.addEventListener("keydown", () => {
  updateTyping();
});

/* Click Events */

// Focus input when clicking anywhere on login page
loginPage.addEventListener("click", () => currentInput.focus());

// Focus input when clicking anywhere on chat page
chatPage.addEventListener("click", () => currentInput.focus());

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

// Whenever the server emits 'typing', show the typing message
socket.on("typing", (data) => addChatTyping(data));

// Whenever the server emits 'stop typing', remove the typing message
socket.on("stop typing", (data) => removeChatTyping(data));

socket.on("disconnect", () => log("you have been disconnected"));

socket.on("reconnect", () => {
  log("you have been reconnected");
  if (username) {
    socket.emit("add user", username);
  }
});

socket.on("reconnect_error", () => log("attempt to reconnect has failed"));
