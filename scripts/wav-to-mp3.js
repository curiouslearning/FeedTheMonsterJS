#!/usr/bin/env node

const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

// ─── Check ffmpeg ────────────────────────────────────────────────────────────
function checkFfmpeg() {
  try {
    execSync("ffmpeg -version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

// ─── Prompt helper ───────────────────────────────────────────────────────────
function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// ─── Convert a single WAV → MP3 via ffmpeg ───────────────────────────────────
function convertFile(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const args = [
      "-y",           // overwrite without asking
      "-i", inputPath,
      "-codec:a", "libmp3lame",
      "-qscale:a", "2", // VBR ~190 kbps (0=best, 9=worst)
      outputPath,
    ];

    const proc = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });

    let errOut = "";
    proc.stderr.on("data", (d) => (errOut += d.toString()));

    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(errOut.split("\n").pop()));
    });
  });
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log("╔══════════════════════════════╗");
  console.log("║     WAV  →  MP3  Converter   ║");
  console.log("╚══════════════════════════════╝\n");

  if (!checkFfmpeg()) {
    console.error(
      "❌  ffmpeg not found.\n" +
      "    Install it and make sure it is on your PATH.\n" +
      "    • macOS : brew install ffmpeg\n" +
      "    • Ubuntu: sudo apt install ffmpeg\n" +
      "    • Windows: https://ffmpeg.org/download.html"
    );
    process.exit(1);
  }

  // ── Get source folder ──────────────────────────────────────────────────────
  let sourceFolder = await prompt("📁  Source folder: ");
  sourceFolder = sourceFolder.replace(/^['"]|['"]$/g, ""); // strip quotes
  sourceFolder = path.resolve(sourceFolder);

  if (!fs.existsSync(sourceFolder)) {
    console.error(`❌  Folder not found: ${sourceFolder}`);
    process.exit(1);
  }

  // ── Find WAV files (non-recursive) ─────────────────────────────────────────
  const wavFiles = fs
    .readdirSync(sourceFolder)
    .filter((f) => f.toLowerCase().endsWith(".wav"));

  if (wavFiles.length === 0) {
    console.log("⚠️   No .wav files found in that folder.");
    process.exit(0);
  }

  // ── Create output folder ───────────────────────────────────────────────────
  const outFolder = path.join(sourceFolder, "mp3");
  fs.mkdirSync(outFolder, { recursive: true });

  console.log(`\n🎵  Found ${wavFiles.length} WAV file(s)`);
  console.log(`📂  Output → ${outFolder}\n`);

  // ── Convert ────────────────────────────────────────────────────────────────
  let passed = 0;
  let failed = 0;

  for (let i = 0; i < wavFiles.length; i++) {
    const file = wavFiles[i];
    const inputPath  = path.join(sourceFolder, file);
    const outputName = path.basename(file, path.extname(file)) + ".mp3";
    const outputPath = path.join(outFolder, outputName);

    const prefix = `[${String(i + 1).padStart(String(wavFiles.length).length)}/${wavFiles.length}]`;
    process.stdout.write(`${prefix} ${file} … `);

    try {
      await convertFile(inputPath, outputPath);
      console.log("✅");
      passed++;
    } catch (err) {
      console.log(`❌  ${err.message}`);
      failed++;
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log("\n─────────────────────────────");
  console.log(`✅  Converted : ${passed}`);
  if (failed) console.log(`❌  Failed    : ${failed}`);
  console.log(`📂  Saved to  : ${outFolder}`);
}

main().catch((err) => {
  console.error("Unexpected error:", err.message);
  process.exit(1);
});