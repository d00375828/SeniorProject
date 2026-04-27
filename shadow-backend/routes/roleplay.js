const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const { convertM4aToWav } = require("../services/convert");
const {
  buildPromptText,
  extractAttachmentText,
  validateAttachmentKind,
} = require("../services/context");
const { speechToText } = require("../services/stt");
const {
  generateRoleplayReply,
  generateSessionSummary,
} = require("../services/gemini");
const { textToSpeechMp3 } = require("../services/tts");

const router = express.Router();
const uploadsDir = path.resolve(__dirname, "..", "uploads");
const MAX_CONTEXT_FILE_SIZE_BYTES = 10 * 1024 * 1024;

fs.mkdirSync(uploadsDir, { recursive: true });

function buildId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const originalExtension = path.extname(file.originalname || "").toLowerCase();
    const safeExtension = originalExtension || ".bin";
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExtension}`);
  },
});
const uploadAudio = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
});
const uploadContext = multer({
  storage,
  limits: {
    fileSize: MAX_CONTEXT_FILE_SIZE_BYTES,
  },
});

function handleContextUploadError(error, req, res, next) {
  if (!error) {
    next();
    return;
  }

  if (req.file?.path && fs.existsSync(req.file.path)) {
    fs.unlinkSync(req.file.path);
  }

  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    res.status(400).json({
      error: "Context file is too large. Upload a file smaller than 10 MB.",
    });
    return;
  }

  res.status(400).json({
    error: error?.message || "Unable to upload that context file.",
  });
}

router.post(
  "/context",
  (req, _res, next) => {
    console.log("[CONTEXT] request started");
    next();
  },
  uploadContext.single("file"),
  handleContextUploadError,
  async (req, res) => {
    try {
      const kind = typeof req.body.kind === "string" ? req.body.kind.trim() : "";
      if (!validateAttachmentKind(kind)) {
        return res.status(400).json({
          error: "Invalid attachment kind. Use slides, instructions, rubric, or notes.",
        });
      }

      if (!req.file?.path) {
        return res.status(400).json({ error: "Missing context file upload." });
      }

      console.log("[CONTEXT] upload complete", {
        kind,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      });

      const extractedText = await extractAttachmentText(
        req.file.path,
        req.file.mimetype,
        req.file.originalname
      );

      if (!extractedText || extractedText.length < 20) {
        return res.status(400).json({ error: "No text could be extracted from that file." });
      }

      const promptText = buildPromptText(extractedText, kind);

      res.json({
        id: buildId("attachment"),
        name: req.file.originalname,
        mimeType: req.file.mimetype || "application/octet-stream",
        kind,
        extractedText,
        promptText,
      });
    } catch (error) {
      console.error("[CONTEXT] error:", error);
      res.status(500).json({
        error: error?.message || "Unable to process the uploaded context file.",
      });
    } finally {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    }
  }
);

router.post(
  "/turn",
  (req, _res, next) => {
    console.log("[TURN] request started");
    next();
  },
  uploadAudio.single("audio"),
  async (req, res) => {
  let wavPath = null;

  try {
    console.log("[TURN] upload complete");
    const config = JSON.parse(req.body.config || "{}");
    const history = JSON.parse(req.body.history || "[]");

    if (!req.file?.path) {
      return res.status(400).json({ error: "Missing audio upload." });
    }

    const inputPath = req.file.path;
    wavPath = path.join(uploadsDir, `${req.file.filename}.wav`);

    console.log("[TURN] config:", config);
    console.log("[TURN] history length:", history.length);
    console.log("[TURN] uploaded file:", inputPath);
    console.log("[TURN] upload metadata:", {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    await convertM4aToWav(inputPath, wavPath);
    console.log("[TURN] wav created:", wavPath);

    const userTranscript = await speechToText(wavPath);
    console.log("[TURN] transcript:", userTranscript);

    const assistantText = await generateRoleplayReply(
      config,
      history,
      userTranscript
    );
    console.log("[TURN] assistant text:", assistantText);

    const assistantAudioBase64 = await textToSpeechMp3(assistantText);
    console.log("[TURN] tts complete");

    res.json({
      userTranscript,
      assistantText,
      assistantAudioBase64,
      assistantAudioMimeType: "audio/mpeg",
    });
  } catch (error) {
    console.error("[TURN] error:", error);
    res.status(500).json({ error: "Turn processing failed." });
  } finally {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    if (wavPath && fs.existsSync(wavPath)) {
      fs.unlinkSync(wavPath);
    }
  }
});

router.post("/end", async (req, res) => {
  try {
    const { config = {}, history = [] } = req.body;

    const summary = await generateSessionSummary(config, history);

    res.json({
      transcript: history
        .map((t) => `${t.role === "user" ? "You" : "Partner"}: ${t.text}`)
        .join("\n"),
      ...summary,
    });
  } catch (error) {
    console.error("[END] error:", error);
    res.status(500).json({ error: "Summary generation failed." });
  }
});

module.exports = router;
