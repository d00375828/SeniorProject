const express = require("express");
const multer = require("multer");

const router = express.Router();

const upload = multer({ dest: "uploads/" });

router.post("/turn", upload.single("audio"), async (req, res) => {
  const config = JSON.parse(req.body.config);
  const history = JSON.parse(req.body.history);

  console.log("Config:", config);
  console.log("History:", history.length);
  console.log("Audio file:", req.file);

  res.json({
    userTranscript: "Mock transcript from backend",
    assistantText: "This is a backend response.",
    assistantAudioBase64: null,
    assistantAudioMimeType: "audio/mpeg",
  });
});

router.post("/end", async (req, res) => {
  const { config, history } = req.body;

  res.json({
    transcript: history
      .map((t) => `${t.role === "user" ? "You" : "Partner"}: ${t.text}`)
      .join("\n"),
    overview: "Good practice session.",
    wins: ["You stayed calm", "You gave structured answers"],
    drills: ["Slow your pacing", "Give more examples"],
    nextStep: "Run the scenario again.",
  });
});

module.exports = router;
