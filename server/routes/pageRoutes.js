const express = require('express');
const router = express.Router();
const Page = require('../models/Page');

// GET all pages
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    
    const pages = await Page.find(filter).sort({ createdAt: -1 });
    res.json(pages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET single page by slug
router.get('/:slug', async (req, res) => {
  try {
    // try finding by slug first, or id if it matches ObjectId format
    let page = await Page.findOne({ slug: req.params.slug });
    
    if (!page && req.params.slug.match(/^[0-9a-fA-F]{24}$/)) {
      page = await Page.findById(req.params.slug);
    }
    
    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }
    res.json(page);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST create new page
router.post('/', async (req, res) => {
  try {
    const page = new Page(req.body);
    const savedPage = await page.save();
    res.status(201).json(savedPage);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
});

// PUT update page
router.put('/:id', async (req, res) => {
  try {
    const updatedPage = await Page.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedPage) {
      return res.status(404).json({ message: 'Page not found' });
    }
    res.json(updatedPage);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
});

// DELETE page
router.delete('/:id', async (req, res) => {
  try {
    const deletedPage = await Page.findByIdAndDelete(req.params.id);
    if (!deletedPage) {
      return res.status(404).json({ message: 'Page not found' });
    }
    res.json({ message: 'Page deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
