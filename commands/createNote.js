



import { addNote } from '../utils/db.js';

export async function createNoteHandler(noteContent) {
  await addNote(noteContent);
}
