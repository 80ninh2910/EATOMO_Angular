const express = require('express');
const router = express.Router();
const bowlController = require('../controllers/bowl.controller');

// Public routes
router.get('/', bowlController.getBowls);
router.get('/:id', bowlController.getBowlById);

module.exports = router;
