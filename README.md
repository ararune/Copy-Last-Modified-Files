# Copy-Last-Modified-Files
Node JS app to copy last modified file from each subdirectory within a directory. The files are copied into Output folder, the names of copied files are modified to match the name of their folder name's origin. Using Promises so that multiple folders can be accessed in parallel, thus making use of multiple CPU cores, if available.

```js
// Create output directory if it doesn't exist
async function createOutputDirectory() {
    try {
        if (!existsSync(outputDir)) {
            mkdirSync(outputDir);
            console.log(`Created output directory: ${outputDir}`);
        }
    } catch (err) {
        console.error(`Error creating output directory: ${err}`);
    }
}

// Read all subfolders in sourceDir
async function getSubfolders() {
    try {
        const subfolders = readdirSync(sourceDir, { withFileTypes: true })
            .filter(d => d.isDirectory())
            .map(d => d.name);
        return subfolders;
    } catch (err) {
        console.error(`Error getting subfolders: ${err}`);
        return [];
    }
}

// Create text document to store console logs
async function createLog() {
    try {
        const logFilePath = join(outputDir, 'console-log.txt');
        writeFileSync(logFilePath, `Console log from ${new Date().toLocaleString()}:\n`);
        return logFilePath;
    } catch (err) {
        console.error(`Error creating console log: ${err}`);
        return '';
    }
}

// Sort files by last modified time
async function sortFilesByModifiedTime(files, folderPath) {
    try {
        const fileStats = await Promise.all(files.map(file => fs.promises.stat(path.join(folderPath, file.name))));
        return files.sort((a, b) => {
            return fileStats[fileStats.findIndex(stat => stat.path === path.join(folderPath, b.name))].mtime.getTime() -
                fileStats[fileStats.findIndex(stat => stat.path === path.join(folderPath, a.name))].mtime.getTime();
        });
    } catch (err) {
        console.error(`Error sorting files by modified date: ${err}`);
        return files;
    }
}


// Copy file to output directory with modified name matching the origin folder's name
async function copyFileToOutputDirectory(filePath, folder, outputDir) {
    try {
        const ext = extname(filePath);
        const outputFilePath = join(outputDir, `${folder}${ext}`);
        copyFileSync(filePath, outputFilePath);
        console.log(`Copied file to: ${outputFilePath}`);
        return outputFilePath;
    } catch (err) {
        console.error(`Error copying file to output directory: ${err}`);
        throw err;
    }
}

// Process each folder and copy the last modified file to output directory
async function processFolders(logFilePath, folders) {
    try {
        const folderPromises = folders.map(async (folder) => {
            const folderPath = join(sourceDir, folder);
            const files = await fs.promises.readdir(folderPath, { withFileTypes: true });
            const filesToCopy = files.filter(f => f.isFile());
            console.log(`\nProcessing files in ${folderPath}:`);

            const sortedFiles = await sortFilesByModifiedTime(filesToCopy, folderPath);

            if (sortedFiles.length > 0) {
                const file = sortedFiles[0];
                const filePath = join(folderPath, file.name);
                console.log(`Copying file: ${filePath}`);
                const outputFilePath = await copyFileToOutputDirectory(filePath, folder, outputDir);
                const log = `Copied file from ${filePath} to ${outputFilePath} at ${new Date().toLocaleString()}\n`;
                appendFileSync(logFilePath, log);
            } else {
                console.log(`No files found in ${folderPath}`);
            }
        });
        await Promise.all(folderPromises);
    } catch (err) {
        console.error(`Error processing folders: ${err}`);
    }
}

// Add log to console log file
async function addLog(logFilePath) {
    const log = `Finished processing folders at ${new Date().toLocaleString()}\n`;
    appendFileSync(logFilePath, log);
}

async function main() {
    try {
        await createOutputDirectory();
        const folders = await getSubfolders();
        console.log(`Processing folders in ${sourceDir}: ${folders.join(', ')}`);
        const logFilePath = await createLog();
        await processFolders(logFilePath, folders);
        await addLog(logFilePath);
        console.log('\nFinished processing folders');
    } catch (err) {
        console.error(err);
        if (logFilePath) {
            const log = `Error occurred: ${err} at ${new Date().toLocaleString()}\n`;
            appendFileSync(logFilePath, log);
        }
    }
}

main().catch(err => {
    console.error(err);
});
```
