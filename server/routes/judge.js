const express = require('express');
const axios = require('axios');
const cors = require('cors');
const https = require('https');

const router = express.Router();
router.use(cors());
router.use(express.json({ limit: '1mb' })); // Limit request body size

const JUDGE0_API = 'https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true';
const API_KEY = process.env.JUDGE0_API_KEY || '8c1aff0f98msh84e9799e74df047p1e0f23jsn01ec288b5f21';

// HTTPS agent to handle SSL certificate issues
const httpsAgent = new https.Agent({
  rejectUnauthorized: false // Allow self-signed certificates (for development)
});

// Timeout configuration (in milliseconds)
const JUDGE0_TIMEOUT = 30000; // 30 seconds max wait for code execution

const languageMap = {
  js: 93,
  c: 50,
  cpp: 54,
  java: 62,
  python: 71
};

router.post('/run', async (req, res) => {
  const { code, language, input } = req.body;
  const language_id = languageMap[language];

  // Validate required fields
  if (!code || !language_id) {
    return res.status(400).json({ error: 'Missing required fields: code and language' });
  }

  try {
    const { data } = await axios.post(JUDGE0_API, {
      source_code: code,
      stdin: input || '',
      language_id,
      cpu_time_limit: 10, // Max 10 seconds CPU time
      memory_limit: 128000 // 128MB memory limit
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
      },
      timeout: JUDGE0_TIMEOUT, // Prevent hanging requests
      httpsAgent // Handle SSL certificate issues
    });

    res.json({
      stdout: data.stdout,
      stderr: data.stderr,
      error: data.compile_output,
      status: data.status?.description,
      time: data.time,
      memory: data.memory
    });
  } catch (error) {
    // Handle different error types
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return res.status(504).json({ error: 'Code execution timed out. Try simplifying your code.' });
    }
    if (error.response?.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again in a moment.' });
    }
    console.error('Judge0 API Error:', error.message);
    res.status(500).json({ error: 'Code execution failed. Please try again.' });
  }
});

module.exports = router;
