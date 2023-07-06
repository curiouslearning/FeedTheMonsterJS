const { google } = require("googleapis");
const readline = require("readline");
const fs = require("fs");
const path = require("path");

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

async function getFolderContents(auth, folderId) {
  const drive = google.drive({ version: "v3", auth });

  const folderOptions = {
    q: `'${folderId}' in parents and trashed=false`,
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
      rl.close();
      resolve(answer);
    });
  });
}

async function downloadFile(auth, fileId, filePath) {
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
    .on("end", () => {
      console.log(`File downloaded: ${filePath}`);
    })
    .on("error", (err) => {
      console.error("Error downloading file:", err);
    })
    .pipe(dest);
}

async function checkInDrive(urls) {
  try {
    const authClient = await authenticate();

    const folderId = await askQuestion("Enter the folder ID: ");
    const files = await getFolderContents(authClient, folderId);
    console.log("Folder contents retrieved successfully.");

    console.log("Files:");
    for (const file of files) {
      console.log(`- ${file.name}`);
      const fileName = file.name;
      const matchingUrl = urls.find((url) => url === fileName);

      if (matchingUrl) {
        console.log(`File "${fileName}" found in Google Drive.`);
        const filePath = path.join(__dirname, fileName);
        await downloadFile(authClient, file.id, filePath);
        // Perform any additional actions for matching files
      } else {
        console.log(`File "${fileName}" not found in Google Drive.`);
        // Perform any actions for missing files
      }
    }
  } catch (error) {
    console.error("Error retrieving folder contents:", error);
  }
}

module.exports = checkInDrive;
