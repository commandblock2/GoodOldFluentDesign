const fs = require("fs");
const path = require("path");
const { ZipFile } = require("yazl");

const success = (message) => console.log("\x1b[32m%s\x1b[0m", message); // Green color for success
const log = (message) => console.log("\x1b[36m%s\x1b[0m", message); // Cyan color for logs
const error = (message) => console.log("\x1b[31m%s\x1b[0m", message); // Red color for errors

if (fs.existsSync("resources")) {
    fs.rmSync("resources", { recursive: true });
    log("Deleted resources folder");
}

fs.mkdirSync("resources/resources/liquidbounce/themes", { recursive: true });

const output = fs.createWriteStream("resources/resources/liquidbounce/themes/liquidbounce.zip");
const zipFile = new ZipFile();

const toZipPath = (basePath, fullPath) =>
    path.relative(basePath, fullPath).split(path.sep).join(path.posix.sep);

function addDirectoryToZip(basePath, currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);

        if (entry.isDirectory()) {
            addDirectoryToZip(basePath, fullPath);
            continue;
        }

        if (!entry.isFile()) {
            continue;
        }

        zipFile.addFile(fullPath, toZipPath(basePath, fullPath));
    }
}

output.on("close", () => {
    success("Successfully created theme bundle");
    log("\n=> Done\n====================\n");
});

output.on("error", (e) => {
    error(e);
});

zipFile.outputStream.on("error", (e) => {
    error(e);
});

zipFile.outputStream.pipe(output);

log("=> Creating theme bundle\n====================\n");
if (fs.existsSync("./dist")) {
    addDirectoryToZip("./dist", "./dist");
    log(`Added dist folder to theme bundle`);
} else {
    error(`Theme does not contain a dist folder`);
}

zipFile.end();
