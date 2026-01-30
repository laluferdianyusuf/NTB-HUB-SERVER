import { NewsController } from "controllers";
import { Router } from "express";

const newsController = new NewsController();
const router = Router();

router.post("/create-news", (req, res) => newsController.createNews(req, res));
router.get("/all-news", (req, res) => newsController.findAllNews(req, res));
router.get("/detail-news/:id", (req, res) =>
  newsController.findNewsById(req, res),
);

export default router;
