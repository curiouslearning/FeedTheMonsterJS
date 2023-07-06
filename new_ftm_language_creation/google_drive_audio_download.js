const { google } = require("googleapis");
const readline = require("readline");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const SCOPES = ["https://www.googleapis.com/auth/drive"];
const credentials = require("./credentials.json");

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

async function downloadFile(auth, fileId, filePath, destinationPath) {
  const drive = google.drive({ version: "v3", auth });

  const dest = fs.createWriteStream(filePath);

  const fileOptions = {
    fileId,
    alt: "media",
  };

  const response = await drive.files.get(fileOptions, {
    responseType: "stream",
  });

  response.data
    .on("end", async () => {
      console.log(`File downloaded: ${filePath}`);
      const fileName = path.basename(filePath);

      if (fileName.endsWith(".wav")) {
        const wavFolder = path.join(destinationPath, "WAV");
        fs.mkdirSync(wavFolder, { recursive: true });
        const newFilePath = path.join(wavFolder, fileName);
        fs.renameSync(filePath, newFilePath);
        console.log(`WAV file moved to folder: ${wavFolder}`);

        const mp3Folder = path.join(destinationPath, "MP3");
        fs.mkdirSync(mp3Folder, { recursive: true });
        const mp3FilePath = path.join(
          mp3Folder,
          fileName.replace(".wav", ".mp3")
        );

        try {
          const ffmpegProcess = spawn("ffmpeg", [
            "-i",
            newFilePath,
            mp3FilePath,
          ]);
          ffmpegProcess.on("close", (code) => {
            if (code === 0) {
              console.log(
                `WAV file converted and saved as MP3: ${mp3FilePath}`
              );
            } else {
              console.error(
                "Error converting WAV to MP3. FFmpeg process exited with code:",
                code
              );
            }
          });
        } catch (error) {
          console.error("Error converting WAV to MP3:", error);
        }
      }
    })
    .on("error", (err) => {
      console.error("Error downloading file:", err);
    })
    .pipe(dest);
}

async function downloadFolderContents(auth, folderId, destinationPath) {
  const drive = google.drive({ version: "v3", auth });

  const folderOptions = {
    q: `'${folderId}' in parents and trashed=false`,
    fields: "files(id, name, mimeType)",
  };

  const response = await drive.files.list(folderOptions);
  const files = response.data.files;

  for (const file of files) {
    const { id, name, mimeType } = file;
    const filePath = path.join(destinationPath, name);

    if (mimeType === "application/vnd.google-apps.folder") {
      fs.mkdirSync(filePath);
      await downloadFolderContents(auth, id, filePath);
    } else {
      await downloadFile(auth, id, filePath, destinationPath);
    }
  }
}

async function askQuestion(question) {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  try {
    const authClient = await authenticate();
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question("Enter the folder ID: ", async (folderId) => {
      try {
        const destinationPath = path.join(__dirname, "downloads");
        fs.mkdirSync(destinationPath, { recursive: true });
        await downloadFolderContents(authClient, folderId, destinationPath);
        console.log("Folder contents downloaded successfully.");
      } catch (error) {
        console.error("Error downloading folder contents:", error);
      }

      rl.close();
    });
  } catch (error) {
    console.error("Authentication error:", error);
  }
}

main();
