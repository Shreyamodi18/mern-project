import axiosInstance from "./axiosInstance";

export const createWorkspace = (data) => axiosInstance.post("/workspaces", data);
export const getMyWorkspaces = () => axiosInstance.get("/workspaces");
export const inviteMember = (workspaceId, data) =>
  axiosInstance.post(`/workspaces/${workspaceId}/invite`, data);