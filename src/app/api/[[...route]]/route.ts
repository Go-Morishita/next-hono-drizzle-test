import { Hono } from 'hono';
import { handle } from 'hono/vercel';

export const runtime = "nodejs";

const app = new Hono().basePath('/api');

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

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);