export function validateNoteContent(content) {
  if (content.trim() === '') {
    console.log('Note content cannot be empty.');
    return false;
  }
  return true;
}
