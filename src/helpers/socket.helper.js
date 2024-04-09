let logger = console;
const socket = {};
const chatService = require("../service/chat-service");
const environment = require("../environments/environment");
const jwt = require("jsonwebtoken");

socket.config = (server) => {
  const io = require("socket.io")(server, {
    transports: ["websocket", "polling"],
    cors: {
      origin: "*",
    },
  });
  socket.io = io;
  let onlineUsers = [];

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.Authorization.split(" ")[1];
      if (!token) {
        const err = new Error("Unauthorized Access");
        return next(err);
      }
      let decoded = jwt.decode(token);
      jwt.verify(token, environment.JWT_SECRET_KEY, async (err, user) => {
        if (err) {
          const err = new Error("Invalid or Expired Token");
          return next(err);
        }
        socket.user = decoded.user;
        // Function to join existing rooms
        const chatData = await chatService.getRoomsIds(socket.user.id);
        if (chatData) {
          for (const roomId of chatData.roomsIds) {
            const chat = roomId;
            socket.join(`${chat.roomId}`);
          }
          for (const groupId of chatData?.groupsIds) {
            const chat = groupId;
            socket.join(`${chat.groupId}`);
          }
        }
        socket.join(`${socket.user?.id}`);
        next();
      });
    } catch (error) {
      const err = new Error("Invalid or Expired Token");
      return next(err);
    }
  });

  io.sockets.on("connection", (socket) => {
    let address = socket.request.connection.remoteAddress;

    logger.info(`New Connection`, {
      address,
      id: socket.id,
    });
    socket.on("leave", (params) => {
      logger.info("leaved", {
        ...params,
        address,
        id: socket.id,
        method: "leave",
      });
      socket.leave(params.room);
    });

    socket.on("join", async (params) => {
      socket.join(params.room, {
        ...params,
      });
      logger.info("join", {
        ...params,
        address,
        id: socket.id,
        method: "join",
      });
    });

    // Call Socket //
    socket.on("start-call", async (params, cb) => {
      logger.info("start-call", {
        ...params,
        address,
        id: socket.id,
        method: "start-call",
      });
      try {
        if (params) {
          const data = await chatService.startCall(params);
          if (data?.notification) {
            if (params.groupId) {
              console.log("in=========>");
              io.to(`${params.groupId}`).emit("new-message", data.newMessage);
              if (data?.notification) {
                if (data?.notification) {
                  io.to(`${params.groupId}`).emit(
                    "notification",
                    data?.notification
                  );
                }
              }
            } else {
              console.log("in=========>");
              io.to(`${params.roomId}`).emit("new-message", data.newMessage);
              if (data?.notification) {
                if (data?.notification) {
                  io.to(`${params.roomId}`).emit(
                    "notification",
                    data?.notification
                  );
                }
              }
            }
            // for (const key in data?.notifications) {
            //   if (Object.hasOwnProperty.call(data?.notifications, key)) {
            //     const notification = data?.notifications[key];
            //     io.to(`${notification.notificationToProfileId}`).emit(
            //       "notification",
            //       notification
            //     );
            //   }
            // }
          }
        }
      } catch (error) {
        return cb(error);
      }
    });

    socket.on("decline-call", async (params, cb) => {
      logger.info("decile-call", {
        ...params,
        address,
        id: socket.id,
        method: "decline-call",
      });
      try {
        if (params) {
          const data = await chatService.declineCall(params);
          if (params?.roomId) {
            io.to(`${params?.roomId}`).emit("notification", data);
            return cb(true);
          } else if (params.groupId) {
            console.log("decline-group-calll===>>>>>>>>>>>>>>>>>>>>>", data);
            io.to(`${params?.groupId}`).emit("notification", data);
            return cb(true);
          }
        }
      } catch (error) {
        return cb(error);
      }
    });

    socket.on("pick-up-call", async (params, cb) => {
      logger.info("pick-up-call", {
        ...params,
        address,
        id: socket.id,
        method: "pick-up-call",
      });
      try {
        if (params) {
          const data = await chatService.pickUpCall(params);
          if (params?.roomId) {
            io.to(`${params?.roomId}`).emit("notification", data);
            return cb(true);
          } else {
            io.to(`${params?.notificationToProfileId}`).emit(
              "notification",
              data
            );
            return cb(true);
          }
        }
      } catch (error) {
        return cb(error);
      }
    });
  });
};

module.exports = socket;
