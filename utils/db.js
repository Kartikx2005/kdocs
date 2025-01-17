import fs from 'fs';
import { JSONFilePreset } from 'lowdb/node';
import inquirer from 'inquirer';
import path from 'path';

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

// Theme color functions
const configPath = path.resolve('config.json');

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
