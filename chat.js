const express = require('express');
const router = express.Router();
const { chatWithGranite } = require('../services/ibmGranite');

/**
 * POST /api/chat
 * General travel chat endpoint
 * Body: { messages: [{role, content}], sessionId? }
 */
router.post('/', async (req, res) => {
  try {
    const { messages, sessionId } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    // Validate message format
    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        return res.status(400).json({ error: 'Each message must have role and content' });
      }
      if (!['user', 'assistant'].includes(msg.role)) {
        return res.status(400).json({ error: 'Message role must be "user" or "assistant"' });
      }
    }

    const result = await chatWithGranite(messages);

    res.json({
      success: true,
      message: {
        role: 'assistant',
        content: result.content
      },
      usage: result.usage,
      sessionId: sessionId || null
    });

  } catch (err) {
    console.error('[Chat Error]', err.message);
    const status = err.response?.status || 500;
    const message = err.response?.data?.errors?.[0]?.message || err.message;
    res.status(status).json({ error: message });
  }
});

/**
 * POST /api/chat/quick
 * Single-message quick reply (no history needed)
 * Body: { prompt: string }
 */
router.post('/quick', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'prompt string is required' });
    }

    const result = await chatWithGranite([{ role: 'user', content: prompt }]);

    res.json({
      success: true,
      response: result.content,
      usage: result.usage
    });

  } catch (err) {
    console.error('[Quick Chat Error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
