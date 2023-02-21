import { existsSync, mkdirSync, readdirSync, writeFileSync, statSync, copyFileSync, appendFileSync } from 'fs';
import { join, extname } from 'path';

const sourceDir = 'C:/Users/ararune/Desktop/PRAKSA';
const outputDir = 'C:/Users/ararune/Desktop/Output';

// Create output directory if it doesn't exist
function createOutputDirectory() {
    if (!existsSync(outputDir)) {
        mkdirSync(outputDir);
        console.log(`Created output directory: ${outputDir}`);
    }
}

// Read all subfolders in sourceDir
function getSubfolders() {
    return readdirSync(sourceDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);
}

// Create text document to store console logs
function createLog() {
    const logFilePath = join(outputDir, 'console-log.txt');
    writeFileSync(logFilePath, `Console log from ${new Date().toLocaleString()}:\n`);
    return logFilePath;
}

// Sort files by last modified time
function sortFilesByModifiedDate(files, folderPath) {
    return files.sort((a, b) => {
        return statSync(join(folderPath, b.name)).mtime.getTime() - statSync(join(folderPath, a.name)).mtime.getTime();
    });
}

// Copy file to output directory with modified name matching the origin folder's name
function copyFileToOutputDirectory(filePath, folder, outputDir) {
    const ext = extname(filePath);
    const outputFilePath = join(outputDir, `${folder}${ext}`);
    copyFileSync(filePath, outputFilePath);
    console.log(`Copied file to: ${outputFilePath}`);
    return outputFilePath;
}

// Process each folder and copy the last modified file to output directory
function processFolders(logFilePath, folders) {
    folders.forEach(folder => {
        const folderPath = join(sourceDir, folder);
        const files = readdirSync(folderPath, { withFileTypes: true });
        const filesToCopy = files.filter(f => f.isFile());
        console.log(`\nProcessing files in ${folderPath}:`);

        const sortedFiles = sortFilesByModifiedDate(filesToCopy, folderPath);

        if (sortedFiles.length > 0) {
            const file = sortedFiles[0];
            const filePath = join(folderPath, file.name);
            console.log(`Copying file: ${filePath}`);
            const outputFilePath = copyFileToOutputDirectory(filePath, folder, outputDir);
            const log = `Copied file from ${filePath} to ${outputFilePath} at ${new Date().toLocaleString()}\n`;
            appendFileSync(logFilePath, log);
        } else {
            console.log(`No files found in ${folderPath}`);
        }
    });
}

// Add log to console log file
function addLog(logFilePath) {
    const log = `Finished processing folders at ${new Date().toLocaleString()}\n`;
    appendFileSync(logFilePath, log);
}

function main() {
    createOutputDirectory();
    const folders = getSubfolders();
    console.log(`Processing folders in ${sourceDir}: ${folders.join(', ')}`);
    const logFilePath = createLog();
    processFolders(logFilePath, folders);
    addLog(logFilePath);
    console.log('\nFinished processing folders');
}

main();