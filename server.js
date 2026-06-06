import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import generateCookingPlanHandler from "./api/generate-cooking-plan.js";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT) || 8000;
const host = process.env.HOST || "127.0.0.1";
const publicFiles = new Set(["/", "/index.html", "/package.json"]);
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

loadEnvFile();

const server = createServer(async (request, response) => {
  if (request.url === "/api/generate-cooking-plan" && request.method === "POST") {
    await handleApiRequest(request, response);
    return;
  }

  await serveStaticFile(request, response);
});

server.listen(port, host, () => {
  const hasKey = Boolean(process.env.OPENAI_API_KEY || process.env.GPT_API_KEY);
  console.log(`CookDay Planner running at http://${host}:${port}`);
  console.log(hasKey ? "GPT API key loaded on the server." : "No GPT API key found; app will use mock fallback.");
});

async function handleApiRequest(request, response) {
  let body;

  try {
    body = await readJsonBody(request);
  } catch {
    sendJson(response, 400, { error: "Invalid JSON body." });
    return;
  }

  await generateCookingPlanHandler(
    {
      method: request.method,
      body,
    },
    {
      status(statusCode) {
        return {
          json(payload) {
            sendJson(response, statusCode, payload);
          },
        };
      },
    }
  );
}

async function serveStaticFile(request, response) {
  const url = new URL(request.url, `http://${host}:${port}`);
  const pathname = decodeURIComponent(url.pathname);
  const normalizedPath = pathname === "/" ? "/index.html" : pathname;

  if (!publicFiles.has(normalizedPath) && !normalizedPath.startsWith("/src/")) {
    sendText(response, 404, "Not found");
    return;
  }

  const filePath = path.normalize(path.join(dirname, normalizedPath));

  if (!filePath.startsWith(dirname) || !existsSync(filePath)) {
    sendText(response, 404, "Not found");
    return;
  }

  try {
    const file = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": contentTypes[path.extname(filePath)] || "application/octet-stream",
    });
    response.end(file);
  } catch {
    sendText(response, 500, "Could not load file");
  }
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;

      if (body.length > 20000) {
        request.destroy();
        reject(new Error("Body too large"));
      }
    });

    request.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch (error) {
        reject(error);
      }
    });

    request.on("error", reject);
  });
}

function loadEnvFile() {
  const envPath = path.join(dirname, ".env");

  if (!existsSync(envPath)) {
    return;
  }

  const contents = readFileSync(envPath, "utf8");

  contents.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      return;
    }

    const [key, ...valueParts] = trimmed.split("=");
    const value = valueParts.join("=").replace(/^["']|["']$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function sendText(response, statusCode, text) {
  response.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
  response.end(text);
}
