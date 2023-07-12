const { google } = require("googleapis");
const readline = require("readline");
const fs = require("fs");
const path = require("path");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
const { spawn } = require("child_process");
const langFolderPath = path.join(__dirname, "..", "OptimizedLanguages");
if (!fs.existsSync(langFolderPath)) {
  fs.mkdirSync(langFolderPath);
}
let languageFolderPath;
let currentFolderPath = langFolderPath;
let audiosFolderPath;
let jsonPromptTexts;
let isRightToLeft = true;
const SCOPES = ["https://www.googleapis.com/auth/drive"];
const credentials = require("./credentials.json");
ffmpeg.setFfmpegPath(ffmpegPath);
let languageFolderId = [];
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
let language;

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

    rl.question("Enter the authorization code: ", (code) => {
      rl.close();

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
      await listFilesAndFolders(auth, folderId);
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
    audiosFolderPath = path.join(currentFolderPath, `${selectedFolder.name}`);
    if (!fs.existsSync(audiosFolderPath)) {
      fs.mkdirSync(audiosFolderPath);
    }
    currentFolderPath = audiosFolderPath;
    console.log(`Selected item: ${selectedFolder.name} (${selectedFolder.id})`);

    const downloadConfirmation = await new Promise((resolve) => {
      rl.question(
        "Do you want to download the contents of this folder? (yes/no): ",
        (answer) => {
          resolve(answer.toLowerCase());
        }
      );
    });

    if (downloadConfirmation === "yes") {
      if (selectedFolder.mimeType === "application/vnd.google-apps.folder") {
        await downloadFolderContents(auth, selectedFolder.id, audiosFolderPath);
      } else {
        await downloadFile(
          auth,
          selectedFolder.id,
          selectedFolder.name,
          audiosFolderPath
        );
      }
    } else {
      console.log("Download canceled.");
    }
    await listFilesAndFolders(auth, selectedFolder.id);
  } catch (error) {
    console.error("Error listing files and folders:", error);
  }
}

// Function to download a file
async function downloadFile(auth, fileId, name, destinationPath) {
  const drive = google.drive({ version: "v3", auth });
  const { ext } = path.parse(name);
  let fileExtension = ext.toLowerCase();
  let fileName;
  isRightToLeft
    ? (fileName = name.split(".")[0] + fileExtension)
    : (fileName = name.split("_")[0 + fileExtension]);

  const filePath = path.join(destinationPath, fileName);
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
  if (contentType === "audio/mp3") {
    const dest = fs.createWriteStream(filePath);

    response.data
      .on("end", () => {
        console.log(`MP3 file downloaded: ${filePath}`);
      })
      .on("error", (err) => {
        console.error("Error downloading MP3 file:", err);
      })
      .pipe(dest);
  } else if (contentType === "audio/wav") {
    const wavFolderPath = path.join(__dirname, "wav");
    if (!fs.existsSync(wavFolderPath)) {
      fs.mkdirSync(wavFolderPath);
    }
    const wavFilePath = path.join(wavFolderPath, fileName);

    response.data
      .on("end", () => {
        console.log(`WAV file downloaded: ${wavFilePath}`);
        const mp3FilePath = path.join(
          destinationPath,
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

async function downloadFolderContents(auth, folderId, destinationPath) {
  try {
    const drive = google.drive({ version: "v3", auth });
    const folderOptions = {
      q: `'${folderId}' in parents and trashed=false`,
      fields: "files(id, name)",
    };

    const response = await drive.files.list(folderOptions);
    const files = response.data.files;

    console.log(`Downloading files in folder (${folderId}):`);

    for (const file of files) {
      await downloadFile(auth, file.id, file.name, destinationPath);
    }

    console.log("Folder download complete.");
  } catch (error) {
    console.error("Error downloading folder contents:", error);
  }
}
async function languageDirection() {
  return new Promise((resolve) => {
    rl.question("Is language Right to left:(True/False) ", (answer) => {
      resolve(answer.toLowerCase());
    });
  });
}
async function main() {
  try {
    const authClient = await authenticate();
    isRightToLeft = await languageDirection();
    const parentFolderId = "1tj6wcvLQCcVyglSQ0hcCRZD1KaOCWOkk";

    await listFilesAndFolders(authClient, parentFolderId);
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
