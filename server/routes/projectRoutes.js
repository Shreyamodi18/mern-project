import express from "express";
import { authGuard } from "../middleware/authGuard.js";
import {
  createProject,
  getProjectsByWorkspace,
  getProjectById,
} from "../controllers/projectController.js";

const router = express.Router();

router.use(authGuard);

router.post("/", createProject);
router.get("/workspace/:workspaceId", getProjectsByWorkspace);
router.get("/:id", getProjectById);

export default router;