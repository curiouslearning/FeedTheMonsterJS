const { google } = require("googleapis");
const readline = require("readline");
const fs = require("fs");
const path = require("path");

const SCOPES = ["https://www.googleapis.com/auth/drive"];
const credentials = require("./credentials.json");
let languageFolderId = [];
let textCharacter;
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
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
      rl.close();
      resolve(answer);
    });
  });
}

async function downloadFile(auth, fileId, filePath) {
  const drive = google.drive({ version: "v3", auth });
  if (fs.existsSync(filePath)) {
    return;
  }
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
        const filePath = path.join(__dirname, fileName);
        await downloadFile(authClient, file.id, filePath);
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

module.exports = checkInDrive;
