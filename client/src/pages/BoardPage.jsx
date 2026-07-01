import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import toast from "react-hot-toast";
import { getTasksByProject, createTask, moveTask } from "../api/taskApi";

const COLUMNS = ["To Do", "In Progress", "Review", "Done"];

const COLUMN_COLORS = {
  "To Do": "bg-gray-100",
  "In Progress": "bg-blue-50",
  "Review": "bg-yellow-50",
  "Done": "bg-green-50",
};

const PRIORITY_COLORS = {
  low: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

// Single Task Card
const TaskCard = ({ task }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing"
    >
      <p className="text-sm font-medium text-gray-800">{task.title}</p>
      {task.description && (
        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{task.description}</p>
      )}
      <div className="flex items-center justify-between mt-2">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority]}`}>
          {task.priority}
        </span>
        {task.dueDate && (
          <span className="text-xs text-gray-400">
            {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
};

// Column
const Column = ({ column, tasks, onAddTask }) => {
  return (
    <div className={`rounded-xl p-4 min-h-96 w-72 flex-shrink-0 ${COLUMN_COLORS[column]}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-700 text-sm">{column}</h3>
        <span className="bg-white text-gray-500 text-xs px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>
      <SortableContext
        items={tasks.map((t) => t._id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskCard key={task._id} task={task} />
          ))}
        </div>
      </SortableContext>
      <button
        onClick={() => onAddTask(column)}
        className="mt-3 w-full text-sm text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg py-2 transition text-left px-2"
      >
        + Add task
      </button>
    </div>
  );
};

// Main Board Page
const BoardPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTask, setActiveTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [targetColumn, setTargetColumn] = useState("To Do");
  const [form, setForm] = useState({ title: "", description: "", priority: "medium", dueDate: "" });

  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 5 },
  }));

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: async () => {
      const { data } = await getTasksByProject(projectId);
      return data;
    },
  });

  const { mutate: createT, isPending } = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      toast.success("Task created!");
      queryClient.invalidateQueries(["tasks", projectId]);
      setShowModal(false);
      setForm({ title: "", description: "", priority: "medium", dueDate: "" });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create task");
    },
  });

  const { mutate: moveT } = useMutation({
    mutationFn: ({ taskId, data }) => moveTask(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["tasks", projectId]);
    },
  });

  const getTasksByColumn = (column) =>
    tasks.filter((t) => t.column === column).sort((a, b) => a.order - b.order);

  const handleDragStart = (event) => {
    const task = tasks.find((t) => t._id === event.active.id);
    setActiveTask(task);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const draggedTask = tasks.find((t) => t._id === active.id);
    if (!draggedTask) return;

    // Find which column the task was dropped into
    let targetCol = null;
    for (const col of COLUMNS) {
      const colTasks = getTasksByColumn(col);
      if (col === over.id || colTasks.some((t) => t._id === over.id)) {
        targetCol = col;
        break;
      }
    }

    if (targetCol && targetCol !== draggedTask.column) {
      moveT({
        taskId: draggedTask._id,
        data: { column: targetCol, order: getTasksByColumn(targetCol).length },
      });
    }
  };

  const handleAddTask = (column) => {
    setTargetColumn(column);
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createT({ ...form, projectId, column: targetColumn });
  };

  if (isLoading) return <div className="p-8 text-gray-500">Loading board...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white shadow-sm px-8 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-500 hover:text-gray-800 text-sm"
        >
          ← Back
        </button>
        <span className="text-gray-300">|</span>
        <h1 className="text-lg font-semibold text-gray-800">Kanban Board</h1>
      </nav>

      {/* Board */}
      <div className="flex-1 overflow-x-auto p-8">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 min-w-max">
            {COLUMNS.map((col) => (
              <Column
                key={col}
                column={col}
                tasks={getTasksByColumn(col)}
                onAddTask={handleAddTask}
              />
            ))}
          </div>
          <DragOverlay>
            {activeTask && (
              <div className="bg-white rounded-lg p-3 shadow-lg border border-blue-200 w-72">
                <p className="text-sm font-medium text-gray-800">{activeTask.title}</p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Create Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold mb-1">Add Task</h3>
            <p className="text-sm text-gray-400 mb-4">Column: {targetColumn}</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Task title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                required
              />
              <textarea
                placeholder="Description (optional)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={2}
              />
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent</option>
              </select>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  {isPending ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardPage;