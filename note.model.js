// note.model.js

import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const noteSchema = new Schema({
  title: { type: String, required: true, maxlength: 255 },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Enable text indexing on title and content
noteSchema.index({ title: 'text', content: 'text' });

const Note = model('Note', noteSchema);

export default Note;

