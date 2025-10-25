import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import { UserController } from "../controllers/user.controllers";

const app = express();
const userController = new UserController();

app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send({ message: "Successful" });
});

// Routes
app.get("/api/v1/users", userController.getAll);
app.get("/api/v1/get-user/:id", userController.getById);
app.post("/api/v1/create-users", userController.create);
app.put("/api/v1/update-user/:id", userController.update);
app.delete("/api/v1/delete-user/:id", userController.delete);

export default app;
