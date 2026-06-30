import Workspace from "../models/Workspace.js";
import User from "../models/User.js";

// @desc   Create a new workspace
// @route  POST /api/workspaces
export const createWorkspace = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Workspace name is required" });
    }

    const workspace = await Workspace.create({
      name,
      owner: req.userId,
      members: [{ user: req.userId, role: "admin" }],
    });

    res.status(201).json(workspace);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get all workspaces for logged-in user
// @route  GET /api/workspaces
export const getMyWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      "members.user": req.userId,
    }).populate("owner", "name email avatar");

    res.status(200).json(workspaces);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Invite a member to a workspace
// @route  POST /api/workspaces/:id/invite
export const inviteMember = async (req, res) => {
  try {
    const { email, role } = req.body;
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    // Only admin can invite
    const requester = workspace.members.find(
      (m) => m.user.toString() === req.userId
    );
    if (!requester || requester.role !== "admin") {
      return res.status(403).json({ message: "Only admins can invite members" });
    }

    const userToInvite = await User.findOne({ email });
    if (!userToInvite) {
      return res.status(404).json({ message: "User with this email not found" });
    }

    const alreadyMember = workspace.members.some(
      (m) => m.user.toString() === userToInvite._id.toString()
    );
    if (alreadyMember) {
      return res.status(400).json({ message: "User is already a member" });
    }

    workspace.members.push({ user: userToInvite._id, role: role || "member" });
    await workspace.save();

    res.status(200).json(workspace);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};