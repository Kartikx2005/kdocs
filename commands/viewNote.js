


import { getNoteById } from '../utils/db.js';

export async function viewNoteHandler(noteId) {
  await getNoteById(noteId);
}
