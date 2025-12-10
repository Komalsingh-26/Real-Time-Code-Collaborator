const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const ACTIONS = require("./Actions");
const cors = require("cors");
//const axios = require("axios");
const server = http.createServer(app);
require("dotenv").config();

const languageConfig = {
  python3: { versionIndex: "3" },
  java: { versionIndex: "3" },
  cpp: { versionIndex: "4" },
  nodejs: { versionIndex: "3" },
  c: { versionIndex: "4" },
  ruby: { versionIndex: "3" },
  go: { versionIndex: "3" },
  scala: { versionIndex: "3" },
  bash: { versionIndex: "3" },
  sql: { versionIndex: "3" },
  pascal: { versionIndex: "2" },
  csharp: { versionIndex: "3" },
  php: { versionIndex: "3" },
  swift: { versionIndex: "3" },
  rust: { versionIndex: "3" },
  r: { versionIndex: "3" },
};

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const userSocketMap = {};
const getAllConnectedClients = (roomId) => {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => {
      return {
        socketId,
        username: userSocketMap[socketId],
      };
    }
  );
};

io.on("connection", (socket) => {
  // console.log('Socket connected', socket.id);
  socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
    userSocketMap[socket.id] = username;
    socket.join(roomId);
    const clients = getAllConnectedClients(roomId);
    // notify that new user join
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit(ACTIONS.JOINED, {
        clients,
        username,
        socketId: socket.id,
      });
    });
  });

  // sync the code
  socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
    socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
  });
  // when new user join the room all the code which are there are also shows on that persons editor
  socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
    io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  // leave room
  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms];
    // leave all the room
    rooms.forEach((roomId) => {
      socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
        socketId: socket.id,
        username: userSocketMap[socket.id],
      });
    });

    delete userSocketMap[socket.id];
    socket.leave();
  });
});

app.post("/compile", async (req, res) => {
  const { code, language } = req.body;

  try {
    const response = await axios.post("https://api.jdoodle.com/v1/execute", {
      script: code,
      language: language,
      versionIndex: languageConfig[language].versionIndex,
      clientId: process.env.jDoodle_clientId,
      clientSecret: process.env.kDoodle_clientSecret,
    });

    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to compile code" });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

// /**
//  * Expose `Emitter`.
//  */

// exports.Emitter = Emitter;

// /**
//  * Initialize a new `Emitter`.
//  *
//  * @api public
//  */

// function Emitter(obj) {
//   if (obj) return mixin(obj);
// }

// /**
//  * Mixin the emitter properties.
//  *
//  * @param {Object} obj
//  * @return {Object}
//  * @api private
//  */

// function mixin(obj) {
//   for (var key in Emitter.prototype) {
//     obj[key] = Emitter.prototype[key];
//   }
//   return obj;
// }

// /**
//  * Listen on the given `event` with `fn`.
//  *
//  * @param {String} event
//  * @param {Function} fn
//  * @return {Emitter}
//  * @api public
//  */

// Emitter.prototype.on =
// Emitter.prototype.addEventListener = function(event, fn){
//   this._callbacks = this._callbacks || {};
//   (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
//     .push(fn);
//   return this;
// };

// /**
//  * Adds an `event` listener that will be invoked a single
//  * time then automatically removed.
//  *
//  * @param {String} event
//  * @param {Function} fn
//  * @return {Emitter}
//  * @api public
//  */

// Emitter.prototype.once = function(event, fn){
//   function on() {
//     this.off(event, on);
//     fn.apply(this, arguments);
//   }

//   on.fn = fn;
//   this.on(event, on);
//   return this;
// };

// /**
//  * Remove the given callback for `event` or all
//  * registered callbacks.
//  *
//  * @param {String} event
//  * @param {Function} fn
//  * @return {Emitter}
//  * @api public
//  */

// Emitter.prototype.off =
// Emitter.prototype.removeListener =
// Emitter.prototype.removeAllListeners =
// Emitter.prototype.removeEventListener = function(event, fn){
//   this._callbacks = this._callbacks || {};

//   // all
//   if (0 == arguments.length) {
//     this._callbacks = {};
//     return this;
//   }

//   // specific event
//   var callbacks = this._callbacks['$' + event];
//   if (!callbacks) return this;

//   // remove all handlers
//   if (1 == arguments.length) {
//     delete this._callbacks['$' + event];
//     return this;
//   }

//   // remove specific handler
//   var cb;
//   for (var i = 0; i < callbacks.length; i++) {
//     cb = callbacks[i];
//     if (cb === fn || cb.fn === fn) {
//       callbacks.splice(i, 1);
//       break;
//     }
//   }

//   // Remove event specific arrays for event types that no
//   // one is subscribed for to avoid memory leak.
//   if (callbacks.length === 0) {
//     delete this._callbacks['$' + event];
//   }

//   return this;
// };

// /**
//  * Emit `event` with the given args.
//  *
//  * @param {String} event
//  * @param {Mixed} ...
//  * @return {Emitter}
//  */

// Emitter.prototype.emit = function(event){
//   this._callbacks = this._callbacks || {};

//   var args = new Array(arguments.length - 1)
//     , callbacks = this._callbacks['$' + event];

//   for (var i = 1; i < arguments.length; i++) {
//     args[i - 1] = arguments[i];
//   }

//   if (callbacks) {
//     callbacks = callbacks.slice(0);
//     for (var i = 0, len = callbacks.length; i < len; ++i) {
//       callbacks[i].apply(this, args);
//     }
//   }

//   return this;
// };

// // alias used for reserved events (protected method)
// Emitter.prototype.emitReserved = Emitter.prototype.emit;

// /**
//  * Return array of callbacks for `event`.
//  *
//  * @param {String} event
//  * @return {Array}
//  * @api public
//  */

// Emitter.prototype.listeners = function(event){
//   this._callbacks = this._callbacks || {};
//   return this._callbacks['$' + event] || [];
// };

// /**
//  * Check if this emitter has `event` handlers.
//  *
//  * @param {String} event
//  * @return {Boolean}
//  * @api public
//  */

// Emitter.prototype.hasListeners = function(event){
//   return !! this.listeners(event).length;
// };
// const express = require("express");
// const http = require("http");
// const cors = require("cors");
// const { Server } = require("socket.io");

// const app = express();
// app.use(cors());

// const server = http.createServer(app);

// const io = new Server(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"],
//   },
// });

// io.on("connection", (socket) => {
//   console.log(`🔵 User connected: ${socket.id}`);

//   socket.on("JOIN", ({ roomId, username }) => {
//     socket.join(roomId);
//     socket.username = username;

//     console.log(`👤 ${username} joined room: ${roomId}`);

//     const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
//       (id) => {
//         const clientSocket = io.sockets.sockets.get(id);
//         return { socketId: id, username: clientSocket.username };
//       }
//     );

//     // notify everyone in the room
//     io.to(roomId).emit("JOINED", {
//       clients,
//       username,
//       socketId: socket.id,
//     });
//   });

//   socket.on("SYNC_CODE", ({ code, socketId }) => {
//     io.to(socketId).emit("CODE_SYNC", code);
//   });

//   socket.on("disconnecting", () => {
//     for (const roomId of socket.rooms) {
//       socket.to(roomId).emit("DISCONNECTED", {
//         socketId: socket.id,
//         username: socket.username,
//       });
//     }
//   });

//   socket.on("disconnect", () => {
//     console.log(`🔴 User disconnected: ${socket.id}`);
//   });
// });

// server.listen(5000, () => {
//   console.log(`🚀 Server running on http://localhost:5000`);
// });

