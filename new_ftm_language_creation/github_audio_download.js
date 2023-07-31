const https = require("https");
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const ffmpeg = require("fluent-ffmpeg");
// Configure your GitHub personal access token and repository details
const accessToken = "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";
const owner = "curiouslearning";
const repo = "ftm-languagepacks";
let currentDirectory = ""; // Path to the current directory
let languageDirectory = ""; // Path to the selected language directory

// Get the current directory where the script is located
const scriptDirectory = path.dirname(__filename);
const outputDirectory = path.join(scriptDirectory, "downloaded_audio"); // Output directory path
const mp3outputDirectory = path.join(scriptDirectory, "downloaded_mp3_audio");
// Create an interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to download a file
function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
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
    console.log("Select a folder:");
    for (let i = 0; i < folders.length; i++) {
      console.log(`${i + 1}. ${folders[i].name}`);
    }
    rl.question("Enter the number of the folder: ", (answer) => {
      const selectedIndex = parseInt(answer) - 1;
      if (selectedIndex >= 0 && selectedIndex < folders.length) {
        resolve(folders[selectedIndex].name);
      } else {
        reject(new Error("Invalid selection."));
      }
    });
  });
}

// Function to download audio files
async function downloadAudioFiles() {
  try {
    const folderPath = path.join(languageDirectory, currentDirectory);
    const files = await getDirectoryFiles(folderPath);

    // Create the output directory if it doesn't exist
    if (!fs.existsSync(outputDirectory)) {
      fs.mkdirSync(outputDirectory);
    }
    if (!fs.existsSync(mp3outputDirectory)) {
      fs.mkdirSync(mp3outputDirectory);
    }

    for (const file of files) {
      if (file.name.endsWith(".wav")) {
        const downloadUrl = file.download_url;
        const filePath = path.join(outputDirectory, file.name);
        const wavFilePath = path.join(outputDirectory, file.name);
        const mp3FilePath = path.join(
          mp3outputDirectory,
          `${path.basename(file.name, ".wav")}.mp3`
        );
        console.log(`Downloading: ${file.name}`);
        await downloadFile(downloadUrl, filePath);
        console.log(`Downloaded: ${file.name}`);
        console.log(`Converting to MP3: ${file.name}`);
        await convertToMP3(wavFilePath, mp3FilePath);
        console.log(
          `Converted to MP3: ${path.basename(file.name, ".wav")}.mp3`
        );
      }
    }

    console.log("All audio files downloaded successfully");
  } catch (error) {
    console.error("Error occurred while downloading audio files:", error);
  } finally {
    rl.close();
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
    currentDirectory = path.join(currentDirectory, selectedFolder);

    rl.question(
      "Do you want to download audio files from this folder? (yes/no): ",
      (answer) => {
        if (answer.toLowerCase() === "yes") {
          downloadAudioFiles();
        } else {
          selectFolder();
        }
      }
    );
  } catch (error) {
    console.error("Error occurred while retrieving folder list:", error);
    rl.close();
  }
}

// Function to handle language selection
async function selectLanguage() {
  try {
    const languages = await getDirectoryFolders("");
    console.log("Select a language:");

    for (let i = 0; i < languages.length; i++) {
      console.log(`${i + 1}. ${languages[i].name}`);
    }

    rl.question("Enter the number of the language: ", async (answer) => {
      const selectedIndex = parseInt(answer) - 1;
      if (selectedIndex >= 0 && selectedIndex < languages.length) {
        const selectedLanguage = languages[selectedIndex];
        languageDirectory = selectedLanguage.name;

        rl.question(
          "Do you want to download audio files from this language? (yes/no): ",
          (answer) => {
            if (answer.toLowerCase() === "yes") {
              downloadAudioFiles();
            } else {
              selectFolder();
            }
          }
        );
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
// Call the function to start selecting the language
selectLanguage();
