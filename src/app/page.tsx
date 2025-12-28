"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Todo = {
  id: number;
  title: string;
  done: boolean;
  createdAt: string | null;
};

const formatTimestamp = (value: string | null) => {
  if (!value) return "just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "recently";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadTodos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/todos", { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Failed to load tasks.");
      }
      const data: Todo[] = await res.json();
      setTodos(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTodos();
  }, [loadTodos]);

  const handleAddTodo = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = newTitle.trim();
    if (!title) {
      setError("Add a title before creating a task.");
      return;
    }

    try {
      setCreating(true);
      setError(null);
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Could not create the task.");
      }

      const created: Todo = await res.json();
      setTodos((prev) => [created, ...prev]);
      setNewTitle("");
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the task.");
    } finally {
      setCreating(false);
    }
  };

  const toggleTodo = async (todo: Todo) => {
    try {
      setTogglingId(todo.id);
      setError(null);
      const res = await fetch(
        `/api/todos/${todo.id}/${todo.done ? "undone" : "done"}`,
        { method: "PUT" },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Update failed.");
      }
      setTodos((prev) =>
        prev.map((item) =>
          item.id === todo.id ? { ...item, done: !item.done } : item,
        ),
      );
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the task.");
    } finally {
      setTogglingId(null);
    }
  };

  const deleteTodo = async (todo: Todo) => {
    if (!todo.done) return;
    try {
      setDeletingId(todo.id);
      setError(null);
      const res = await fetch(`/api/todos/${todo.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Delete failed.");
      }
      setTodos((prev) => prev.filter((item) => item.id !== todo.id));
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the task.");
    } finally {
      setDeletingId(null);
    }
  };

  const stats = useMemo(() => {
    const completed = todos.filter((todo) => todo.done).length;
    const active = todos.length - completed;
    return { completed, active };
  }, [todos]);

  const empty = !loading && todos.length === 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-12">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-700">
              Tasks
            </p>
            <h1 className="text-3xl font-semibold">Focus Board</h1>
            <p className="text-sm text-slate-600">
              Create tasks, check them off, and stay in sync with the API.
            </p>
          </div>
        </header>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-800">
              Open: {stats.active}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1">
              Done: {stats.completed}
            </span>
            <span className="text-slate-500">
              {lastUpdated
                ? `Last updated ${formatTimestamp(lastUpdated.toISOString())}`
                : "Syncing..."}
            </span>
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Add a task</h2>
          <form onSubmit={handleAddTodo} className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              id="todo-title"
              type="text"
              placeholder="e.g. Draft API release notes"
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60"
            >
              {creating ? "Saving..." : "Add"}
            </button>
          </form>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Your tasks</h2>
          {loading ? (
            <div className="mt-4 space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-12 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : empty ? (
            <div className="mt-6 rounded-lg border border-dashed border-slate-200 px-4 py-10 text-center text-slate-500">
              No tasks yet. Add your first item above.
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {todos.map((todo) => (
                <li
                  key={todo.id}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-3 transition hover:border-emerald-300"
                >
                  <button
                    type="button"
                    aria-label={todo.done ? "Mark as not done" : "Mark as done"}
                    onClick={() => void toggleTodo(todo)}
                    disabled={togglingId === todo.id}
                    className={`flex h-6 w-6 items-center justify-center rounded border text-sm font-semibold transition ${
                      todo.done
                        ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                        : "border-slate-300 bg-white text-slate-500 hover:border-emerald-400"
                    } ${togglingId === todo.id ? "opacity-60" : ""}`}
                  >
                    {todo.done ? "✓" : ""}
                  </button>
                  <div className="flex-1">
                    <p
                      className={`text-base ${
                        todo.done ? "text-slate-400 line-through" : "text-slate-900"
                      }`}
                    >
                      {todo.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      Created {formatTimestamp(todo.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => void deleteTodo(todo)}
                      disabled={!todo.done || deletingId === todo.id}
                      className="text-sm font-medium text-red-600 transition hover:text-red-700 disabled:opacity-50"
                    >
                      {deletingId === todo.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
