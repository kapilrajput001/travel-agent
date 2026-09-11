const express = require('express');
const router = express.Router();
const { chatWithGranite } = require('../services/ibmGranite');

/**
 * POST /api/destinations/suggest
 * Suggest travel destinations based on user preferences
 * Body: { budget, duration, interests, travelStyle, departingFrom, season }
 */
router.post('/suggest', async (req, res) => {
  try {
    const {
      budget,
      duration,
      interests = [],
      travelStyle = 'balanced',
      departingFrom,
      season,
      travelers = 1
    } = req.body;

    const prompt = `Suggest 6 amazing travel destinations for someone with the following preferences:

- Budget: ${budget || 'flexible'} USD for ${travelers} traveler(s)
- Trip Duration: ${duration || '7-10'} days
- Interests: ${interests.length > 0 ? interests.join(', ') : 'culture, food, nature, adventure'}
- Travel Style: ${travelStyle}
- Departing From: ${departingFrom || 'flexible'}
- Best Season: ${season || 'any'}

For each destination provide:
1. **Destination Name & Country** with flag emoji
2. **Why It's Perfect** - 2-3 sentences tailored to their preferences
3. **Estimated Cost** - per person for the specified duration
4. **Best Time to Visit**
5. **Top 3 Highlights**
6. **Vibe** - (Adventure/Relaxation/Culture/Romance/Family/Budget-Friendly)
7. **Getting There** - main transport options
8. **Hidden Gem Tip** - one insider tip

Present as an exciting, inspiring list that makes them want to book immediately!`;

    const result = await chatWithGranite(
      [{ role: 'user', content: prompt }],
      { max_tokens: 1800, temperature: 0.8 }
    );

    res.json({
      success: true,
      destinations: result.content,
      searchParams: { budget, duration, interests, travelStyle, departingFrom, season },
      usage: result.usage
    });

  } catch (err) {
    console.error('[Destinations Error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/destinations/popular
 * Get popular destinations info
 */
router.get('/popular', async (req, res) => {
  try {
    const prompt = `List the top 10 most popular travel destinations in the world right now. 

For each destination include:
- 🌍 Destination & Country
- ✨ What makes it special (1 sentence)
- 💰 Budget Level (Budget/Mid-Range/Luxury)
- 🗓️ Best Month to Visit
- ⭐ Traveler Rating (out of 5)

Format as a clean, scannable list.`;

    const result = await chatWithGranite(
      [{ role: 'user', content: prompt }],
      { max_tokens: 800, temperature: 0.5 }
    );

    res.json({
      success: true,
      popular: result.content,
      usage: result.usage
    });

  } catch (err) {
    console.error('[Popular Destinations Error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/destinations/info
 * Get detailed info about a specific destination
 * Body: { destination }
 */
router.post('/info', async (req, res) => {
  try {
    const { destination } = req.body;
    if (!destination) return res.status(400).json({ error: 'destination is required' });

    const prompt = `Give me comprehensive travel information about ${destination}:

📍 **Overview** - Geography, culture, language, currency
🌡️ **Climate & Best Time** - Month-by-month weather guide
💰 **Cost of Living** - Daily budget estimates (budget/mid/luxury)
🚌 **Getting There & Around** - Flights, local transport
🏨 **Where to Stay** - Neighborhoods and accommodation types
🍜 **Food & Cuisine** - Must-try dishes and dining tips
🎯 **Top Attractions** - Famous sights and hidden gems
🎭 **Local Culture** - Customs, etiquette, dress code
⚠️ **Safety & Health** - Travel advisories and health tips
📋 **Visa & Entry** - Requirements for most nationalities
🌐 **Useful Phrases** - If non-English speaking destination`;

    const result = await chatWithGranite(
      [{ role: 'user', content: prompt }],
      { max_tokens: 1500, temperature: 0.5 }
    );

    res.json({
      success: true,
      destination,
      info: result.content,
      usage: result.usage
    });

  } catch (err) {
    console.error('[Destination Info Error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
