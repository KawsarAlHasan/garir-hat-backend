const socketIo = require("socket.io");
const db = require("./db");

let io;
const users = {};

module.exports = {
  init: (server) => {
    io = socketIo(server, {
      cors: {
        origin: "*",
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        allowedHeaders: "Content-Type,Authorization",
      },
    });

    io.on("connection", async (socket) => {
      console.log("User connected:", socket.id);

      // Store userId with socket.id
      socket.on("userConnected", async (userId) => {
        users[userId] = socket.id;
        const uID = userId.slice(1);
        const type = userId.charAt(0);

        if (type == "u") {
          await db.execute("UPDATE users SET is_active = ? WHERE id = ?", [
            1,
            uID,
          ]);
        } else if (type == "v") {
          await db.execute("UPDATE vendors SET is_active = ? WHERE id = ?", [
            1,
            uID,
          ]);
        }
      });

      socket.on(
        "sendMessage",
        async ({ sender_id, receiver_id, message, vehicle_id }) => {
          try {
            const [result] = await db.execute(
              "INSERT INTO messages (sender_id, receiver_id, message, vehicle_id) VALUES (?, ?, ?, ?)",
              [sender_id, receiver_id, message, vehicle_id]
            );

            const newMessage = {
              id: result.insertId,
              sender_id,
              receiver_id,
              message,
              vehicle_id,
              created_at: new Date(),
            };

            // Send message only to receiver
            const receiverSocketId = users[receiver_id];
            if (receiverSocketId) {
              io.to(receiverSocketId).emit("receiveMessage", newMessage);
            }

            // Also send the message back to the sender
            io.to(users[sender_id]).emit("receiveMessage", newMessage);
          } catch (error) {
            console.error("Database Error:", error);
          }
        }
      );

      // Handle disconnect
      socket.on("disconnect", async () => {
        for (const userId in users) {
          if (users[userId] === socket.id) {
            delete users[userId]; // Remove disconnected user

            const uID = userId.slice(1);
            const type = userId.charAt(0);

            if (type === "u") {
              await db.execute("UPDATE users SET is_active = ? WHERE id = ?", [
                0,
                uID,
              ]);
            } else if (type === "v") {
              await db.execute(
                "UPDATE vendors SET is_active = ? WHERE id = ?",
                [0, uID]
              );
            }

            break;
          }
        }
      });
    });

    return io;
  },
  getIo: () => {
    if (!io) {
      throw new Error("Socket.io not initialized!");
    }
    return io;
  },
};
