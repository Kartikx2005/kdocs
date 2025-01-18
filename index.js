#!/usr/bin/env node

import inquirer from 'inquirer';
import chalk from 'chalk';
import {
  getAllNotes,
  getNoteById,
  addNote,
  deleteNoteById,
  readThemeColor,
  saveThemeColor,
  deleteThemeColor,
  updateNoteById,
  readInteractionMode,
  saveInteractionMode,
  resetInteractionMode,
  exportNotesToPDF,
  searchNotes,
} from './utils/db.js';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';


function isCommandAvailable(command) {
  try {
    execSync(`command -v ${command}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Open note in an editor (Vim, Nano, etc.)


function getEditor() {
  const editorEnv = process.env.EDITOR;
  if (editorEnv) {
    return editorEnv; // Respect the user's configured EDITOR environment variable
  }

  if (isCommandAvailable('vim')) {
    return 'vim';
  } else if (isCommandAvailable('nano')) {
    return 'nano';
  } else if (process.platform === 'win32') {
    return 'notepad'; // Use Notepad on Windows
  } else {
    throw new Error(
      'No suitable editor found! Please install Vim, Nano, or set the EDITOR environment variable.'
    );
  }
}

async function editWithEditor(initialContent = '') {
  const tempFilePath = path.resolve('temp_note.txt');
  fs.writeFileSync(tempFilePath, initialContent, 'utf-8');
  const editor = getEditor();
  try {
    execSync(`${editor} ${tempFilePath}`, { stdio: 'inherit' });
    const content = fs.readFileSync(tempFilePath, 'utf-8').trim();
    fs.unlinkSync(tempFilePath); // Clean up temp file
    return content;
  } catch (error) {
    console.error(`Error opening editor (${editor}):`, error.message);
    return null;
  }
}


async function promptForInteractionMode() {
  const { mode, savePreference } = await inquirer.prompt([
    {
      type: 'list',
      name: 'mode',
      message: 'How would you like to interact?',
      choices: [
        { name: 'CLI (Command Line Input)', value: 'cli' },
        { name: 'Editor (Vim, Nano, etc.)', value: 'editor' },
      ],
    },
    {
      type: 'confirm',
      name: 'savePreference',
      message: 'Would you like to save this choice for future use?',
      default: false,
    },
  ]);

  if (savePreference) {
    saveInteractionMode(mode);
  }

  return mode;
}

async function getInteractionMode() {
  const savedMode = readInteractionMode();
  if (savedMode) {
    return savedMode;
  }
  return await promptForInteractionMode();
}

async function initializeApp() {
  let themeColor = readThemeColor();

  // Prompt the user to select a theme color if not already set
  if (!themeColor || !(themeColor in chalk)) {
    console.log(chalk.yellow('Choose a theme color for the terminal:'));
    const { selectedColor } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedColor',
        message: 'Select a theme color:',
        choices: ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'],
      },
    ]);

    themeColor = selectedColor;

    // Save the selected theme color
    saveThemeColor(themeColor);
  }

  return themeColor;
}

async function handleCommand(command, themeColor) {
  if (command === 'exit') {
    console.log(chalk[themeColor]('Goodbye!'));
    deleteThemeColor();
    resetInteractionMode();
    process.exit(0);
  }
  if (command === 'export-pdf') {
    const notesToExport = await getAllNotes();
    if (notesToExport.length === 0) {
      console.log(chalk.red('No notes available to export.'));

    }
    const pdfPath = path.resolve('all_notes.pdf');
    try {
      await exportNotesToPDF(notesToExport, pdfPath);
      console.log(chalk.green(`All notes exported to PDF successfully! File saved as: ${pdfPath}`));
    } catch (error) {
      console.error(chalk.red(`Failed to export notes to PDF: ${error.message}`));
    }
  }
  const mode = await getInteractionMode();
  switch (command) {
    case 'create':
      const content = mode === 'cli'
        ? await inquirer.prompt([
          {
            type: 'input',
            name: 'content',
            message: chalk[themeColor]('Enter note content:'),
            validate: (input) => (input.trim() ? true : 'Note content cannot be empty!'),
          },
        ]).then((ans) => ans.content)
        : await editWithEditor();
      await addNote(content);
      console.log(chalk[themeColor]('Note created successfully!'));
      break;

    case 'list':
      const notes = await getAllNotes();
      console.log(chalk[themeColor]('All Notes:'));
      if (notes.length === 0) {
        console.log(chalk[themeColor]('No notes found.'));
      } else {
        notes.forEach((note) => {
          console.log(chalk[themeColor](`ID: ${note.id}, Content: ${note.content}`));
        });
      }
      break;


    case 'view':
      const { viewId } = await inquirer.prompt([
        {
          type: 'number',
          name: 'viewId',
          message: chalk[themeColor]('Enter the note ID to view:'),
          validate: (input) => (!isNaN(input) && input > 0 ? true : 'Please enter a valid ID!'),
        },
      ]);
      const note = await getNoteById(viewId);
      if (note) {
        console.log(chalk[themeColor](`Note found: ${JSON.stringify(note)}`));
      } else {
        console.log(chalk.red('Note not found.'));
      }
      break;

    case 'delete':
      const { deleteId } = await inquirer.prompt([
        {
          type: 'number',
          name: 'deleteId',
          message: chalk[themeColor]('Enter the note ID to delete:'),
          validate: (input) => (!isNaN(input) && input > 0 ? true : 'Please enter a valid ID!'),
        },
      ]);
      const result = await deleteNoteById(deleteId);
      if (result) {
        console.log(chalk[themeColor](`Note with ID ${deleteId} deleted.`));
      } else {
        console.log(chalk.red(`Note with ID ${deleteId} not found.`));
      }
      break;

    case 'search':
      const { keyword } = await inquirer.prompt([
        {
          type: 'input',
          name: 'keyword',
          message: chalk[themeColor]('Enter a keyword to search for:'),
          validate: (input) => input.trim() ? true : 'Keyword cannot be empty!',
        },
      ]);

      const results = await searchNotes(keyword);
      if (results.length === 0) {
        console.log(chalk.red('No notes found matching the keyword.'));
      } else {
        console.log(chalk[themeColor]('Search Results:'));
        results.forEach((note) => {
          console.log(chalk[themeColor](`ID: ${note.id}, Content: ${note.content}`));
        });
      }
      break;

    case 'update':
      const { updateId } = await inquirer.prompt([
        {
          type: 'number',
          name: 'updateId',
          message: chalk[themeColor]('Enter the note ID to update:'),
          validate: (input) => (!isNaN(input) && input > 0 ? true : 'Please enter a valid ID!'),
        },
      ]);
      const note1 = await getNoteById(updateId);
      if (!note1) {
        console.log(chalk.red(`Note with ID ${updateId} not found.`));
        break; // Exit the update process if the note does not exist
      }
      const newContent = mode === 'cli'
        ? await inquirer.prompt([
          {
            type: 'input',
            name: 'newContent',
            message: chalk[themeColor]('Enter the new content for the note:'),
            validate: (input) => (input.trim() !== '' ? true : 'Content cannot be empty!'),
          },
        ]).then((ans) => ans.newContent)
        : await editWithEditor(note1.content);

      const updateResult = await updateNoteById(updateId, newContent);
      if (updateResult) {
        console.log(chalk[themeColor](`Note with ID ${updateId} updated.`));
      } else {
        console.log(chalk.red(`Note with ID ${updateId} not found.`));
      }
      break;

    default:
      console.log(chalk.red('Unknown command. Please try again.'));
      break;
  }
}

async function runInteractiveCLI() {
  const themeColor = await initializeApp();

  while (true) {
    const { command } = await inquirer.prompt([
      {
        type: 'list',
        name: 'command',
        message: chalk[themeColor]('Select a command:'),
        choices: [
          { name: 'Create a new note 📝', value: 'create' },
          { name: 'List all notes 📋', value: 'list' },
          { name: 'View a specific note 🔍', value: 'view' },
          { name: 'Update a specific note 📝', value: 'update' },
          { name: 'Search notes 🔎', value: 'search' },
          { name: 'Delete a note 🗑️', value: 'delete' },
          { name: 'Exit 🚪', value: 'exit' },
          { name: 'Export all notes to PDF 📄', value: 'export-pdf' },
        ],
      },
    ]);

    await handleCommand(command, themeColor);
  }
}
// Start the CLI
runInteractiveCLI();

resetInteractionMode();