



import { getAllNotes } from '../utils/db.js';
import fs from 'fs';

export async function exportNotesHandler() {
  const notes = await getAllNotes();
  fs.writeFileSync('./data/notes_export.json', JSON.stringify(notes, null, 2));
  console.log('Notes exported to notes_export.json');
}
