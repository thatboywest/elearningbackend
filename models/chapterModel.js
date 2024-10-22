// File: models/chapterModel.js
const mongoose = require('mongoose');

const ChapterSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true }, 
  videoUrl: { type: String, required: true },
  resourceUrl: { type: String, required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true }
});

module.exports = mongoose.model('Chapter', ChapterSchema);
