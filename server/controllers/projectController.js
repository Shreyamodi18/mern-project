import Project from "../models/Project.js";
import Workspace from "../models/Workspace.js";

// Helper to check if user belongs to a workspace
const isWorkspaceMember = (workspace, userId) =>
  workspace.members.some((m) => m.user.toString() === userId);

// @desc   Create a new project inside a workspace
// @route  POST /api/projects
export const createProject = async (req, res) => {
  try {
    const { name, description, workspaceId } = req.body;

    if (!name || !workspaceId) {
      return res.status(400).json({ message: "Name and workspaceId are required" });
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    if (!isWorkspaceMember(workspace, req.userId)) {
      return res.status(403).json({ message: "Not a member of this workspace" });
    }

    const project = await Project.create({
      name,
      description,
      workspace: workspaceId,
      createdBy: req.userId,
    });

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get all projects for a workspace
// @route  GET /api/projects/workspace/:workspaceId
export const getProjectsByWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    if (!isWorkspaceMember(workspace, req.userId)) {
      return res.status(403).json({ message: "Not a member of this workspace" });
    }

    const projects = await Project.find({ workspace: req.params.workspaceId });
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get a single project by id
// @route  GET /api/projects/:id
export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const workspace = await Workspace.findById(project.workspace);
    if (!isWorkspaceMember(workspace, req.userId)) {
      return res.status(403).json({ message: "Not a member of this workspace" });
    }

    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};