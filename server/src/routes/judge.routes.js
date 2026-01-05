/**
 * Judge Routes
 * Code execution via Judge0 API with rate limiting and security
 */

const express = require('express');
const axios = require('axios');
const https = require('https');
const config = require('../config/env');
const { requireAuth } = require('../middleware/auth.middleware');
const { codeExecutionLimiter } = require('../middleware/rateLimiter.middleware');
const { LANGUAGE_MAP, ERROR_CODES } = require('../config/constants');

const router = express.Router();

// HTTPS agent for SSL handling
const httpsAgent = new https.Agent({
  rejectUnauthorized: config.isProduction, // Strict in production
});

/**
 * POST /api/judge/run
 * Execute code
 */
router.post('/run', requireAuth, codeExecutionLimiter, async (req, res, next) => {
  try {
    const { code, language, input = '' } = req.body;

    // Validate input
    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        error: 'Code is required',
        code: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    if (code.length > config.room.maxFileSize) {
      return res.status(400).json({
        error: `Code exceeds maximum size of ${config.room.maxFileSize / 1024}KB`,
        code: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    const languageId = LANGUAGE_MAP[language?.toLowerCase()];
    if (!languageId) {
      return res.status(400).json({
        error: `Unsupported language: ${language}. Supported: ${Object.keys(LANGUAGE_MAP).join(', ')}`,
        code: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    // Check API key
    if (!config.judge0.apiKey) {
      return res.status(503).json({
        error: 'Code execution service not configured',
        code: ERROR_CODES.INTERNAL_ERROR,
      });
    }

    // Make request to Judge0
    const apiUrl = `${config.judge0.apiUrl}/submissions?base64_encoded=false&wait=true`;
    
    const { data } = await axios.post(apiUrl, {
      source_code: code,
      stdin: input,
      language_id: languageId,
      cpu_time_limit: config.judge0.cpuTimeLimit,
      memory_limit: config.judge0.memoryLimit,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': config.judge0.apiKey,
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
      },
      timeout: config.judge0.timeout,
      httpsAgent,
    });

    // Format response
    const result = {
      stdout: data.stdout || null,
      stderr: data.stderr || null,
      compile_output: data.compile_output || null,
      status: data.status?.description || 'Unknown',
      statusId: data.status?.id,
      time: data.time ? `${data.time}s` : null,
      memory: data.memory ? `${Math.round(data.memory / 1024)}KB` : null,
      exitCode: data.exit_code,
    };

    // Determine if execution was successful
    const isSuccess = data.status?.id === 3; // Accepted

    res.json({
      success: isSuccess,
      ...result,
    });
  } catch (error) {
    // Handle specific errors
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return res.status(504).json({
        error: 'Code execution timed out',
        code: ERROR_CODES.EXECUTION_ERROR,
      });
    }

    if (error.response?.status === 429) {
      return res.status(429).json({
        error: 'Rate limit exceeded. Please try again later.',
        code: ERROR_CODES.RATE_LIMITED,
      });
    }

    if (error.response?.status === 401 || error.response?.status === 403) {
      console.error('Judge0 API authentication error');
      return res.status(503).json({
        error: 'Code execution service temporarily unavailable',
        code: ERROR_CODES.INTERNAL_ERROR,
      });
    }

    console.error('Judge0 error:', error.message);
    return res.status(500).json({
      error: 'Code execution failed',
      code: ERROR_CODES.EXECUTION_ERROR,
    });
  }
});

/**
 * GET /api/judge/languages
 * Get supported languages
 */
router.get('/languages', (req, res) => {
  const languages = Object.entries(LANGUAGE_MAP).reduce((acc, [key, id]) => {
    // Group aliases
    const existing = Object.values(acc).find(l => l.id === id);
    if (existing) {
      existing.aliases.push(key);
    } else {
      acc[key] = { id, name: key, aliases: [key] };
    }
    return acc;
  }, {});

  res.json({
    languages: Object.values(languages).map(l => ({
      id: l.id,
      name: l.aliases[0],
      aliases: l.aliases,
    })),
  });
});

module.exports = router;

