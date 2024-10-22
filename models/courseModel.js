// File: models/courseModel.js
const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  title: { type: String, required: false },
  chapters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' }]
});

module.exports = mongoose.model('Course', CourseSchema);
