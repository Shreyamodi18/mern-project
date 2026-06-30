import express from "express";
import { authGuard } from "../middleware/authGuard.js";
import {
  createTask,
  getTasksByProject,
  updateTask,
  moveTask,
  deleteTask,
  addComment,
} from "../controllers/taskController.js";

const router = express.Router();

router.use(authGuard);

router.post("/", createTask);
router.get("/project/:projectId", getTasksByProject);
router.patch("/:id", updateTask);
router.patch("/:id/move", moveTask);
router.delete("/:id", deleteTask);
router.post("/:id/comments", addComment);

export default router;