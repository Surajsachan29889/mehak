import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"
import userroutes from "./routes/user.js"
import questionroutes from "./routes/question.js"
import answerroutes from "./routes/answer.js"


import http from 'http';
import { Server } from 'socket.io';

const app = express();
dotenv.config();
app.use(express.json({ limit: "30mb", extended: true }))
app.use(express.urlencoded({ limit: "30mb", extended: true }))

// Create an HTTP server using the Express app
const server = http.createServer(app);

// Initialize Socket.IO with the server instance
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000", // Use environment variable for production
        methods: ["GET", "POST"],
    },
});
app.use(cors());

app.set('socketio', io);


// Socket.IO connection event
io.on('connection', (socket) => {

  console.log('A user connected:', socket.id);

  // Join room for the user
  socket.on('join', (userId) => {
    console.log(`User with ID ${userId} joined the room.`);

      socket.join(userId);
  });

  socket.on('disconnect', () => {
      console.log('A user disconnected:', socket.id);
  });
});

// Export io to use it in other files
export default io;




app.use("/user", userroutes);
app.use('/questions', questionroutes)
app.use('/answer',answerroutes)
app.get('/', (req, res) => {
    res.send("Codequest is running perfect")
})

const PORT = process.env.PORT || 3000
const database_url = process.env.MONGODB_URL

mongoose.connect(database_url)
    .then(() => server.listen(PORT, () => { console.log(`server running on port ${PORT}`) }))
    .catch((err) => console.log(err.message))