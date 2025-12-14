import express, {
  Request,
  Response,
  Application,
  NextFunction,
} from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import http from 'http';
import { createServer } from "http";
import { Server } from "socket.io";
import router from "./routes/index.router";
import { CustomError } from "./types";
import morgan from "morgan";

dotenv.config();
connectDB();

const app: Application = express();

const PORT =  Number(process.env.PORT) || 5000;
app.use(cors());
app.use(morgan("short"));
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.json({
    status: "success",
    message: "Welcome to Lets Go app",
  });
});

app.use("/api/v1", router);
app.use(
  (error: CustomError, req: Request, res: Response, next: NextFunction) => {
    const status = error.statusCode || 500;
    const message = error.message || "Internal server Error";
    console.log(`${status}: ${message}`);
    res.status(status).json({
      status: "error",
      message,
    });
  }
);
// API routes

// Socket.IO server
const httpServer = createServer(app);
export const onlineDrivers: Record<string, string> = {};
export const onlineRiders: Record<string, string> = {};
export const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Start
httpServer.listen(PORT, () => console.log(`Server running on ${PORT}`));
