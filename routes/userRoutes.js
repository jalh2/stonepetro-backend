const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Public routes
router.post('/login', userController.login);

// Protected routes
router.post('/', userController.create);
router.get('/', userController.getAll);
router.get('/profile/:id', userController.getProfile);
router.get('/:id/password', userController.getPassword);
router.put('/:id/password', userController.updatePassword);
router.put('/:id', userController.update);
router.delete('/:id', userController.delete);

module.exports = router;
