
  



import { getAllNotes } from '../utils/db.js';

export async function searchNotesHandler(searchTerm) {
  const notes = await getAllNotes();
  const filteredNotes = notes.filter(note => note.content.includes(searchTerm));
  console.log('Search results:');
  filteredNotes.forEach(note => console.log(`ID: ${note.id}, Content: ${note.content}`));
}
