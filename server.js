const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const path = require('path');

const app = express();


app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 5000;

// Your MongoDB connection string
const MONGODB_URI = 'mongodb+srv://harshalbansod88_db_user:miSN6C70mLjZF2tX@cluster0.455dxaz.mongodb.net/leaderboardDB?retryWrites=true&w=majority';

let db;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Test route


// Connect to MongoDB
async function connectDB() {
  try {
    console.log('Connecting to MongoDB...');
    const client = new MongoClient(MONGODB_URI, {
      tlsAllowInvalidCertificates: true,
      tlsAllowInvalidHostnames: true
    });
    await client.connect();
    db = client.db('leaderboardDB');
    console.log('✅ Connected to MongoDB Atlas!');
    
    // Insert dummy data
    const count = await db.collection('scores').countDocuments();
    console.log(`Current records: ${count}`);
    
    if (count === 0) {
      const dummyData = [
        { name: '', score: 0, timestamp: new Date() },
        
      ];
      
      //await db.collection('scores').insertMany(dummyData);
      console.log('✅ Dummy data inserted!');
    }
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
  }
}

// API Routes
app.get('/api/leaderboard', async (req, res) => {
  try {
    const scores = await db.collection('scores')
      .find()
      .sort({ score: -1 })
      .limit(10)
      .toArray();
    res.json(scores);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

app.get('/api/debug', async (req, res) => {
  try {
    const allData = await db.collection('scores').find().toArray();
    const count = await db.collection('scores').countDocuments();
    res.json({
      message: 'Debug info',
      database: 'leaderboardDB',
      collection: 'scores',
      totalRecords: count,
      data: allData
    });
  } catch (error) {
    res.status(500).json({ error: 'Debug failed' });
  }
});

app.post('/api/score', async (req, res) => {
  try {
    const { name, score } = req.body;
    
    if (!name || !score) {
      return res.status(400).json({ error: 'Name and score required' });
    }
    
    const result = await db.collection('scores').insertOne({
      name: name.trim(),
      score: parseInt(score),
      timestamp: new Date()
    });
    
    res.json({ success: true, id: result.insertedId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add score' });
  }
});

// Start server
async function startServer() {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Leaderboard: http://localhost:${PORT}/api/leaderboard`);
    console.log(`🐛 Debug: http://localhost:${PORT}/api/debug`);
  });
}

startServer().catch(console.error);