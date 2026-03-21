const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const { convertM4aToWav } = require("../services/convert");
const { speechToText } = require("../services/stt");
const {
  generateRoleplayReply,
  generateSessionSummary,
} = require("../services/gemini");
const { textToSpeechMp3 } = require("../services/tts");

const router = express.Router();
const uploadsDir = path.resolve(__dirname, "..", "uploads");

fs.mkdirSync(uploadsDir, { recursive: true });

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
const upload = multer({ storage });

router.post(
  "/turn",
  (req, _res, next) => {
    console.log("[TURN] request started");
    next();
  },
  upload.single("audio"),
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
      overview: summary.overview || "",
      wins: Array.isArray(summary.wins) ? summary.wins : [],
      drills: Array.isArray(summary.drills) ? summary.drills : [],
      nextStep: summary.nextStep || "",
    });
  } catch (error) {
    console.error("[END] error:", error);
    res.status(500).json({ error: "Summary generation failed." });
  }
});

module.exports = router;
