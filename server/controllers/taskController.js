import Task from "../models/Task.js";
import Project from "../models/Project.js";
import Workspace from "../models/Workspace.js";

// Helper: check user has access to the project (via its workspace)
const checkProjectAccess = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) return { error: "Project not found", status: 404 };

  const workspace = await Workspace.findById(project.workspace);
  const isMember = workspace.members.some((m) => m.user.toString() === userId);
  if (!isMember) return { error: "Not a member of this workspace", status: 403 };

  return { project, workspace };
};

// @desc   Create a task
// @route  POST /api/tasks
export const createTask = async (req, res) => {
  try {
    const { title, description, projectId, column, priority, dueDate, assignees } = req.body;

    if (!title || !projectId) {
      return res.status(400).json({ message: "Title and projectId are required" });
    }

    const access = await checkProjectAccess(projectId, req.userId);
    if (access.error) return res.status(access.status).json({ message: access.error });

    const taskCount = await Task.countDocuments({ project: projectId, column: column || "To Do" });

    const task = await Task.create({
      title,
      description,
      project: projectId,
      column: column || "To Do",
      priority,
      dueDate,
      assignees,
      createdBy: req.userId,
      order: taskCount,
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get all tasks for a project (grouped board view)
// @route  GET /api/tasks/project/:projectId
export const getTasksByProject = async (req, res) => {
  try {
    const access = await checkProjectAccess(req.params.projectId, req.userId);
    if (access.error) return res.status(access.status).json({ message: access.error });

    const tasks = await Task.find({ project: req.params.projectId })
      .populate("assignees", "name email avatar")
      .populate("createdBy", "name email avatar")
      .sort({ order: 1 });

    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Update task (title, description, priority, dueDate, assignees)
// @route  PATCH /api/tasks/:id
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const access = await checkProjectAccess(task.project, req.userId);
    if (access.error) return res.status(access.status).json({ message: access.error });

    const allowedFields = ["title", "description", "priority", "dueDate", "assignees"];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) task[field] = req.body[field];
    });

    await task.save();
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Move task — change column and/or order (drag and drop)
// @route  PATCH /api/tasks/:id/move
export const moveTask = async (req, res) => {
  try {
    const { column, order } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const access = await checkProjectAccess(task.project, req.userId);
    if (access.error) return res.status(access.status).json({ message: access.error });

    task.column = column;
    task.order = order;
    await task.save();

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Delete a task
// @route  DELETE /api/tasks/:id
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const access = await checkProjectAccess(task.project, req.userId);
    if (access.error) return res.status(access.status).json({ message: access.error });

    await task.deleteOne();
    res.status(200).json({ message: "Task deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Add a comment to a task
// @route  POST /api/tasks/:id/comments
export const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: "Comment text is required" });

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const access = await checkProjectAccess(task.project, req.userId);
    if (access.error) return res.status(access.status).json({ message: access.error });

    task.comments.push({ user: req.userId, text });
    await task.save();

    const updatedTask = await Task.findById(task._id).populate("comments.user", "name avatar");
    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};