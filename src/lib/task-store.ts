import { useEffect, useState } from "react";
import { mockTasks, type Task, type TaskStatus } from "./mock-data";

let tasks: Task[] = [...mockTasks];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function getTasks() {
  return tasks;
}

export function addTask(prompt: string) {
  const title = prompt.length > 60 ? prompt.slice(0, 60) + "…" : prompt;
  const newTask: Task = {
    id: `tsk_${Date.now()}`,
    tenant_id: "tnt_001",
    title,
    prompt,
    status: "queued",
    created_at: new Date().toISOString(),
    estimated_credits: Math.floor(50 + Math.random() * 200),
    credits_used: 0,
  };
  tasks = [newTask, ...tasks];
  emit();
  return newTask;
}

export function useTasks() {
  const [snapshot, setSnapshot] = useState<Task[]>(tasks);
  useEffect(() => {
    const fn = () => setSnapshot([...tasks]);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return snapshot;
}

export function statusBadgeVariant(s: TaskStatus): "default" | "secondary" | "destructive" | "outline" {
  switch (s) {
    case "completed":
      return "default";
    case "failed":
      return "destructive";
    case "needs_approval":
      return "outline";
    default:
      return "secondary";
  }
}
