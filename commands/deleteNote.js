




import { deleteNoteById } from '../utils/db.js';

export async function deleteNoteHandler(noteId) {
  await deleteNoteById(noteId);
}
