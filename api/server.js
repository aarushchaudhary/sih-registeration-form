// =======================================================
//  Imports
// =======================================================
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // <-- IMPORTANT: Add bcryptjs
const path = require('path');
const serverless = require('serverless-http');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Import Mongoose models
const Team = require('./models/Team');
const Admin = require('./models/Admin'); // <-- Your new Admin model

// =======================================================
//  App Initialization
// =======================================================
const app = express();
const router = express.Router();

// =======================================================
//  Middleware
// =======================================================
app.use(cors());
app.use(express.json());
// Serve static files locally for development (Netlify will serve /public in production)
app.use(express.static(path.join(__dirname, '..', 'public')));

// =======================================================
//  Database Connection
// =======================================================
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected successfully.'))
    .catch(err => console.error('MongoDB connection error:', err));

// =======================================================
//  JWT Middleware
// =======================================================
const protect = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Find the admin user from the token's payload
        const admin = await Admin.findById(decoded.id);

        // Check if the user exists and if the token matches the active session token
        if (!admin || admin.activeSessionToken !== token) {
            return res.status(401).json({ message: 'Unauthorized: Session is invalid.' });
        }

        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Forbidden: Token is not valid' });
    }
};

// =======================================================
//  API Routes
// =======================================================
router.get('/stats', async (req, res) => {
    try {
        const teamsRegistered = await Team.countDocuments({});

        res.json({
            teamsRegistered: teamsRegistered,
            registrationsOpen: true,
            membersPerTeam: 6
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching stats', error: error.message });
    }
});


router.post('/register', async (req, res) => {
    try {
        const newTeamData = req.body;
        
        // --- GENDER VALIDATION ---
        const members = newTeamData.members || [];
        const hasGirl = members.some(member => member.gender === 'Girl');

        if (!hasGirl) {
            return res.status(400).json({
                message: 'The team must include at least one girl.'
            });
        }

        const newTeam = new Team(newTeamData);
        await newTeam.save();
        res.status(201).json({ message: 'Team registered successfully.' });
    } catch (error) {
        console.error("REGISTRATION ERROR:", error); 
        res.status(400).json({ message: 'Registration failed. The team name might already be taken.', error: error.message });
    }
});

// --- NEW DATABASE-DRIVEN LOGIN ROUTE ---
router.post('/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const admin = await Admin.findOne({ username });
        if (!admin) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // 1. Create a new token
        const token = jwt.sign({ id: admin._id, username: admin.username }, process.env.JWT_SECRET, { expiresIn: '8h' });

        // 2. Save the new token as the only active session
        admin.activeSessionToken = token;
        await admin.save();

        // 3. Send the new token to the user
        res.json({ success: true, token });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error during login.' });
    }
});

// --- OTHER ADMIN ROUTES ---
router.get('/admin/teams', protect, async (req, res) => {
    try {
        const teams = await Team.find().sort({ registrationDate: -1 });
        res.json(teams);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching teams' });
    }
});

router.delete('/admin/teams/:id', protect, async (req, res) => {
    try {
        const team = await Team.findByIdAndDelete(req.params.id);
        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }
        res.json({ success: true, message: 'Team deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting team', error: error.message });
    }
});


// =======================================================
//  Routing Setup (Netlify vs Local Dev)
// =======================================================
const isNetlify = !!process.env.NETLIFY || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

if (isNetlify) {
    // On Netlify, expose routes under the serverless path
    app.use('/.netlify/functions/server', router);
    // Also mount at root because Netlify passes the path relative to the function
    app.use('/', router);
    // And mount at /api to be resilient to proxies that preserve the /api prefix
    app.use('/api', router);
    module.exports.handler = serverless(app);
} else {
    // Local development: expose routes at /api and start a server
    app.use('/api', router);
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running locally at http://localhost:${PORT}`));
}