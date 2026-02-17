import { NewsController } from "controllers";
import { Router } from "express";
import { AuthMiddlewares } from "middlewares/auth.middleware";

const newsController = new NewsController();
const auth = new AuthMiddlewares();
const router = Router();

router.post(
  "/create-news",
  auth.authenticate,
  auth.authorizeGlobalRole(["ADMIN"]),
  (req, res) => newsController.createNews(req, res),
);
router.post("/create-comment", auth.authenticate, (req, res) =>
  newsController.createComment(req, res),
);
router.post("/create-impression/:newsId", auth.authenticate, (req, res) =>
  newsController.createImpression(req, res),
);
router.get("/all-news", (req, res) => newsController.findAllNews(req, res));
router.get("/all-comments/:newsId", (req, res) =>
  newsController.getAllComments(req, res),
);
router.get("/detail-news/:id", (req, res) =>
  newsController.findNewsById(req, res),
);

export default router;
