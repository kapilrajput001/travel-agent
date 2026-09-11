const express = require('express');
const router = express.Router();
const { chatWithGranite } = require('../services/ibmGranite');

/**
 * POST /api/weather/advice
 * Get weather-based travel advice for a destination
 * Body: { destination, month, duration }
 */
router.post('/advice', async (req, res) => {
  try {
    const { destination, month, duration } = req.body;
    if (!destination) return res.status(400).json({ error: 'destination is required' });

    const travelMonth = month || new Date().toLocaleString('default', { month: 'long' });

    const prompt = `Provide detailed weather and climate travel advice for ${destination} in ${travelMonth} for a ${duration || 7}-day trip:

🌡️ **Weather Summary** - Temperature ranges (day/night), humidity, rainfall
☀️ **What to Expect** - Typical daily conditions during the trip
🌧️ **Weather Risks** - Any extreme weather or seasonal concerns
👕 **What to Wear** - Clothing recommendations for the weather
🎒 **Weather-Related Packing** - Essential items for the climate
📅 **Best Time Comparison** - How ${travelMonth} compares to other months
💡 **Weather Tips** - Practical advice for navigating local weather
🏖️ **Activity Recommendations** - Best outdoor activities for this weather
⚠️ **Warnings** - Any weather alerts or seasonal events to know about

Also mention if this is peak/off-peak season and how it affects prices and crowds.`;

    const result = await chatWithGranite(
      [{ role: 'user', content: prompt }],
      { max_tokens: 1000, temperature: 0.4 }
    );

    res.json({
      success: true,
      destination,
      month: travelMonth,
      duration,
      weatherAdvice: result.content,
      usage: result.usage
    });

  } catch (err) {
    console.error('[Weather Error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/weather/best-time
 * Find the best time to visit a destination
 * Body: { destination, preferences }
 */
router.post('/best-time', async (req, res) => {
  try {
    const { destination, preferences = [] } = req.body;
    if (!destination) return res.status(400).json({ error: 'destination is required' });

    const prompt = `What is the best time to visit ${destination}? 

Consider these traveler preferences: ${preferences.join(', ') || 'good weather, fewer crowds, reasonable prices'}

Provide a month-by-month breakdown:
- 🟢 Best months (with reasons)
- 🟡 Good months (acceptable conditions)
- 🔴 Avoid months (with reasons)

Also include:
- Festival/event calendar that might influence timing
- Price seasonality (when is cheapest vs most expensive)
- Crowd levels throughout the year
- Weather patterns and what to expect each season`;

    const result = await chatWithGranite(
      [{ role: 'user', content: prompt }],
      { max_tokens: 900, temperature: 0.4 }
    );

    res.json({
      success: true,
      destination,
      bestTimeAdvice: result.content,
      usage: result.usage
    });

  } catch (err) {
    console.error('[Best Time Error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
