import fs from 'fs';
import { JSONFilePreset } from 'lowdb/node';
import inquirer from 'inquirer';
import path from 'path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// Default data structure for the database
const defaultData = { notes: [] };

// Path for the data directory and db.json file
const dataDirectory = path.resolve('data');
const dbFilePath = path.resolve(dataDirectory, 'db.json');

// Ensure that the 'data' directory and 'db.json' file exist
const ensureDatabaseExists = () => {
  if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory, { recursive: true }); // Create 'data' directory if it doesn't exist
  }

  if (!fs.existsSync(dbFilePath)) {
    // Create an empty db.json file with default data if it doesn't exist
    fs.writeFileSync(dbFilePath, JSON.stringify(defaultData, null, 2));
  }
};

// Initialize the database with default data if needed
ensureDatabaseExists();

// Initialize the database
const db = await JSONFilePreset(dbFilePath, defaultData);

// Helper functions to interact with notes
export async function getAllNotes() {
  await db.read();
  return db.data.notes;
}

export async function getNoteById(id) {
  await db.read();
  return db.data.notes.find(note => note.id === id);
}

export async function addNote(content) {
  await db.read();
  const note = { id: db.data.notes.length + 1, content };
  db.data.notes.push(note);
  await db.write();
  return note;
}

export async function deleteNoteById(id) {
  await db.read();
  const noteIndex = db.data.notes.findIndex(note => note.id === id);
  if (noteIndex !== -1) {
    // Remove the note
    db.data.notes.splice(noteIndex, 1);

    // Reindex remaining notes
    db.data.notes.forEach((note, index) => {
      note.id = index + 1;
    });

    await db.write();
    return true;
  }
  return false;
}

export async function updateNoteById(id, content) {
  await db.read();
  const noteIndex = db.data.notes.findIndex(note => note.id === id);
  if (noteIndex !== -1) {
    db.data.notes[noteIndex].content = content;
    await db.write();
    return true;
  }
  return false;
}


// Theme color functions
const configPath = path.resolve('config.json'); // for the theme choice 
const configPath1 = path.resolve('config1.json'); // for the editor or cli choice 

export function readInteractionMode() {
  if (fs.existsSync(configPath1)) {
    const config = JSON.parse(fs.readFileSync(configPath1, 'utf-8'));
    return config.interactionMode || null;
  }
  return null;
}

export function saveInteractionMode(mode) {
  const config = fs.existsSync(configPath1) ? JSON.parse(fs.readFileSync(configPath1, 'utf-8')) : {};
  config.interactionMode = mode;
  fs.writeFileSync(configPath1, JSON.stringify(config, null, 2));
}

export function resetInteractionMode() {
  if (fs.existsSync(configPath1)) {
    const config = JSON.parse(fs.readFileSync(configPath1, 'utf-8'));
    delete config.interactionMode;
    fs.writeFileSync(configPath1, JSON.stringify(config, null, 2));
  }
}

// Read the theme color from config.json
export function readThemeColor() {
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    return config.themeColor || '';
  }
  return '';
}

// Save the theme color to config.json
export function saveThemeColor(themeColor) {
  const config = { themeColor };
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

// delete the theme color after the ending of the program 
export function deleteThemeColor() {
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    delete config.themeColor;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }
}

// Select the theme color from a list of options
export async function selectThemeColor() {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'themeColor',
      message: 'Choose a theme color for the terminal:',
      choices: ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'],
    },
  ]);
  return answers.themeColor;
}

// Function to save notes as a file 

export async function exportNotesToPDF(notes, outputPath) {
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const { width, height } = { width: 612, height: 792 }; // Standard letter size (8.5" x 11")
  const fontSize = 12;
  const margin = 50;

  // Add a page and apply a black background
  const page = pdfDoc.addPage([width, height]);
  page.drawRectangle({
    x: 0,
    y: 0,
    width: width,
    height: height,
    color: rgb(0, 0, 0), // Black background
  });

  let cursorY = height - margin;

  // Title
  page.drawText('All Notes', {
    x: margin,
    y: cursorY,
    size: 20,
    font: timesRomanFont,
    color: rgb(1, 1, 1), // White text
  });

  cursorY -= 40;

  notes.forEach((note, index) => {
    const noteText = `ID: ${note.id} | Content: ${note.content}`;
    if (cursorY <= margin) {
      // Add a new page if there's no more space
      const newPage = pdfDoc.addPage([width, height]);
      newPage.drawRectangle({
        x: 0,
        y: 0,
        width: width,
        height: height,
        color: rgb(0, 0, 0), // Black background
      });
      cursorY = height - margin;

      newPage.drawText(noteText, {
        x: margin,
        y: cursorY,
        size: fontSize,
        font: timesRomanFont,
        color: rgb(1, 1, 1), // White text
      });
      cursorY -= fontSize + 10;
    } else {
      page.drawText(noteText, {
        x: margin,
        y: cursorY,
        size: fontSize,
        font: timesRomanFont,
        color: rgb(1, 1, 1), // White text
      });
      cursorY -= fontSize + 10;
    }
  });

  // Add watermark on all pages
  const pages = pdfDoc.getPages();
  pages.forEach((page) => {
    page.drawText('Generated by KDocs', {
      x: width / 2 - 50, // Centered horizontally
      y: margin / 2, // Positioned near the bottom
      size: 10,
      font: timesRomanFont,
      color: rgb(0.8, 0.8, 0.8), // Light gray watermark
    });
  });

  // Save the PDF file
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);

  return outputPath;
}



