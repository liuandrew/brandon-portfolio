import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { getChanged, clearChanged, hasChanges } from "./admin-state.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

function getRepoInfo() {
  const envRepo = process.env.GITHUB_REPO;
  if (envRepo) return envRepo.split("/");

  try {
    const url = execSync("git remote get-url origin", {
      cwd: ROOT,
      encoding: "utf-8",
    }).trim();
    const match = url.match(/(?:github\.com[/:])([\w.-]+)\/([\w.-]+?)(?:\.git)?$/);
    if (match) return [match[1], match[2]];
  } catch {}

  throw new Error(
    "Could not detect the GitHub repository. Make sure GITHUB_REPO is set in your .env file (format: owner/repo)."
  );
}

function getToken() {
  const token = process.env.GITHUB_PAT;
  if (!token) throw new Error("GitHub token not found. Make sure GITHUB_PAT is set in your .env file.");
  return token;
}

function headers(token) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/vnd.github+json",
    "User-Agent": "brandon-portfolio-admin",
  };
}

async function apiFetch(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`GitHub API ${response.status}: ${response.statusText}\n${body}`);
  }
  return response.json();
}

function readFileContent(relativePath) {
  const abs = resolve(ROOT, relativePath);
  if (!existsSync(abs)) throw new Error(`File not found: ${relativePath}`);
  const buf = readFileSync(abs);
  return buf.toString("base64");
}

const GITHUB_API = "https://api.github.com";

export async function publish() {
  const files = getChanged();
  if (files.length === 0) {
    return { success: false, error: "No changes to publish" };
  }

  const token = getToken();
  const [owner, repo] = getRepoInfo();

  const refUrl = `${GITHUB_API}/repos/${owner}/${repo}/git/ref/heads/main`;
  const refsUrl = `${GITHUB_API}/repos/${owner}/${repo}/git/refs/heads/main`;

  const refData = await apiFetch(refUrl, { headers: headers(token) });
  const latestCommitSha = refData.object.sha;

  const commitUrl = `${GITHUB_API}/repos/${owner}/${repo}/git/commits/${latestCommitSha}`;
  const commitData = await apiFetch(commitUrl, { headers: headers(token) });
  const baseTreeSha = commitData.tree.sha;

  const blobs = await Promise.all(
    files.map(async (filePath) => {
      const content = readFileContent(filePath);
      const blobData = await apiFetch(
        `${GITHUB_API}/repos/${owner}/${repo}/git/blobs`,
        {
          method: "POST",
          headers: headers(token),
          body: JSON.stringify({ content, encoding: "base64" }),
        }
      );
      return {
        path: filePath,
        sha: blobData.sha,
        mode: "100644",
        type: "blob",
      };
    })
  );

  const treeUrl = `${GITHUB_API}/repos/${owner}/${repo}/git/trees`;
  const treeData = await apiFetch(treeUrl, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ base_tree: baseTreeSha, tree: blobs }),
  });
  const newTreeSha = treeData.sha;

  const newCommitUrl = `${GITHUB_API}/repos/${owner}/${repo}/git/commits`;
  const newCommitData = await apiFetch(newCommitUrl, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({
      message: "admin: update content",
      tree: newTreeSha,
      parents: [latestCommitSha],
    }),
  });
  const newCommitSha = newCommitData.sha;

  await apiFetch(refsUrl, {
    method: "PATCH",
    headers: headers(token),
    body: JSON.stringify({ sha: newCommitSha, force: false }),
  });

  try {
    execSync("git stash", { cwd: ROOT, encoding: "utf-8", stdio: "pipe" });
    execSync("git pull --ff-only", { cwd: ROOT, encoding: "utf-8", stdio: "pipe" });
  } catch {}

  clearChanged();

  return {
    success: true,
    commitSha: newCommitSha,
    commitUrl: `https://github.com/${owner}/${repo}/commit/${newCommitSha}`,
    fileCount: files.length,
  };
}

export { getChanged, hasChanges };
