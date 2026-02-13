import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import Redis from "ioredis";
import { swaggerSpec, swaggerUiMiddleware } from "./config/swagger";

import router from "./routes/index";
import { startExpireJob } from "cron/expireJob";
import { initSocket } from "socket";

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const server = http.createServer(app);

initSocket(server);

startExpireJob();
app.use(
  "/api-docs",
  swaggerUiMiddleware.serve,
  swaggerUiMiddleware.setup(swaggerSpec),
);

app.use("/", router);

app.get("/", (req, res) => res.send({ message: "Server is running" }));

export { app, server, Redis };
