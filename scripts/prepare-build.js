const fs = require("fs");
const path = require("path");

const lockfile = path.join(process.cwd(), "package-lock.json");

if (!fs.existsSync(lockfile)) {
  console.log("[build] No package-lock.json found; continuing with npm install mode.");
}
