// Start to line 24 for the code demo

const fs = require("fs");
const textToSpeech = require("@google-cloud/text-to-speech");

async function textToSpeechMp3(text) {
  const client = new textToSpeech.TextToSpeechClient();

  const request = {
    input: {
      text,
    },
    voice: {
      languageCode: "en-US",
      ssmlGender: "NEUTRAL",
    },
    audioConfig: {
      audioEncoding: "MP3",
    },
  };

  const [response] = await client.synthesizeSpeech(request);
  return Buffer.from(response.audioContent).toString("base64");
}

async function writeTtsPreview(text, outputPath = "tts-test.mp3") {
  const base64 = await textToSpeechMp3(text);
  fs.writeFileSync(outputPath, Buffer.from(base64, "base64"));
  return outputPath;
}

module.exports = {
  textToSpeechMp3,
  writeTtsPreview,
};
