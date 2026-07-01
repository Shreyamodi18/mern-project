import axiosInstance from "./axiosInstance";

export const createTask = (data) => axiosInstance.post("/tasks", data);
export const getTasksByProject = (projectId) =>
  axiosInstance.get(`/tasks/project/${projectId}`);
export const updateTask = (taskId, data) =>
  axiosInstance.patch(`/tasks/${taskId}`, data);
export const moveTask = (taskId, data) =>
  axiosInstance.patch(`/tasks/${taskId}/move`, data);
export const deleteTask = (taskId) =>
  axiosInstance.delete(`/tasks/${taskId}`);
export const addComment = (taskId, data) =>
  axiosInstance.post(`/tasks/${taskId}/comments`, data);