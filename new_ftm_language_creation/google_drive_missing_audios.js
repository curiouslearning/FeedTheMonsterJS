const axios = require("axios");
const readline = require("readline");
const fs = require("fs");
const getMissingAudios = require("./get_missing_audios_from_drive");
function checkPromptAudioAvailability(language) {
  const jsonUrl = `https://feedthemonsterdev.curiouscontent.org/lang/${language}/ftm_${language}.json`;

  const uniqueUrls = new Set();
  const unavailableUrls = [];

  const checkAvailability = async (url) => {
    try {
      await axios.head(url);
    } catch (error) {
      unavailableUrls.push(url);
    }
  };

  const checkUrls = async (data) => {
    data.Levels.forEach((level) => {
      level.Puzzles.forEach((puzzle) => {
        const promptAudioUrl = puzzle.prompt.PromptAudio;
        if (!uniqueUrls.has(promptAudioUrl)) {
          uniqueUrls.add(promptAudioUrl);
        }
      });
    });

    const promptUrls = Array.from(uniqueUrls); // Convert Set to Array for iteration

    for (const url of promptUrls) {
      await checkAvailability(url);
    }

    // Optional: Save the unavailable URLs to a file
    fs.writeFileSync("unavailable_urls.txt", unavailableUrls.join("\n"));

    console.log("Check completed.");
    getMissingAudios(unavailableUrls);
  };

  axios
    .get(jsonUrl)
    .then((response) => {
      const data = response.data;
      checkUrls(data);
    })
    .catch((error) => {
      console.error("Error fetching JSON data:", error);
    });
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Enter the language: ", (language) => {
  checkPromptAudioAvailability(language);
  rl.close();
});
