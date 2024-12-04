require('dotenv').config();
const express = require('express');
const connectDB = require('./db/dbConnection');
const User = require('./db/user');
const cors = require('cors');
const bcrypt = require('bcrypt');
const axios = require('axios');

const app = express();
const port = 8000;

// Middleware for parsing JSON
app.use(express.json());

// Enable Cors
app.use(cors());

// Registration endpoint
app.post('/register', async (req, res) => {
    try {
        const {
            username,
            password,
            email,
            name,
            nationality,
            age,
            mobile,
        } = req.body;

  
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ msg: 'Username already exists' });

        const existingEmail = await User.findOne({ email });
        if (existingEmail) return res.status(400).json({ msg: 'Email already exists' });

        const existingMobile = await User.findOne({ mobile });
        if (existingMobile) return res.status(400).json({ msg: 'Mobile number already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            username,
            password: hashedPassword,
            email,
            name,
            nationality,
            age: parseInt(age),
            mobile,
        });

        await user.save();
        res.status(201).json({ message: 'Registration Successful' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Registration Failed' });
    }
});

// Login endpoint
app.post('/', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(401).json({ error: 'Username not found' });
        }

        if (!(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid Credentials' });
        }

        res.status(200).json({ message: 'Login Successful' });
    } catch (error) {
        res.status(500).json({ error: 'Login Failed' });
    }
});


async function fetchFareFromAPI(trainNo, fromStationCode, toStationCode) {
    const options = {
        method: 'GET',
        url: 'https://irctc1.p.rapidapi.com/api/v2/getFare',
        params: {
            trainNo,
            fromStationCode,
            toStationCode
        },
        headers: {
            'x-rapidapi-key': 'a9e8868e88msh37526e741889fc1p18b7f1jsnbd02a5ecfc58',
            'x-rapidapi-host': 'irctc1.p.rapidapi.com'
        }
    };

    try {
        const response = await axios.request(options);
        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch fare details');
    }
}

// Endpoint to fetch fare details
app.get('/fare', async (req, res) => {
    const { trainNo, fromStationCode, toStationCode } = req.query;

    try {
        const fareDetails = await fetchFareFromAPI(trainNo, fromStationCode, toStationCode);
        res.status(200).json({ fare: fareDetails });
    } catch (error) {
        console.error('Error fetching fare details:', error);
        res.status(500).json({ error: 'Failed to fetch fare details' });
    }
});


async function fetchPNRStatusFromAPI(pnr) {
    const options = {
        method: 'GET',
        url: 'https://irctc1.p.rapidapi.com/api/v3/getPNRStatus',
        params: { pnrNumber: pnr },
        headers: {
            'x-rapidapi-key': 'a9e8868e88msh37526e741889fc1p18b7f1jsnbd02a5ecfc58',
            'x-rapidapi-host': 'irctc1.p.rapidapi.com'
        }
    };

    try {
        const response = await axios.request(options);
        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch PNR status');
    }
}

// Endpoint to fetch PNR status
app.get('/pnr/:pnr', async (req, res) => {
    const { pnr } = req.params;

    try {
        const pnrStatus = await fetchPNRStatusFromAPI(pnr);
        res.status(200).json({ status: pnrStatus });
    } catch (error) {
        console.error('Error fetching PNR status:', error);
        res.status(500).json({ error: 'Failed to fetch PNR status' });
    }
});

connectDB();

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
