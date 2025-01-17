import { getAllNotes } from '../utils/db.js';

export async function listNotesHandler() {
  const notes = await getAllNotes();
  console.log('Listing all notes:');
  notes.forEach(note => console.log(chalk[themeColor](`ID: ${note.id}, Content: ${note.content}`)));
}
