const axios = require("axios");
const readline = require("readline");
const fs = require("fs");
const { google } = require("googleapis");
const path = require("path");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");

const SCOPES = ["https://www.googleapis.com/auth/drive"];
const credentials = require("./credentials.json");
let languageFolderId = [];
let textCharacter;
const langFolderPath = path.join(__dirname, "..", "lang");
let languageFolderPath;
let audiosFolderPath;

async function checkPromptAudioAvailability(language) {
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
    await getMissingAudios(unavailableUrls);
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
  languageFolderPath = path.join(langFolderPath, language);
  if (!fs.existsSync(languageFolderPath)) {
    fs.mkdirSync(languageFolderPath);
  }
  audiosFolderPath = path.join(languageFolderPath, "audios");
  if (!fs.existsSync(audiosFolderPath)) {
    fs.mkdirSync(audiosFolderPath);
  }
  checkPromptAudioAvailability(language);
});
async function getMissingAudios(urls) {
  try {
    const missingAudios = urls.map((url) => {
      const fileName = url.substring(url.lastIndexOf("/") + 1); // Extract the file name with extension
      const audioName = fileName.substring(0, fileName.lastIndexOf(".")); // Extract the audio name without extension
      return audioName;
    });
    await checkInDrive(missingAudios);
  } catch (error) {}
}
function authenticate() {
  return new Promise((resolve, reject) => {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );

    fs.readFile("token.json", (err, token) => {
      if (err) {
        getAccessToken(oAuth2Client)
          .then((newToken) => resolve(newToken))
          .catch((error) => reject(error));
      } else {
        oAuth2Client.setCredentials(JSON.parse(token));
        resolve(oAuth2Client);
      }
    });
  });
}

function getAccessToken(oAuth2Client) {
  return new Promise((resolve, reject) => {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
    });

    console.log("Authorize this app by visiting the following URL:");
    console.log(authUrl);

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question("Enter the authorization code: ", (code) => {
      oAuth2Client.getToken(code, (err, token) => {
        if (err) {
          reject("Error retrieving access token:", err);
        }

        oAuth2Client.setCredentials(token);

        fs.writeFile("token.json", JSON.stringify(token), (error) => {
          if (error) {
            console.error("Error writing token to file:", error);
          }

          console.log("Token stored to token.json");

          resolve(oAuth2Client);
        });
      });
    });
  });
}
async function listFilesAndFolders(auth, parentFolderId) {
  const drive = google.drive({ version: "v3", auth });
  languageFolderId.push(parentFolderId);
  const folderOptions = {
    q: `'${parentFolderId}' in parents and trashed=false`,
    fields: "files(id, name, mimeType)",
  };

  try {
    const response = await drive.files.list(folderOptions);
    const filesAndFolders = response.data.files;

    console.log("Files and folders in the parent folder:");
    let count = 1;
    for (const item of filesAndFolders) {
      const { id, name, mimeType } = item;

      if (mimeType === "application/vnd.google-apps.folder") {
        console.log(`[${count}] ${name} (${id})`);
      } else {
        console.log(`[${count}] ${name} (${id})`);
      }
      count++;
    }

    const selectedFolderNumber = await new Promise((resolve) => {
      rl.question(
        "Enter the number of the selected folder or file (or 'back' to go back): ",
        (answer) => {
          resolve(answer);
        }
      );
    });

    if (selectedFolderNumber.toLowerCase() === "back") {
      let folderId = languageFolderId[languageFolderId.length - 2];
      languageFolderId.pop();
      return await listFilesAndFolders(auth, folderId); // Return the recursive call
    }

    const selectedIndex = parseInt(selectedFolderNumber) - 1;
    if (
      isNaN(selectedIndex) ||
      selectedIndex < 0 ||
      selectedIndex >= filesAndFolders.length
    ) {
      console.error("Invalid folder number. Please try again.");
      return;
    }

    const selectedFolder = filesAndFolders[selectedIndex];
    console.log(`Selected item: ${selectedFolder.name} (${selectedFolder.id})`);

    const downloadConfirmation = await new Promise((resolve) => {
      rl.question(
        "Do you want to check from the contents of this folder? (yes/no): ",
        (answer) => {
          resolve(answer.toLowerCase());
        }
      );
    });

    if (downloadConfirmation === "yes") {
      return selectedFolder.id;
    }
    return await listFilesAndFolders(auth, selectedFolder.id); // Return the recursive call
  } catch (error) {
    console.error("Error listing files and folders:", error);
  }
}

async function getFolderContents(auth, folderId) {
  const drive = google.drive({ version: "v3", auth });
  const newFolderId = await listFilesAndFolders(auth, folderId);
  const folderOptions = {
    q: `'${newFolderId}' in parents and trashed=false`,
    fields: "files(id, name, mimeType)",
  };

  const response = await drive.files.list(folderOptions);
  const files = response.data.files;

  return files.map((file) => {
    const { id, name, mimeType } = file;
    return { id, name, mimeType };
  });
}

async function askQuestion(question) {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Function to download a file
async function downloadFile(auth, fileId, name, destinationPath) {
  const drive = google.drive({ version: "v3", auth });
  const { ext } = path.parse(name);
  let fileExtension = ext.toLowerCase();
  let fileName;
  if (textCharacter != "no") {
    fileName = name.split(textCharacter)[0] + fileExtension;
  } else {
    fileName = name;
  }

  const filePath = path.join(audiosFolderPath, fileName);
  if (fs.existsSync(filePath)) {
    console.log("Skipping");
    return;
  }

  const fileOptions = {
    fileId,
    alt: "media",
  };

  const response = await drive.files.get(fileOptions, {
    responseType: "stream",
  });

  const contentType = response.headers["content-type"];
  if (contentType === "audio/mp3" || contentType === "audio/mpeg") {
    const dest = fs.createWriteStream(filePath);

    response.data
      .on("end", () => {
        console.log(`MP3 file downloaded: ${filePath}`);
      })
      .on("error", (err) => {
        console.error("Error downloading MP3 file:", err);
      })
      .pipe(dest);
  } else if (contentType === "audio/wav" || contentType === "audio/x-wav") {
    const wavFolderPath = path.join(__dirname, "wav");
    if (!fs.existsSync(wavFolderPath)) {
      fs.mkdirSync(wavFolderPath);
    }
    const wavFilePath = path.join(wavFolderPath, fileName);

    response.data
      .on("end", () => {
        console.log(`WAV file downloaded: ${wavFilePath}`);
        const mp3FilePath = path.join(
          audiosFolderPath,
          fileName.replace(".wav", ".mp3")
        );
        convertWavToMp3(wavFilePath, mp3FilePath)
          .then(() => {
            console.log(`MP3 file converted: ${mp3FilePath}`);
            fs.unlinkSync(wavFilePath); // Remove the original WAV file
            fs.rmdirSync(wavFolderPath); // Remove the temporary WAV folder
          })
          .catch((error) => {
            console.error("Error converting WAV to MP3:", error);
          });
      })
      .on("error", (err) => {
        console.error("Error downloading WAV file:", err);
      })
      .pipe(fs.createWriteStream(wavFilePath));
  } else {
    console.log(`Skipping file: ${fileName} (unsupported file type)`);
  }
}
function convertWavToMp3(inputFilePath, outputFilePath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputFilePath)
      .noVideo()
      .audioCodec("libmp3lame")
      .outputOptions("-qscale:a", "2")
      .save(outputFilePath)
      .on("end", () => {
        console.log(`WAV file converted and saved as MP3: ${outputFilePath}`);
        fs.unlinkSync(inputFilePath); // Delete the original WAV file
        resolve();
      })
      .on("error", (err) => {
        console.error("Error converting WAV to MP3:", err);
        reject(err);
      });
  });
}
async function TextBreakerCharacter() {
  return new Promise((resolve) => {
    rl.question(
      "enter the character in the text from where you want to slice (put no if you don't want any):- ",
      (answer) => {
        resolve(answer);
      }
    );
  });
}
async function checkInDrive(urls) {
  try {
    const authClient = await authenticate();

    const folderId = "1tj6wcvLQCcVyglSQ0hcCRZD1KaOCWOkk";
    const files = await getFolderContents(authClient, folderId);
    textCharacter = await TextBreakerCharacter();
    console.log("Folder contents retrieved successfully.");

    console.log("Files:");
    for (const file of files) {
      console.log(`- ${file.name}`);
      const fileExtension = path.parse(file.name).ext;
      console.log("File extension:", fileExtension);

      let fileName;
      if (textCharacter === "no") {
        fileName == file.name.split(".")[0];
      } else {
        fileName = file.name.split(textCharacter)[0];
      }
      console.log("Modified fileName:", fileName);
      const matchingUrl = urls.find((url) => url === fileName);

      if (matchingUrl) {
        console.log(`File "${fileName}" found in Google Drive.`);
        fileName = fileName + fileExtension;
        console.log(fileName + ">>>>>>>>>>>>>>");
        console.log(audiosFolderPath);
        const filePath = path.join(__dirname, fileName);
        await downloadFile(authClient, file.id, file.name, audiosFolderPath);
        // Perform any additional actions for matching files
      } else {
        console.log(`File "${fileName}" not found in Google Drive.`);
        // Perform any actions for missing files
      }
    }
    console.log("done checking");
    const checkAgain = await new Promise((resolve) => {
      rl.question(
        "Do you want to check from the contents of this folder? (yes/no): ",
        (answer) => {
          resolve(answer.toLowerCase());
        }
      );
    });
    if (checkAgain === "yes") {
      checkInDrive(urls);
    }
  } catch (error) {
    console.error("Error retrieving folder contents:", error);
  }
}
