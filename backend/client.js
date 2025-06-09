const { io } = require("socket.io-client");

const socket = io("http://localhost:9099", {
  auth: {
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4NDQzZjc2OWM3MzIyM2FmZTFhYjI0MSIsImlhdCI6MTc0OTMwMzQ2NiwiZXhwIjoxNzQ5OTA4MjY2fQ.wROCZ_aukCv_5dFYVjpkE9U6_JvU5hl-r-tF-t3to9c"
  }
});

socket.on("connect", () => {
  console.log("✅ Connected:", socket.id);

  // Join a conversation
  socket.emit("join_conversation", "6844419fd7379a374534e455");

  // Send a message
  socket.emit("send_message", {
    conversationId: "6844419fd7379a374534e455",
    content: "Hello from Postman-like client!"
  });
});

socket.on("receive_message", (msg) => {
  console.log("📨 New Message:", msg);
});

socket.on("user_online", (user) => {
  console.log("🟢 User online:", user);
});

socket.on("user_offline", (user) => {
  console.log("🔴 User offline:", user);
});

socket.on("disconnect", () => {
  console.log("❌ Disconnected");
});
