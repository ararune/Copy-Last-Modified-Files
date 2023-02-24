const { existsSync, mkdirSync, readdirSync, writeFileSync, statSync, appendFileSync, createReadStream, createWriteStream } = require('fs');
const { join } = require('path');

console.time('myApp');
const sourceDir = 'C:/Users/ararune/Desktop/PRAKSA';
const outputDir = 'C:/Users/ararune/Desktop/Output';
const logOutputDir = 'C:/Users/ararune/Desktop';
const startRange = undefined;
const endRange = undefined;

// Create output directory if it doesn't exist
function createOutputDirectory() {
    if (!existsSync(outputDir)) {
        mkdirSync(outputDir);
        console.log(`Created output directory: ${outputDir}`);
    }
}

// Read all subfolders in sourceDir which are within parameter range, if arguments are omitted, the function returns all subfolders
function getSubfolders(startRange = null, endRange = null) {
    return readdirSync(sourceDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .filter(d => {
            if (startRange && endRange) {
                const folderNum = parseInt(d.name);
                return !isNaN(folderNum) && folderNum >= startRange && folderNum <= endRange && d.name.startsWith(folderNum.toString());
            }
            return true;
        })
        .map(d => d.name);
}

// Copy PDF file to output directory with modified name matching the origin folder's name
function copyPDFToOutputDirectory(filePath, folder, outputDir) {
    const outputFilePath = join(outputDir, `${folder}.pdf`);
    const readStream = createReadStream(filePath);
    const writeStream = createWriteStream(outputFilePath);

    readStream.on('error', err => {
        console.error(`Error reading file: ${err}`);
    });
    writeStream.on('error', err => {
        console.error(`Error writing file: ${err}`);
    });

    writeStream.on('close', () => {
        console.log(`Copied PDF file to: ${outputFilePath}`);
    });

    readStream.pipe(writeStream);

    return outputFilePath;
}

// Process each folder and copy the last modified PDF file to output directory
function processFolders(logFilePath, folders) {
    for (const folder of folders) {
        const pdfFiles = getPdfFilesInFolder(folder);
        if (pdfFiles.length > 0) {
            const lastModifiedPdfFile = getLastModifiedFile(pdfFiles);
            const filePath = join(sourceDir, folder, lastModifiedPdfFile.name);
            const outputFilePath = copyPDFToOutputDirectory(filePath, folder, outputDir);
            const log = `Copied PDF file from ${filePath} to ${outputFilePath} at ${new Date().toLocaleString()}\n`;
            appendLog(logFilePath, log);
            console.log(`Copying PDF file: ${filePath}`);
        } else {
            const log = `No PDF files found in ${join(outputDir, `${folder}`)}\n`;
            appendLog(logFilePath, log);
            console.log(log);
        }
    }
}

function getPdfFilesInFolder(folder) {
    const folderPath = join(sourceDir, folder);
    const files = readdirSync(folderPath, { withFileTypes: true });
    return files.filter(file => file.isFile() && file.name.toLowerCase().endsWith('.pdf'));
}

function getLastModifiedFile(files) {
    return files.reduce((lastModifiedFile, file) => {
        const modifiedTime = file.mtimeMs;
        return (!lastModifiedFile || lastModifiedFile.modifiedTime < modifiedTime) ? { name: file.name, modifiedTime } : lastModifiedFile;
    }, null);
}
// Create text document to store console logs
function createLog() {
    const logFilePath = join(logOutputDir, 'console-log.txt');
    writeFileSync(logFilePath, `Console log from ${new Date().toLocaleString()}:\n`);
    return logFilePath;
}

// Add log to console log file
function appendLog(logFilePath, log) {
    appendFileSync(logFilePath, log);
}

function main() {
    createOutputDirectory();
    const folders = getSubfolders(startRange, endRange);
    const log = `Processing folders in ${sourceDir}: ${folders.join(', ')}\n`;
    console.log(log);
    const logFilePath = createLog();
    appendLog(logFilePath, log);
    processFolders(logFilePath, folders);
    appendLog(logFilePath, '\nFinished processing folders');
    console.log('\nFinished processing folders');
}

main();
console.timeEnd('myApp');