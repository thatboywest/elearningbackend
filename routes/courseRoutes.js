const express = require('express');
const router = express.Router();
const Course = require('../models/courseModel');
const Chapter = require('../models/chapterModel');

router.post('/', async (req, res) => {
  try {
    const { title, chapters } = req.body;

    const newCourse = new Course({
      title,
      chapters,
    });

    await newCourse.save();
    res.status(201).json(newCourse);
  } catch (error) {
    console.error('Error creating course:', error.message);
    res.status(400).json({ error: error.message });
  }
});


// Get all courses
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find().populate('chapters');
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single course by ID with chapters
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('chapters');
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a course and its associated chapters
router.delete('/:id', async (req, res) => {
  try {
    const courseId = req.params.id;
    const course = await Course.findById(courseId).populate('chapters');
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    // Delete associated chapters
    await Chapter.deleteMany({ _id: { $in: course.chapters } });
    await Course.findByIdAndDelete(courseId);
    res.status(200).json({ message: 'Course and associated chapters deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a course (title only, chapters managed separately)
router.put('/:id', async (req, res) => {
  try {
    const { title } = req.body;
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    if (title) {
      course.title = title;
    }
    
    await course.save();
    res.status(200).json(course);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
