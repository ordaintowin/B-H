import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import express, { Router, type IRouter } from "express";
import { requireAuth, requireRole } from "../middlewares/auth";

const router: IRouter = Router();
const uploadRoot = path.resolve(process.cwd(), ".data", "afrocart-uploads");
const pendingUploads = new Map<string, { contentType: string; size: number; createdAt: number }>();
const maxUploadSize = 6 * 1024 * 1024;

const isImageType = (value: string) => /^(image\/jpeg|image\/png|image\/webp|image\/gif)$/i.test(value);

async function ensureUploadRoot() {
  await mkdir(uploadRoot, { recursive: true });
}

router.post("/storage/uploads/request-url", requireAuth, requireRole("super_admin"), async (req, res) => {
  const body = req.body as Partial<{ name: string; size: number; contentType: string }> | undefined;
  if (
    !body ||
    typeof body.name !== "string" ||
    !body.name.trim() ||
    typeof body.size !== "number" ||
    !Number.isInteger(body.size) ||
    body.size < 1 ||
    body.size > maxUploadSize ||
    typeof body.contentType !== "string" ||
    !isImageType(body.contentType)
  ) {
    return res.status(400).json({ error: "Choose a JPG, PNG, WEBP, or GIF image under 6MB" });
  }

  await ensureUploadRoot();
  const token = randomUUID();
  pendingUploads.set(token, {
    contentType: body.contentType,
    size: body.size,
    createdAt: Date.now(),
  });

  return res.json({
    uploadURL: `/api/storage/upload-target/${token}`,
    objectPath: `/objects/${token}`,
    metadata: { name: body.name.trim(), size: body.size, contentType: body.contentType },
  });
});

router.put(
  "/storage/upload-target/:token",
  express.raw({ type: "*/*", limit: `${maxUploadSize}b` }),
  async (req, res) => {
    const token = req.params.token;
    const pending = pendingUploads.get(token);
    if (!pending || Date.now() - pending.createdAt > 15 * 60 * 1000) {
      pendingUploads.delete(token);
      return res.status(404).json({ error: "Upload session expired" });
    }

    const contentType = req.header("content-type") ?? "";
    const body = Buffer.isBuffer(req.body) ? req.body : Buffer.from([]);
    if (contentType !== pending.contentType || body.length < 1 || body.length > pending.size || body.length > maxUploadSize) {
      return res.status(400).json({ error: "Uploaded image does not match the requested file" });
    }

    await ensureUploadRoot();
    await writeFile(path.join(uploadRoot, token), body);
    await writeFile(path.join(uploadRoot, `${token}.meta.json`), JSON.stringify({ contentType }));
    pendingUploads.delete(token);
    return res.status(201).json({ objectPath: `/objects/${token}` });
  },
);

router.get("/storage/objects/:token", async (req, res) => {
  const token = req.params.token;
  if (!/^[0-9a-f-]{36}$/i.test(token)) return res.status(400).json({ error: "Invalid object path" });

  try {
    const [body, metadata] = await Promise.all([
      readFile(path.join(uploadRoot, token)),
      readFile(path.join(uploadRoot, `${token}.meta.json`), "utf8"),
    ]);
    const parsed = JSON.parse(metadata) as { contentType?: string };
    if (!parsed.contentType || !isImageType(parsed.contentType)) return res.status(404).end();
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return res.type(parsed.contentType).send(body);
  } catch {
    return res.status(404).json({ error: "Image not found" });
  }
});

export default router;