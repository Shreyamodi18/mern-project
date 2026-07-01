import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getProjectsByWorkspace, createProject } from "../api/projectApi";

const WorkspacePage = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects", workspaceId],
    queryFn: async () => {
      const { data } = await getProjectsByWorkspace(workspaceId);
      return data;
    },
  });

  const { mutate: createProj, isPending } = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      toast.success("Project created!");
      queryClient.invalidateQueries(["projects", workspaceId]);
      setShowModal(false);
      setForm({ name: "", description: "" });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create project");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createProj({ ...form, workspaceId });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm px-8 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate("/dashboard")}
          className="text-gray-500 hover:text-gray-800 text-sm"
        >
          ← Dashboard
        </button>
        <span className="text-gray-300">|</span>
        <h1 className="text-lg font-semibold text-gray-800">Projects</h1>
      </nav>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Projects</h2>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + New Project
          </button>
        </div>

        {isLoading ? (
          <p className="text-gray-500">Loading projects...</p>
        ) : projects?.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">No projects yet</p>
            <p className="text-sm mt-1">Create one to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects?.map((project) => (
              <div
                key={project._id}
                onClick={() => navigate(`/project/${project._id}`)}
                className="bg-white rounded-xl shadow-sm p-6 cursor-pointer hover:shadow-md transition border border-gray-100"
              >
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                  <span className="text-purple-600 font-bold text-lg">
                    {project.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-800">{project.name}</h3>
                {project.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {project.description}
                  </p>
                )}
                <div className="flex gap-2 mt-3 flex-wrap">
                  {project.columns.map((col) => (
                    <span
                      key={col}
                      className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                    >
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold mb-4">Create Project</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Project name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                required
              />
              <textarea
                placeholder="Description (optional)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
              />
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:underline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isPending ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspacePage;