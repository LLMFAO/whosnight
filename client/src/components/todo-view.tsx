import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

export default function TodoView() {
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({
    name: "",
    description: "",
    dueDate: "",
    assignedTo: "mom",
  });
  const queryClient = useQueryClient();

  const { data: tasks = [] } = useQuery({
    queryKey: ["/api/tasks"],
  });

  const { data: pendingItems } = useQuery({
    queryKey: ["/api/pending"],
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/tasks", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pending"] });
      setShowAddTaskModal(false);
      setTaskForm({ name: "", description: "", dueDate: "", assignedTo: "mom" });
    },
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await apiRequest("PUT", `/api/tasks/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pending"] });
    },
  });

  const toggleCompleteMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: number; completed: boolean }) => {
      return await apiRequest("PUT", `/api/tasks/${id}/complete`, { completed });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const acceptAllTasksMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/accept-all", { itemTypes: ["tasks"] });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pending"] });
    },
  });

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.name.trim()) return;

    createTaskMutation.mutate(taskForm);
  };

  const handleAcceptTask = (taskId: number) => {
    updateTaskStatusMutation.mutate({ id: taskId, status: "confirmed" });
  };

  const handleDeclineTask = (taskId: number) => {
    updateTaskStatusMutation.mutate({ id: taskId, status: "declined" });
  };

  const handleToggleComplete = (taskId: number, completed: boolean) => {
    toggleCompleteMutation.mutate({ id: taskId, completed: !completed });
  };

  const pendingTasksCount = pendingItems?.tasks?.length || 0;

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-100 z-10 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Shared To-Do</h1>
          <Button onClick={() => setShowAddTaskModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Accept All Banner */}
      {pendingTasksCount > 0 && (
        <div className="bg-blue-50 border-b border-blue-100 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-700">
              {pendingTasksCount} tasks need your review
            </span>
            <Button
              size="sm"
              onClick={() => acceptAllTasksMutation.mutate()}
              disabled={acceptAllTasksMutation.isPending}
            >
              Accept All
            </Button>
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="p-4 space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No tasks yet. Add your first task to get started!</p>
          </div>
        ) : (
          tasks.map((task: any) => (
            <div
              key={task.id}
              className={`bg-white border rounded-xl p-4 shadow-sm ${
                task.status === "pending" && task.createdBy !== 1 // Assuming current user ID is 1
                  ? "border-orange-200 border-dashed"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => handleToggleComplete(task.id, task.completed)}
                    className="w-5 h-5"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm font-medium ${
                    task.completed ? "text-gray-500 line-through" : "text-gray-900"
                  }`}>
                    {task.name}
                  </h3>
                  {task.description && (
                    <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                  )}
                  {task.dueDate && (
                    <p className="text-sm text-gray-500 mt-1">
                      Due: {format(new Date(task.dueDate), "MMMM d, yyyy")}
                    </p>
                  )}
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge
                      variant="outline"
                      className={
                        task.assignedTo === "mom"
                          ? "border-red-200 text-red-700 bg-red-50"
                          : "border-blue-200 text-blue-700 bg-blue-50"
                      }
                    >
                      Assigned to {task.assignedTo === "mom" ? "Mom" : "Dad"}
                    </Badge>
                    {task.status === "confirmed" && (
                      <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
                        Confirmed
                      </Badge>
                    )}
                    {task.completed && (
                      <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
                        Completed
                      </Badge>
                    )}
                  </div>
                </div>
                {task.status === "pending" && task.createdBy !== 1 && (
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-green-600 hover:text-green-700"
                      onClick={() => handleAcceptTask(task.id)}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeclineTask(task.id)}
                    >
                      Decline
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Task Modal */}
      <Dialog open={showAddTaskModal} onOpenChange={setShowAddTaskModal}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTaskSubmit} className="space-y-4">
            <div>
              <Label htmlFor="task-name">Task Name *</Label>
              <Input
                id="task-name"
                value={taskForm.name}
                onChange={(e) => setTaskForm({ ...taskForm, name: e.target.value })}
                placeholder="e.g., Pick up Emma from school"
                required
              />
            </div>
            <div>
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                placeholder="Additional details..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="task-due-date">Due Date</Label>
              <Input
                id="task-due-date"
                type="date"
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Assigned To</Label>
              <RadioGroup
                value={taskForm.assignedTo}
                onValueChange={(value) => setTaskForm({ ...taskForm, assignedTo: value })}
                className="flex space-x-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mom" id="assign-mom" />
                  <Label htmlFor="assign-mom">Mom</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dad" id="assign-dad" />
                  <Label htmlFor="assign-dad">Dad</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="flex space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddTaskModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createTaskMutation.isPending || !taskForm.name.trim()}
                className="flex-1"
              >
                {createTaskMutation.isPending ? "Adding..." : "Add Task"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
