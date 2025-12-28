import { Hono } from 'hono';
import { handle } from 'hono/vercel';

import { db } from "@/db"
import { todos } from "@/db/schema"
import { desc, eq } from "drizzle-orm"


export const runtime = "nodejs";

const app = new Hono().basePath("/api");

app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

app.get('/hello', (c) => {
  const name = c.req.query("name") || "world";
  return c.json({ message: `Hello, ${name}!` });
});

app.post('/echo', async (c) => {
  const body = await c.req.json();
  return c.json({ echoed: body });
});

app.get('/todos', async (c) => {
  const allTodos = await db.select().from(todos).orderBy(desc(todos.id));
  return c.json(allTodos);
});

app.post('/todos', async (c) => {
  const body = (await c.req.json()) as { title: string };
  const title = (body.title || "").trim();
  if (!title) {
    return c.json({ error: "Title is required" }, 400);
  }

  const inserted = await db.insert(todos).values({ title }).returning();
  return c.json(inserted[0]);
});

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);