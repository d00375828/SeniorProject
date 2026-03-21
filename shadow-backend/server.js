const express = require("express");
const cors = require("cors");
require("./loadEnv");

const roleplayRoutes = require("./routes/roleplay");

const app = express();
const PORT = process.env.PORT || 3000;

console.log("Gemini key loaded:", !!process.env.GEMINI_API_KEY);
console.log(
  "Google credentials path loaded:",
  !!process.env.GOOGLE_APPLICATION_CREDENTIALS
);

app.use(cors());
app.use(express.json());

app.use("/roleplay", roleplayRoutes);

app.get("/", (_req, res) => {
  res.json({ message: "shadow-backend is running" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on port ${PORT}`);
});
