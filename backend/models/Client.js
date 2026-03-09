const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const clientSchema = new mongoose.Schema({
    // Basic Info
    companyName: {
        type: String,
        required: true,
        trim: true
    },
    
    // Authentication
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    
    // Role
    role: {
        type: String,
        default: 'client',
        immutable: true
    },
    
    // Status
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    },
    
    // Company Details
    industry: String,
    website: String,
    overview: String,
    employeeCount: String,
    revenue: String,
    potentialValue: Number,
    
    // Location
    fullLocation: {
        city: String,
        state: String,
        country: String,
        address: String
    },
    
    // Research
    currentTechStack: String,
    currentPainPoints: String,
    
    // Assigned Projects
    assignedProjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    }],
    
    // Dashboard Data
    projectHealthScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    
    // Timestamps
    lastLogin: Date,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Hash password before saving
clientSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
clientSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Don't return password in queries
clientSchema.methods.toJSON = function() {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

module.exports = mongoose.model('Client', clientSchema);
