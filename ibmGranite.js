const axios = require('axios');
const NodeCache = require('node-cache');

// Cache IAM token for 50 minutes (tokens expire at 60 min)
const tokenCache = new NodeCache({ stdTTL: 3000 });

/**
 * Fetches a fresh IAM access token from IBM Cloud
 */
async function getIAMToken() {
  const cached = tokenCache.get('iam_token');
  if (cached) return cached;

  const apiKey = process.env.IBM_API_KEY;
  if (!apiKey) throw new Error('IBM_API_KEY is not configured');

  const iamUrl = process.env.IBM_IAM_URL || 'https://iam.cloud.ibm.com/identity/token';

  const params = new URLSearchParams();
  params.append('grant_type', 'urn:ibm:params:oauth:grant-type:apikey');
  params.append('apikey', apiKey);

  const response = await axios.post(iamUrl, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });

  const token = response.data.access_token;
  tokenCache.set('iam_token', token);
  return token;
}

/**
 * Sends a chat request to IBM Granite via WatsonX
 * @param {Array} messages - array of {role, content} objects
 * @param {Object} options - optional overrides (temperature, max_tokens, system)
 */
async function chatWithGranite(messages, options = {}) {
  const token = await getIAMToken();

  const apiUrl = process.env.IBM_API_URL ||
    'https://us-south.ml.cloud.ibm.com/ml/v1/text/chat?version=2023-05-29';
  const projectId = process.env.IBM_PROJECT_ID;
  const modelId = process.env.IBM_MODEL_ID || 'ibm/granite-4-h-small';

  if (!projectId) throw new Error('IBM_PROJECT_ID is not configured');

  const systemPrompt = options.system || `You are TravelBot, an expert AI travel planner powered by IBM Granite. 
You help users plan amazing trips by:
- Suggesting personalized destinations based on preferences, budget, and travel style
- Creating detailed day-by-day itineraries with activities, timings, and tips
- Recommending transport options (flights, trains, buses, car rentals)
- Suggesting accommodation (hotels, hostels, Airbnb, resorts) for all budgets
- Providing weather insights and best times to visit
- Sharing local culture, food recommendations, and safety tips
- Estimating costs and helping optimize travel budgets
- Offering packing suggestions and travel checklists

Always be helpful, enthusiastic, and provide actionable, specific recommendations. 
Format responses clearly with bullet points, sections, and practical details.`;

  const payload = {
    model_id: modelId,
    project_id: projectId,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages
    ],
    parameters: {
      temperature: options.temperature || 0.7,
      max_new_tokens: options.max_tokens || 1500,
      top_p: 0.9,
      repetition_penalty: 1.1
    }
  };

  const response = await axios.post(apiUrl, payload, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    timeout: 60000
  });

  const choice = response.data?.choices?.[0];
  if (!choice) throw new Error('No response from IBM Granite model');

  return {
    content: choice.message?.content || '',
    finish_reason: choice.finish_reason,
    usage: response.data.usage || {}
  };
}

module.exports = { chatWithGranite, getIAMToken };
