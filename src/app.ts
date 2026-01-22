import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import Redis from "ioredis";
import { swaggerSpec, swaggerUiMiddleware } from "./config/swagger";

import v1Router from "./routes/index";
import { startExpireJob } from "cron/expireJob";

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

startExpireJob();
app.use(
  "/api-docs",
  swaggerUiMiddleware.serve,
  swaggerUiMiddleware.setup(swaggerSpec),
);

app.use("/", v1Router);

app.get("/", (req, res) => res.send({ message: "Server is running" }));

export { app, server, io, Redis };
