#!/usr/bin/env node

import inquirer from 'inquirer';
import chalk from 'chalk';
import { getAllNotes, getNoteById, addNote, deleteNoteById, readThemeColor, saveThemeColor, deleteThemeColor, updateNoteById } from './utils/db.js';

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
  switch (command) {
    case 'create':
      const { content } = await inquirer.prompt([
        {
          type: 'input',
          name: 'content',
          message: chalk[themeColor]('Enter note content:'),
          validate: (input) => (input.trim() ? true : 'Note content cannot be empty!'),
        },
      ]);
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
      const { newContent } = await inquirer.prompt([
        {
          type: 'input',
          name: 'newContent',
          message: chalk[themeColor]('Enter the new content for the note:'),
          validate: (input) => (input.trim() !== '' ? true : 'Content cannot be empty!'),
        },
      ]);
      const updateResult = await updateNoteById(updateId, newContent);
      if (updateResult) {
        console.log(chalk[themeColor](`Note with ID ${updateId} updated.`));
      } else {
        console.log(chalk.red(`Note with ID ${updateId} not found.`));
      }
      break;

    case 'exit':
      console.log(chalk[themeColor]('Goodbye!'));
      deleteThemeColor();
      process.exit(0);

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
          { name: 'Delete a note 🗑️', value: 'delete' },
          { name: 'Exit 🚪', value: 'exit' },
        ],
      },
    ]);

    await handleCommand(command, themeColor);
  }
}

// Start the CLI
runInteractiveCLI();
