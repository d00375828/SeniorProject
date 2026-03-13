const express = require("express");

const router = express.Router();

router.get("/", (_req, res) => {
  res.json({ message: "roleplay route ready" });
});

module.exports = router;
