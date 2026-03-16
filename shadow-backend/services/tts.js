const fs = require("fs");
const textToSpeech = require("@google-cloud/text-to-speech");

async function runTest() {
  const client = new textToSpeech.TextToSpeechClient();

  const request = {
    input: {
      text: "Leo really loves barbies. He cant wait for his mom to bring one home from her trip",
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

  fs.writeFileSync("tts-test.mp3", response.audioContent, "binary");
  console.log("Wrote tts-test.mp3");
}

runTest().catch(console.error);
