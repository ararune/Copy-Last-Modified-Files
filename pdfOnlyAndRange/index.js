const { existsSync, mkdirSync, readdirSync, writeFileSync, statSync, copyFileSync, appendFileSync } = require('fs');
const { join, extname } = require('path');

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
// Create text document to store console logs
function createLog() {
    const logFilePath = join(logOutputDir, 'console-log.txt');
    const log = `Console log from ${new Date().toLocaleString()}:\n`;
    appendLog(logFilePath, log);
    return logFilePath;
}

// Sort files by last modified time
function sortFilesByModifiedDate(files, folderPath) {
    return files.sort((a, b) => {
        return statSync(join(folderPath, b.name)).mtime.getTime() - statSync(join(folderPath, a.name)).mtime.getTime();
    });
}

// Copy PDF file to output directory with modified name matching the origin folder's name
function copyPDFToOutputDirectory(filePath, folder, outputDir) {
    const outputFilePath = join(outputDir, `${folder}.pdf`);
    copyFileSync(filePath, outputFilePath);
    return outputFilePath;
}

// Process each folder and copy the last modified PDF file to output directory
async function processFolders(logFilePath, folders) {
    for (const folder of folders) {
        const folderPath = join(sourceDir, folder);
        const files = readdirSync(folderPath, { withFileTypes: true });
        const PDFFilesToCopy = files.filter(f => f.isFile() && extname(f.name).toLowerCase() === '.pdf');
        console.log(`\nProcessing PDF files in ${folderPath}:`);

        const sortedPDFFiles = sortFilesByModifiedDate(PDFFilesToCopy, folderPath);

        if (sortedPDFFiles.length > 0) {
            const PDFFile = sortedPDFFiles[0];
            const filePath = join(folderPath, PDFFile.name);
            console.log(`Copying PDF file: ${filePath}`);
            const outputFilePath = copyPDFToOutputDirectory(filePath, folder, outputDir);
            const log = `Copied PDF file from ${filePath} to ${outputFilePath} at ${new Date().toLocaleString()}\n`;
            await appendLog(logFilePath, log);
        } else {
            const log = `No PDF files found in ${folderPath}\n`;
            await appendLog(logFilePath, log)
        }
    }
}

// Add log to console log file
function appendLog(logFilePath, log) {
    appendFileSync(logFilePath, log);
    console.log(log.trim());
}

function main() {
    createOutputDirectory();
    const folders = getSubfolders(startRange, endRange);
    const log = `Processing folders in ${sourceDir}: ${folders.join(', ')}\n`;
    const logFilePath = createLog();
    appendLog(logFilePath, log);
    processFolders(logFilePath, folders);
}

main();
console.timeEnd('myApp');
