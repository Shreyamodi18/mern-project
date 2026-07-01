import axiosInstance from "./axiosInstance";

export const createProject = (data) => axiosInstance.post("/projects", data);
export const getProjectsByWorkspace = (workspaceId) =>
  axiosInstance.get(`/projects/workspace/${workspaceId}`);