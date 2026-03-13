const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();

async function runTest() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
  });

  const result = await model.generateContent(
    "Say hello and tell me a short joke."
  );
  console.log(result.response.text());
}

runTest().catch(console.error);
