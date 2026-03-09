const express = require('express');
const router = express.Router();
const {
    createClient,
    getAllClients,
    getClient,
    updateClient,
    deleteClient,
    getClientDashboard
} = require('../controllers/clientController');
const { protect } = require('../middleware/auth');

// Client dashboard (for logged in clients)
router.get('/dashboard', protect, getClientDashboard);

// CRUD routes (for internal staff)
router.route('/')
    .get(protect, getAllClients)
    .post(protect, createClient);

router.route('/:id')
    .get(protect, getClient)
    .put(protect, updateClient)
    .delete(protect, deleteClient);

module.exports = router;
