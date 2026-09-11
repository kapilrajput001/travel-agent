const express = require('express');
const router = express.Router();
const { chatWithGranite } = require('../services/ibmGranite');

/**
 * POST /api/itinerary/generate
 * Generate a full travel itinerary
 * Body: { destination, days, budget, travelers, preferences, startDate? }
 */
router.post('/generate', async (req, res) => {
  try {
    const {
      destination,
      days,
      budget,
      travelers = 1,
      preferences = [],
      startDate,
      travelStyle = 'balanced'
    } = req.body;

    if (!destination) return res.status(400).json({ error: 'destination is required' });
    if (!days || days < 1 || days > 30) return res.status(400).json({ error: 'days must be between 1 and 30' });
    if (!budget) return res.status(400).json({ error: 'budget is required' });

    const prefText = preferences.length > 0 ? preferences.join(', ') : 'sightseeing, local food, culture';
    const dateText = startDate ? `starting from ${startDate}` : '';

    const prompt = `Create a detailed ${days}-day travel itinerary for ${destination} ${dateText}.

Trip Details:
- Budget: ${budget} USD total for ${travelers} traveler(s)
- Travel Style: ${travelStyle}
- Interests: ${prefText}

Please provide:
1. **Overview** - Brief intro to the destination and trip highlights
2. **Day-by-Day Itinerary** - For each day include:
   - Morning, Afternoon, Evening activities
   - Specific attractions with visiting hours
   - Meal recommendations (breakfast, lunch, dinner with estimated cost)
   - Transport between locations
3. **Accommodation Recommendations** - 3 options across budget ranges with price per night
4. **Transport Guide** - How to get there and get around
5. **Budget Breakdown** - Estimated costs (accommodation, food, transport, activities)
6. **Essential Tips** - Best time to visit, local customs, safety, must-pack items
7. **Top 5 Must-Do Experiences**

Format with clear headings, emojis for visual appeal, and specific details.`;

    const result = await chatWithGranite(
      [{ role: 'user', content: prompt }],
      { max_tokens: 2000, temperature: 0.7 }
    );

    res.json({
      success: true,
      itinerary: {
        destination,
        days,
        budget,
        travelers,
        travelStyle,
        preferences,
        startDate: startDate || null,
        content: result.content,
        generatedAt: new Date().toISOString()
      },
      usage: result.usage
    });

  } catch (err) {
    console.error('[Itinerary Error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/itinerary/optimize
 * Optimize an existing itinerary
 * Body: { itinerary: string, constraints: string }
 */
router.post('/optimize', async (req, res) => {
  try {
    const { itinerary, constraints } = req.body;
    if (!itinerary) return res.status(400).json({ error: 'itinerary is required' });

    const prompt = `Please optimize and improve this travel itinerary based on the following constraints/feedback:

CONSTRAINTS/FEEDBACK: ${constraints || 'Make it more time-efficient and cost-effective'}

CURRENT ITINERARY:
${itinerary}

Provide an optimized version with:
- Better time management
- Cost-saving suggestions
- Logical flow between locations
- Any missed highlights to add`;

    const result = await chatWithGranite(
      [{ role: 'user', content: prompt }],
      { max_tokens: 2000 }
    );

    res.json({
      success: true,
      optimizedItinerary: result.content,
      usage: result.usage
    });

  } catch (err) {
    console.error('[Optimize Error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/itinerary/packing-list
 * Generate a packing list
 * Body: { destination, days, season, activities }
 */
router.post('/packing-list', async (req, res) => {
  try {
    const { destination, days, season, activities = [] } = req.body;
    if (!destination) return res.status(400).json({ error: 'destination is required' });

    const prompt = `Create a comprehensive packing list for a ${days || 7}-day trip to ${destination} in ${season || 'moderate weather'}.

Activities planned: ${activities.join(', ') || 'general sightseeing'}

Organize the list by category:
- 👕 Clothing & Footwear
- 🧴 Toiletries & Health
- 📱 Electronics & Gadgets  
- 📄 Documents & Money
- 🎒 Bag & Travel Accessories
- 💊 Medications & First Aid
- 🌍 Destination-Specific Items

Mark essential items with ⭐ and optional items with ○.`;

    const result = await chatWithGranite(
      [{ role: 'user', content: prompt }],
      { max_tokens: 1200 }
    );

    res.json({
      success: true,
      packingList: result.content,
      destination,
      days,
      usage: result.usage
    });

  } catch (err) {
    console.error('[Packing List Error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
