const express = require('express');
const axios = require('axios');
const cors = require('cors');

const router = express.Router();
router.use(cors());
router.use(express.json());

const JUDGE0_API = 'https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true';
const API_KEY = '8c1aff0f98msh84e9799e74df047p1e0f23jsn01ec288b5f21'; // Don't expose in frontend!

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

  try {
    const { data } = await axios.post(JUDGE0_API, {
      source_code: code,
      stdin: input,
      language_id
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
      }
    });

    res.json({
      stdout: data.stdout,
      stderr: data.stderr,
      error: data.compile_output
    });
  } catch (error) {
    res.status(500).json({ error: 'Judge0 API Error' });
  }
});

module.exports = router;
