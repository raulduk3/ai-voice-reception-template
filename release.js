#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m"
};

function log(message, color = "white") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, description) {
  try {
    log(`📋 ${description}...`, "blue");
    const result = execSync(command, { encoding: "utf8", stdio: "pipe" });
    return result.trim();
  } catch (error) {
    log(`❌ Error: ${error.message}`, "red");
    process.exit(1);
  }
}

function getCurrentVersion() {
  const packagePath = path.join(process.cwd(), "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  return packageJson.version;
}

function main() {
  const args = process.argv.slice(2);
  const releaseType = args[0];

  if (!["patch", "minor", "major"].includes(releaseType)) {
    log("❌ Invalid release type. Use: patch, minor, or major", "red");
    log("Usage: node scripts/release.js <patch|minor|major>", "yellow");
    process.exit(1);
  }

  log("🚀 Layer 7 AI Voice Release Manager", "cyan");
  log("=====================================", "cyan");

  const currentVersion = getCurrentVersion();
  log(`📦 Current version: ${currentVersion}`, "blue");

  // Check if working directory is clean
  try {
    execSync("git diff --quiet", { stdio: "pipe" });
    execSync("git diff --cached --quiet", { stdio: "pipe" });
  } catch (error) {
    log("⚠️  Warning: You have uncommitted changes!", "yellow");
    log("Please commit or stash your changes before releasing.", "yellow");
    process.exit(1);
  }

  // Ensure we're on main branch
  const currentBranch = execCommand(
    "git rev-parse --abbrev-ref HEAD",
    "Checking current branch"
  );
  if (currentBranch !== "main") {
    log(
      `⚠️  Warning: You're on branch '${currentBranch}', not 'main'`,
      "yellow"
    );
    log("Releases should typically be created from the main branch.", "yellow");
  }

  // Pull latest changes
  execCommand("git pull origin main", "Pulling latest changes");

  // Run build to ensure everything works
  execCommand("npm run build", "Running build to validate configuration");

  // Bump version
  log(`⬆️  Bumping ${releaseType} version...`, "green");
  const versionResult = execCommand(
    `npm version ${releaseType} --no-git-tag-version`,
    `Updating ${releaseType} version`
  );
  const newVersion = getCurrentVersion();

  log(`✅ Version updated: ${currentVersion} → ${newVersion}`, "green");

  // Update build info with new version
  execCommand("npm run build", "Rebuilding with new version");

  // Commit version bump
  execCommand(`git add .`, "Staging version files");
  execCommand(
    `git commit -m "chore: bump version to ${newVersion}"`,
    "Committing version bump"
  );

  // Create and push tag
  execCommand(`git tag v${newVersion}`, "Creating version tag");
  execCommand("git push origin main", "Pushing changes to remote");
  execCommand(`git push origin v${newVersion}`, "Pushing version tag");

  log("🎉 Release completed successfully!", "green");
  log("=====================================", "cyan");
  log(`📋 Release Summary:`, "white");
  log(`   • Version: ${newVersion}`, "white");
  log(`   • Tag: v${newVersion}`, "white");
  log(`   • Type: ${releaseType}`, "white");
  log("", "white");
  log("🔗 GitHub Actions will automatically create the release.", "blue");
}

if (require.main === module) {
  main();
}
