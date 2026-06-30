import express from "express";
import { authGuard } from "../middleware/authGuard.js";
import {
  createWorkspace,
  getMyWorkspaces,
  inviteMember,
} from "../controllers/workspaceController.js";

const router = express.Router();

router.use(authGuard); // all routes below require login

router.post("/", createWorkspace);
router.get("/", getMyWorkspaces);
router.post("/:id/invite", inviteMember);

export default router;