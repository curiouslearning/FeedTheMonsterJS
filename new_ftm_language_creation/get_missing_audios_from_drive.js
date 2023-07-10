const readline = require("readline");
const checkInDrive = require("./check_in_drive.js");
// const urls = [
//   "https://feedthemonster.curiouscontent.org/lang/punjabi/audios/ਖ.mp3",
//   "https://feedthemonster.curiouscontent.org/lang/punjabi/audios/ਛੁੱਟੀ.mp3",
//   "https://feedthemonster.curiouscontent.org/lang/punjabi/audios/ਢਿੱਡ.mp3",
//   "https://feedthemonster.curiouscontent.org/lang/punjabi/audios/ਢਹਿ.mp3",
//   "https://feedthemonster.curiouscontent.org/lang/punjabi/audios/ਸਿੰਘ.mp3",
//   "https://feedthemonster.curiouscontent.org/lang/punjabi/audios/ਫਿਰ.mp3",
//   "https://feedthemonster.curiouscontent.org/lang/punjabi/audios/ਗੂੰਜ.mp3",
//   "https://feedthemonster.curiouscontent.org/lang/punjabi/audios/ਦੁੱਧ.mp3",
//   "https://feedthemonster.curiouscontent.org/lang/punjabi/audios/ਜੁੱਤੀ.mp3",
//   "https://feedthemonster.curiouscontent.org/lang/punjabi/audios/ਭੁੱਲ.mp3",
//   "https://feedthemonster.curiouscontent.org/lang/punjabi/audios/ਠੋਸ.mp3",
//   "https://feedthemonster.curiouscontent.org/lang/punjabi/audios/ਠੋਡੀ.mp3",
// ];

function getAudioNameWithFormat(url, format) {
  const audioName = url.split("/").pop(); // Extract the audio file name
  return `${audioName.split(".")[0]}${format}`;
}

async function getMissingAudios(urls) {
  try {
    const missingAudios = urls.map((url) => {
      const fileName = url.substring(url.lastIndexOf("/") + 1); // Extract the file name with extension
      const audioName = fileName.substring(0, fileName.lastIndexOf(".")); // Extract the audio name without extension
      return audioName;
    });
    checkInDrive(missingAudios);
    // const rl = readline.createInterface({
    //   input: process.stdin,
    //   output: process.stdout,
    // });

    // rl.question(
    //   "Enter your desired audio format (e.g., mp3, wav): ",
    //   (format) => {
    //     const formattedUrls = urls.map((url) =>
    //       getAudioNameWithFormat(url, format)
    //     );

    //     checkInDrive(formattedUrls);
    //     rl.close();
    //   }
    // );
  } catch (error) {}
}
module.exports = getMissingAudios;
// getMissingAudios();
