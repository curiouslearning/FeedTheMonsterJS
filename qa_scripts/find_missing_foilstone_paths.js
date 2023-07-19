const fs = require("fs");
const readline = require("readline");

let language;
let outputFilePath;
const uniqueLetters = [];
// Create a readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  language = await promptForLanguageSelection();
  const json = await processModule(language);
  const missingLetterPaths = findMissingLetter(json);
  outputFilePath = `${__dirname}/missing_foilstones_paths.txt`;

  fs.writeFile(outputFilePath, missingLetterPaths.join("\n"), "utf8", (err) => {
    if (err) {
      console.error(`Error writing to file: ${err.message}`);
    } else {
      console.log(`Missing Foilstone paths written to ${outputFilePath}`);
    }
    rl.close();
  });

  // Write the modified JSON back to the file
  const modifiedJSON = JSON.stringify(json, null, 2);
  const modulePath = `${__dirname}/../lang/${language}/ftm_${language}.json`;
  fs.writeFile(modulePath, modifiedJSON, "utf8", (err) => {
    if (err) {
      console.error(`Error writing modified JSON: ${err.message}`);
    } else {
      console.log("Modified JSON written to file.");
    }
  });
}

function findMissingLetter(obj, path = "", paths = []) {
  if (typeof obj === "object" && obj !== null) {
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newPath = path ? `${path}.${key}` : key;
        if (key === "FeedbackAudios" || key === "OtherAudios") {
          if (key === "FeedbackAudios" || key === "OtherAudios") {
            if (Array.isArray(obj[key])) {
              // Handle array of URLs
              const urlList = obj[key];
              const transformedUrls = urlList.map((url) => {
                let word = extractWordFromUrl(url);
                if (word === "fantastic1") {
                  word = word.replace("1", "");
                }
                return createTransformedUrl(word);
              });
              obj[key] = transformedUrls;
            } else if (typeof obj[key] === "object" && obj[key] !== null) {
              // Handle key-value pairs of strings and URLs
              const audioObject = obj[key];
              for (let audioKey in audioObject) {
                if (audioObject.hasOwnProperty(audioKey)) {
                  const url = audioObject[audioKey];
                  let word = extractWordFromUrl(url);
                  if (word === "great") {
                    word = word + "1";
                  }
                  const transformedUrl = createTransformedUrl(word);
                  audioObject[audioKey] = transformedUrl;
                }
              }
            }
          }
        }
        if (key === "PromptAudio") {
          const parts = obj[key].split("/");
          const fileName = parts[parts.length - 1];
          const character = fileName.substring(0, fileName.lastIndexOf("."));
          obj[key] = createTransformedUrl(character);
        }
        if (
          key === "StoneText" &&
          obj[key] != "MagnetLetter" &&
          key === "StoneText" &&
          obj[key] != null &&
          key === "StoneText" &&
          obj[key] != "" &&
          key === "StoneText" &&
          obj[key] != "FireWrongLetter"
        ) {
          if (!uniqueLetters.includes(obj[key]) && uniqueLetters.length <= 30) {
            console.log(obj[key]);
            uniqueLetters.push(obj[key]);
          }
        }
        if (
          !(key === "StoneText" && obj[key] === "MagnetLetter") &&
          !(key === "StoneText" && obj[key] === null) &&
          !(key === "StoneText" && obj[key] === "") &&
          !(key === "StoneText" && obj[key] === "FireWrongLetter")
        ) {
        } else {
          const randomIndex = Math.floor(Math.random() * uniqueLetters.length);
          obj[key] = uniqueLetters[randomIndex];
          paths.push(newPath);
        }
        findMissingLetter(obj[key], newPath, paths);
      }
    }
  }
  return paths;
}
function extractWordFromUrl(url) {
  return url.substring(url.lastIndexOf("/") + 1, url.lastIndexOf(".wav"));
}

function createTransformedUrl(word) {
  return `https://feedthemonster.curiouscontent.org/lang/${language}/audios/${word}.mp3`;
}
// Function to prompt the user for language selection
function promptForLanguageSelection() {
  return new Promise((resolve) => {
    rl.question("Enter your language: ", (answer) => {
      resolve(answer.toLowerCase());
    });
  });
}

function processModule(language) {
  try {
    const modulePath = `${__dirname}/../lang/${language}/ftm_${language}.json`;
    const module = require(modulePath);
    return module;
  } catch (error) {
    console.error("Error occurred while importing module:", error);
  }
}

// Start the main function
main();
