const fs = require("fs");
const speech = require("@google-cloud/speech");

async function runTest() {
  const client = new speech.SpeechClient();

  const fileName = "./shadow-practice.wav";
  const audioBytes = fs.readFileSync(fileName).toString("base64");

  const request = {
    audio: { content: audioBytes },
    config: {
      encoding: "LINEAR16",
      sampleRateHertz: 16000,
      languageCode: "en-US",
      enableAutomaticPunctuation: true,
    },
  };

  const [response] = await client.recognize(request);

  const transcript = response.results
    .map((result) => result.alternatives[0].transcript)
    .join("\n");

  console.log("Transcript:", transcript);
}

runTest().catch(console.error);
