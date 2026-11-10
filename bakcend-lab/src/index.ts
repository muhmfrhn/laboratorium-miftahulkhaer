import { Hono } from "hono";
import { publicApi } from "./route/public-api";
import { privateApi } from "./route/api";
import { ResponseError } from "./error/response-error";
import { ZodError } from "zod";
import { cors } from 'hono/cors';

const app = new Hono();

const corsOrigins = (process.env.CORS_ORIGIN! || "http://localhost:5173")
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use('/api/*', cors({
  origin: corsOrigins.length > 0 ? corsOrigins : 'http://localhost:5173',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}));

// Healthcheck untuk Docker / reverse proxy (tanpa auth).
app.get('/health', (c) => c.json({ status: 'ok' }));
app.get('/api/health', (c) => c.json({ status: 'ok' }));

app.route("/", publicApi);
app.route("/", privateApi);

app.onError((err, c) => {
  if (err instanceof ResponseError) return c.json({ errors: err.message }, err.status as any);
  if (err instanceof ZodError) return c.json({ errors: err.issues }, 400);
  console.error(err);
  return c.json({ errors: "Internal Server Error" }, 500);
});

export default app;