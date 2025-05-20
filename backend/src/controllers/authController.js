// File: backend/src/controllers/authController.js
const jwt = require('jsonwebtoken'); // For simulating token generation
const { users } = require('../data/dummyData'); // Load dummy users

const JWT_SECRET = 'mock-jwt-secret-for-presentation'; // Mock secret
const JWT_EXPIRES_IN = '1h';

exports.register = (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }
    const existingUser = users.find(u => u.username === username);
    if (existingUser) {
        return res.status(409).json({ message: 'Username already exists (mock).' });
    }
    // In a mockup, we don't need to hash passwords. Just add to the array.
    const newUser = { id: `user${users.length + 1}`, username, password, role: 'user' }; // Simple ID and role
    users.push(newUser);
    console.log('Mock Register: New user added', newUser);
    console.log('Current users:', users);
    res.status(201).json({ message: 'Mock registration successful.', userId: newUser.id });
};

exports.login = (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }
    // For mockup, a very simple check. In real app, use bcrypt.compare with hashed passwords.
    const user = users.find(u => u.username === username && u.password === password); // Direct password check for mock

    if (!user) {
        // Try finding by username only to give a slightly more specific mock error
        if (!users.find(u => u.username === username)) {
             return res.status(401).json({ message: 'Mock login failed: User not found.' });
        }
        return res.status(401).json({ message: 'Mock login failed: Incorrect password.' });
    }

    const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
    console.log('Mock Login: User logged in', user.username);
    res.json({ 
        message: 'Mock login successful.', 
        token, 
        user: { id: user.id, username: user.username, role: user.role }
    });
};