const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../config/cloudinaryConfig'); // Import Cloudinary config
const Chapter = require('../models/chapterModel');
const Course = require('../models/courseModel');
const authMiddleware = require('../middleware/Auth');

// Configure Multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Create a new chapter
router.post('/', upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'resource', maxCount: 1 }
]), async (req, res) => {
  console.log('Received request to create a new chapter');
  
  try {
    // Log the incoming request body
    console.log('Request body:', req.body);
    console.log('Uploaded files:', req.files);

    const course = await Course.findById(req.body.courseId);
    if (!course) {
      console.log('Course not found:', req.body.courseId);
      return res.status(404).json({ error: 'Course not found' });
    }

    // Upload video to Cloudinary
    const videoResult = await cloudinary.uploader.upload(req.files.video[0].path, { resource_type: 'video' });
    console.log('Video uploaded to Cloudinary:', videoResult.secure_url);

    // Upload resource to Cloudinary
    const resourceResult = await cloudinary.uploader.upload(req.files.resource[0].path);
    console.log('Resource uploaded to Cloudinary:', resourceResult.secure_url);

    const newChapter = new Chapter({
      title: req.body.title,
      description: req.body.description,
      videoUrl: videoResult.secure_url,
      resourceUrl: resourceResult.secure_url,
      course: course._id
    });

    await newChapter.save();
    console.log('New chapter created:', newChapter);

    // Add the chapter to the course
    course.chapters.push(newChapter._id);
    await course.save();
    console.log('Chapter added to course:', course._id);

    res.status(201).json(newChapter);
  } catch (error) {
    console.error('Error creating chapter:', error.message);
    res.status(400).json({ error: error.message });
  }
});


router.put('/:id', authMiddleware, upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'resource', maxCount: 1 }
]), async (req, res) => {
  console.log('Received request to update a chapter');

  try {
    const chapterId = req.params.id;
    const { title, description } = req.body;

    // Log the incoming request body
    console.log('Request body:', req.body);
    console.log('Uploaded files:', req.files);

    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      console.log('Chapter not found:', chapterId);
      return res.status(404).json({ error: 'Chapter not found' });
    }

    // Update basic info
    chapter.title = title || chapter.title;
    chapter.description = description || chapter.description;

    // Update video if provided
    if (req.files && req.files.video) {
      const videoResult = await cloudinary.uploader.upload(req.files.video[0].path, { resource_type: 'video' });
      console.log('New video uploaded to Cloudinary:', videoResult.secure_url);
      chapter.videoUrl = videoResult.secure_url;
    }

    // Update resource if provided
    if (req.files && req.files.resource) {
      const resourceResult = await cloudinary.uploader.upload(req.files.resource[0].path);
      console.log('New resource uploaded to Cloudinary:', resourceResult.secure_url);
      chapter.resourceUrl = resourceResult.secure_url;
    }

    await chapter.save();
    console.log('Chapter updated:', chapter);

    res.status(200).json(chapter);
  } catch (error) {
    console.error('Error updating chapter:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Get all chapters for a specific course
router.get('/', authMiddleware, async (req, res) => {
  const { course } = req.query;

  try {
    const chapters = await Chapter.find({ course }).populate('course', 'title');

    if (!chapters.length) {
      return res.status(404).json({ message: 'No chapters found for this course' });
    }

    res.status(200).json(chapters);
  } catch (error) {
    console.error('Error fetching chapters:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Delete a chapter
router.delete('/:id', async (req, res) => {
  try {
    const chapterId = req.params.id;

    // Find the chapter
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return res.status(404).json({ error: 'Chapter not found' });
    }

    // Remove the chapter from the course
    await Course.updateOne(
      { _id: chapter.course },
      { $pull: { chapters: chapterId } }
    );

    // Delete the chapter using findByIdAndDelete
    await Chapter.findByIdAndDelete(chapterId);
    console.log('Chapter deleted:', chapterId);

    res.status(200).json({ message: 'Chapter deleted successfully' });
  } catch (error) {
    console.error('Error deleting chapter:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
