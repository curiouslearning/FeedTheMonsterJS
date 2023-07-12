const https = require("https");
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const ffmpeg = require("fluent-ffmpeg");
const { get } = require("http");

// Configure your GitHub personal access token and repository details
const accessToken = "";
const owner = "curiouslearning";
const repo = "ftm-languagepacks";
let currentDirectory = ""; // Path to the current directory
let languageDirectory = ""; // Path to the selected language directory
let directoryStack = []; // Stack to track visited directories
let mp3outputDirectory;
let selectedLanguageDirectory;
let language;
let promptTexts;
let jsonPromptTexts;
// Create an interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Get the current directory where the script is located
const scriptDirectory = path.join(__dirname, "..", "lang");

async function main() {
  language = await promptForLanguageSelection();
  const uniquePromptTexts = await processModule(language);
  jsonPromptTexts = uniquePromptTexts;
  selectedLanguageDirectory = path.join(scriptDirectory, `${language}`);
  if (!fs.existsSync(selectedLanguageDirectory)) {
    fs.mkdirSync(selectedLanguageDirectory);
  }
  mp3outputDirectory = path.join(selectedLanguageDirectory, "audios");
  selectLanguage(uniquePromptTexts);
}
function processModule(language) {
  try {
    const modulePath = `../lang/${language}/ftm_${language}.json`;
    const module = require(modulePath);
    const promptTexts = findUniquePromptTexts(module);
    return promptTexts;
  } catch (error) {
    console.error("Error occurred while importing module:", error);
  }
}
function findUniquePromptTexts(obj, uniquePromptTexts = []) {
  if (typeof obj === "object" && obj !== null) {
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (key === "PromptAudio") {
          const parts = obj[key].split("/");
          const fileName = parts[parts.length - 1];
          const character = fileName.substring(0, fileName.lastIndexOf("."));

          const promptText = character;
          if (!uniquePromptTexts.includes(promptText)) {
            uniquePromptTexts.push(promptText);
          }
        }
        findUniquePromptTexts(obj[key], uniquePromptTexts);
      }
    }
  }
  return uniquePromptTexts;
}

// Function to prompt the user for language selection
function promptForLanguageSelection() {
  return new Promise((resolve) => {
    rl.question("Enter your language: ", (answer) => {
      resolve(answer.toLowerCase());
    });
  });
}

// Function to prompt the user for language selection
function promptForLanguageSelection() {
  return new Promise((resolve) => {
    rl.question("Enter your language: ", (answer) => {
      resolve(answer.toLowerCase());
    });
  });
}

// Function to download a file
function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(filePath)) {
      console.log(`Skipping download. File already exists: ${filePath}`);
      resolve();
      return;
    }
    const fileStream = fs.createWriteStream(filePath);
    https
      .get(url, (response) => {
        response.pipe(fileStream);
        fileStream.on("finish", () => {
          fileStream.close();
          resolve();
        });
      })
      .on("error", (err) => {
        fs.unlink(filePath, () => {
          reject(err);
        });
      });
  });
}

// Function to retrieve the list of folders in a directory
function getDirectoryFolders(directory) {
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${directory}`;
  const options = {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "DownloadScript",
    },
  };

  return new Promise((resolve, reject) => {
    https
      .get(apiUrl, options, (response) => {
        let data = "";
        response.on("data", (chunk) => {
          data += chunk;
        });
        response.on("end", () => {
          const contents = JSON.parse(data);
          const folders = contents.filter((item) => item.type === "dir");
          resolve(folders);
        });
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}

// Function to retrieve the list of files in a directory
function getDirectoryFiles(directory) {
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${directory}`;
  const options = {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "DownloadScript",
    },
  };

  return new Promise((resolve, reject) => {
    https
      .get(apiUrl, options, (response) => {
        let data = "";
        response.on("data", (chunk) => {
          data += chunk;
        });
        response.on("end", () => {
          const contents = JSON.parse(data);
          const files = contents.filter((item) => item.type === "file");
          resolve(files);
        });
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}

// Function to prompt the user for folder selection
function promptForFolderSelection(folders) {
  return new Promise((resolve, reject) => {
    console.log("Select a folder (or type 'back' to go back):");
    console.log("0. Back");
    for (let i = 0; i < folders.length; i++) {
      console.log(`${i + 1}. ${folders[i].name}`);
    }
    rl.question("Enter the number of the folder: ", (answer) => {
      if (answer.toLowerCase() === "back") {
        goBack();
      } else {
        const selectedIndex = parseInt(answer) - 1;
        if (selectedIndex === -1) {
          goBack();
        } else if (selectedIndex >= 0 && selectedIndex < folders.length) {
          resolve(folders[selectedIndex].name);
        } else {
          reject(new Error("Invalid selection."));
        }
      }
    });
  });
}

// Function to go back to the previous directory
function goBack() {
  if (directoryStack.length > 0) {
    currentDirectory = directoryStack.pop();
    selectFolder();
  } else {
    console.log("You are at the root directory.");
    selectFolder();
  }
}

// Function to download audio files
async function downloadAudioFiles(uniquePromptTexts) {
  try {
    const folderPath = path.join(languageDirectory, currentDirectory);
    const files = await getDirectoryFiles(folderPath);

    if (!fs.existsSync(mp3outputDirectory)) {
      fs.mkdirSync(mp3outputDirectory);
    }

    for (const file of files) {
      const downloadUrl = file.download_url;
      const mp3FilePath = path.join(
        mp3outputDirectory,
        `${path.basename(file.name, path.extname(file.name))}.mp3`
      );
      if (
        !fs.existsSync(mp3FilePath) &&
        jsonPromptTexts.includes(file.name.slice(0, file.name.lastIndexOf(".")))
      ) {
        const extension = path.extname(file.name).toLowerCase();
        if (extension === "wav") {
          console.log(`Converting to MP3: ${file.name}`);
          await convertToMP3(downloadUrl, mp3FilePath);
          console.log(
            `Converted to MP3: ${path.basename(file.name, ".wav")}.mp3`
          );
        } else {
          await downloadFile(downloadUrl, mp3FilePath);
        }
      }
    }

    console.log("All audio files converted to MP3 successfully");
    goBack();
  } catch (error) {
    console.error("Error occurred while converting audio files:", error);
  } finally {
  }
}

// Function to convert WAV to MP3
function convertToMP3(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .toFormat("mp3")
      .on("error", (err) => {
        reject(err);
      })
      .on("end", () => {
        resolve();
      })
      .save(outputPath);
  });
}

// Function to handle folder selection
async function selectFolder() {
  try {
    const folders = await getDirectoryFolders(
      path.join(languageDirectory, currentDirectory)
    );
    const selectedFolder = await promptForFolderSelection(folders);
    if (selectedFolder !== undefined) {
      directoryStack.push(currentDirectory); // Add current directory to the stack
      currentDirectory = path.join(currentDirectory, selectedFolder);
      rl.question(
        "Do you want to download audio files from this folder? (yes/no): ",
        (answer) => {
          if (answer.toLowerCase() === "yes") {
            downloadAudioFiles();
          } else if (answer.toLowerCase() === "no") {
            selectFolder();
          } else {
            goBack();
          }
        }
      );
    }
  } catch (error) {
    console.error("Error occurred while retrieving folder list:", error);
    rl.close();
  }
}

// Function to handle language selection
async function selectLanguage(uniquePromptTexts) {
  console.log(jsonPromptTexts);
  try {
    const languages = await getDirectoryFolders("");

    // Add an option to go back
    languages.unshift({ name: ".." });

    console.log("Select a language:");

    for (let i = 0; i < languages.length; i++) {
      console.log(`${i + 1}. ${languages[i].name}`);
    }

    rl.question("Enter the number of the language: ", async (answer) => {
      const selectedIndex = parseInt(answer) - 1;
      if (selectedIndex >= 0 && selectedIndex < languages.length) {
        const selectedLanguage = languages[selectedIndex];

        if (selectedLanguage.name === "..") {
          // Go back to the parent folder
          languageDirectory = "";
          selectLanguage();
        } else {
          languageDirectory = selectedLanguage.name;

          rl.question(
            "Do you want to download audio files from this language? (yes/no): ",
            (answer) => {
              if (answer.toLowerCase() === "yes") {
                downloadAudioFiles(uniquePromptTexts);
              } else {
                selectFolder();
              }
            }
          );
        }
      } else {
        console.error("Invalid selection.");
        rl.close();
      }
    });
  } catch (error) {
    console.error("Error occurred while retrieving language list:", error);
    rl.close();
  }
}
main();
