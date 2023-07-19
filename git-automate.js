const { Octokit } = require("@octokit/rest");
const fs = require("fs");
const path = require("path");
const { dirname } = require("path");
const simpleGit = require("simple-git");
require("dotenv").config();

const accessToken = process.env.ACCESS_TOKEN;
const owner = process.env.REPO_OWNER;
const repo = process.env.REPO;
const branch = process.env.BRANCH_NAME;
const repoPath = dirname(require.main.filename) + process.env.CLONE_REPO_PATH;
const repositoryUrl = process.env.REPO_URL;

const octokit = new Octokit({
  auth: accessToken,
});

async function checkGitStatus() {
  const git = simpleGit(repoPath);
  git.status(async (err, status) => {
    if (err) {
      console.error("Error getting repository status:", err);
      return;
    }

    if (!status || !status.files || status.files.length === 0) {
      console.log("No file changes to commit.");
      return;
    }

    const modifiedFiles = status.files
      .filter((file) => file.index !== " " || file.working_dir !== " ")
      .map((file) => file.path)
      .filter((file) => !file.includes(".env")); // Exclude files or directories with '.env'

    if (modifiedFiles.length > 0) {
      console.log("Files changed and ready to be committed:");
      modifiedFiles.forEach((file) => {
        console.log(`- ${file}`);
      });
      commitAndPushChanges(modifiedFiles);
    } else {
      console.log("No file changes to commit.");
    }
  });
}

async function commitAndPushChanges(filePaths) {
  if (filePaths.length == 0) {
    console.log("No file to commit and push");
    return;
  }

  const { data: branchData } = await octokit.rest.repos.getBranch({
    owner,
    repo,
    branch,
  });
  const latestCommitSha = branchData.commit.sha;

  const treeEntries = await Promise.all(
    filePaths.map(async (filePath) => {
      const fileContent = fs.readFileSync(filePath, "utf-8");

      const { data } = await octokit.rest.git.createBlob({
        owner,
        repo,
        content: fileContent,
        encoding: "utf-8",
      });

      return {
        path: filePath,
        mode: "100644",
        type: "blob",
        sha: data.sha,
      };
    })
  );

  const { data: tree } = await octokit.rest.git.createTree({
    owner,
    repo,
    base_tree: latestCommitSha,
    tree: treeEntries,
  });

  const { data: commitData } = await octokit.rest.git.createCommit({
    owner,
    repo,
    message: "Commit using automation",
    tree: tree.sha,
    parents: [latestCommitSha],
  });

  // Update the branch reference to point to the new commit
  await octokit.rest.git.updateRef({
    owner,
    repo,
    ref: `heads/${branch}`,
    sha: commitData.sha,
  });

  await discardAllChanges();
}

async function discardAllChanges() {
  const git = simpleGit(repoPath);

  try {
    await git.reset('hard', ['HEAD']);
    console.log("All file changes discarded successfully.");
    await updateCurrentBranch();
  } catch (error) {
    console.error("Error occurred while discarding changes:", error);
  }
}

async function updateCurrentBranch() {
  const git = simpleGit(repoPath);

  try {
    await git.pull();
    console.log("Current branch updated successfully.");
  } catch (error) {
    console.error("Error occurred while updating current branch:", error);
  }
}

checkGitStatus();
