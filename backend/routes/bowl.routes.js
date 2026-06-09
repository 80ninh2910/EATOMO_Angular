const express = require('express');
const router = express.Router();
const bowlController = require('../controllers/bowl.controller');

// Public routes
// NOTE: /featured MUST be declared before /:id to prevent Express treating 'featured' as an id param
router.get('/featured', bowlController.getFeaturedBowls);
router.get('/', bowlController.getBowls);
router.get('/:id', bowlController.getBowlById);

module.exports = router;
