const Client = require('../models/Client');
const User = require('../models/User');

// @desc    Create new client
// @route   POST /api/clients
// @access  Private (HR, CEO, Company Lead)
const createClient = async (req, res) => {
    try {
        const {
            companyName,
            email,
            password,
            industry,
            website,
            overview,
            employeeCount,
            revenue,
            potentialValue,
            fullLocation,
            currentTechStack,
            currentPainPoints
        } = req.body;

        // Check if client email already exists
        const existingClient = await Client.findOne({ email });
        if (existingClient) {
            return res.status(400).json({
                success: false,
                message: 'Client with this email already exists'
            });
        }

        // Check if email exists in User model
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists in system'
            });
        }

        // Create client
        const client = await Client.create({
            companyName,
            email,
            password,
            industry,
            website,
            overview,
            employeeCount,
            revenue,
            potentialValue,
            fullLocation,
            currentTechStack,
            currentPainPoints,
            createdBy: req.user._id,
            status: 'active'
        });

        res.status(201).json({
            success: true,
            message: 'Client created successfully',
            data: client
        });

    } catch (error) {
        console.error('Create client error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create client',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

// @desc    Get all clients
// @route   GET /api/clients
// @access  Private
const getAllClients = async (req, res) => {
    try {
        const clients = await Client.find()
            .populate('assignedProjects', 'projectName status')
            .populate('createdBy', 'firstName lastName')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: clients.length,
            data: clients
        });

    } catch (error) {
        console.error('Get clients error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch clients',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

// @desc    Get single client
// @route   GET /api/clients/:id
// @access  Private
const getClient = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id)
            .populate('assignedProjects')
            .populate('createdBy', 'firstName lastName');

        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        res.status(200).json({
            success: true,
            data: client
        });

    } catch (error) {
        console.error('Get client error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch client',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

// @desc    Update client
// @route   PUT /api/clients/:id
// @access  Private
const updateClient = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);

        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        // Don't allow email update if it exists in another client
        if (req.body.email && req.body.email !== client.email) {
            const existingClient = await Client.findOne({ email: req.body.email });
            if (existingClient) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists'
                });
            }
        }

        // Update fields
        const fieldsToUpdate = [
            'companyName', 'industry', 'website', 'overview',
            'employeeCount', 'revenue', 'potentialValue',
            'fullLocation', 'currentTechStack', 'currentPainPoints',
            'status', 'projectHealthScore', 'assignedProjects'
        ];

        fieldsToUpdate.forEach(field => {
            if (req.body[field] !== undefined) {
                client[field] = req.body[field];
            }
        });

        // Handle password update separately
        if (req.body.password) {
            client.password = req.body.password;
        }

        await client.save();

        res.status(200).json({
            success: true,
            message: 'Client updated successfully',
            data: client
        });

    } catch (error) {
        console.error('Update client error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update client',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

// @desc    Delete client
// @route   DELETE /api/clients/:id
// @access  Private
const deleteClient = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);

        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        await client.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Client deleted successfully'
        });

    } catch (error) {
        console.error('Delete client error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete client',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

// @desc    Get client dashboard data (for logged in client)
// @route   GET /api/clients/dashboard
// @access  Private (Client only)
const getClientDashboard = async (req, res) => {
    try {
        const client = await Client.findById(req.user._id)
            .populate('assignedProjects');

        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        // Return dashboard data
        res.status(200).json({
            success: true,
            data: {
                client: {
                    id: client._id,
                    companyName: client.companyName,
                    email: client.email,
                    projectHealthScore: client.projectHealthScore,
                    assignedProjects: client.assignedProjects
                },
                // Additional dashboard data will be added here
                actionRequired: [],
                teamPulse: {},
                recentDeliverables: [],
                updates: [],
                meetings: []
            }
        });

    } catch (error) {
        console.error('Get dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard data',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

module.exports = {
    createClient,
    getAllClients,
    getClient,
    updateClient,
    deleteClient,
    getClientDashboard
};
