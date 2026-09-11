/* =============================================
   TRAVEL PLANNER AGENT — Frontend JavaScript
   IBM Granite AI Powered
   ============================================= */

const API_BASE = window.location.origin + '/api';

// =============================================
// STATE
// =============================================
let chatHistory = [];
let isLoading = false;

// =============================================
// INIT
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initChatInput();
  checkHealth();
  setCurrentMonth();
});

// =============================================
// NAVIGATION
// =============================================
function initNav() {
  const navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      switchTab(tab);
    });
  });
}

function switchTab(tab) {
  // Update nav buttons
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

  // Update tab content
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');

  // Hide hero on non-chat tabs
  const hero = document.getElementById('heroSection');
  if (hero) hero.style.display = tab === 'chat' ? 'block' : 'none';
}

// =============================================
// HEALTH CHECK
// =============================================
async function checkHealth() {
  const badge = document.getElementById('statusBadge');
  const dot = badge.querySelector('.status-dot');
  const text = badge.querySelector('.status-text');
  try {
    const res = await fetch(`${API_BASE}/health`);
    const data = await res.json();
    if (data.status === 'ok') {
      dot.className = 'status-dot online';
      text.textContent = 'IBM Granite Online';
    } else {
      throw new Error('Not OK');
    }
  } catch {
    dot.className = 'status-dot offline';
    text.textContent = 'Offline';
  }
}

// =============================================
// CHAT
// =============================================
function initChatInput() {
  const input = document.getElementById('chatInput');
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChat();
    }
  });
}

function setQuickPrompt(prompt) {
  // Switch to chat tab
  switchTab('chat');
  const input = document.getElementById('chatInput');
  input.value = prompt;
  input.focus();
  // Auto-send after small delay
  setTimeout(() => sendChat(), 100);
}

async function sendChat() {
  if (isLoading) return;

  const input = document.getElementById('chatInput');
  const message = input.value.trim();
  if (!message) return;

  input.value = '';

  // Add user message to UI
  appendMessage('user', message);

  // Add to history
  chatHistory.push({ role: 'user', content: message });

  // Show typing indicator
  const typingId = showTypingIndicator();

  // Disable send button
  setLoading(true, false);

  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: chatHistory })
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Failed to get response');

    // Remove typing indicator
    removeTypingIndicator(typingId);

    const botMessage = data.message.content;

    // Add to history
    chatHistory.push({ role: 'assistant', content: botMessage });

    // Keep history manageable (last 20 messages)
    if (chatHistory.length > 20) {
      chatHistory = chatHistory.slice(-20);
    }

    // Render bot response
    appendMessage('bot', botMessage);

  } catch (err) {
    removeTypingIndicator(typingId);
    appendMessage('bot', `❌ **Error:** ${err.message}\n\nPlease check the server is running and your IBM API key is configured correctly.`);
    showToast(err.message, 'error');
  } finally {
    setLoading(false, false);
  }
}

function appendMessage(role, content) {
  const container = document.getElementById('chatMessages');

  const wrapper = document.createElement('div');
  wrapper.className = `message ${role === 'user' ? 'user-message' : 'bot-message'}`;

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = role === 'user' ? '👤' : '🤖';

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.innerHTML = markdownToHTML(content);

  wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);
  container.appendChild(wrapper);

  // Scroll to bottom
  container.scrollTop = container.scrollHeight;
}

function showTypingIndicator() {
  const container = document.getElementById('chatMessages');
  const id = 'typing-' + Date.now();

  const wrapper = document.createElement('div');
  wrapper.className = 'message bot-message typing-indicator';
  wrapper.id = id;

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = '🤖';

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';

  wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);
  container.appendChild(wrapper);
  container.scrollTop = container.scrollHeight;

  return id;
}

function removeTypingIndicator(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

// =============================================
// ITINERARY PLANNER
// =============================================
async function generateItinerary() {
  const destination = document.getElementById('planDestination').value.trim();
  const days = parseInt(document.getElementById('planDays').value);
  const budget = parseInt(document.getElementById('planBudget').value);
  const travelers = parseInt(document.getElementById('planTravelers').value) || 2;
  const startDate = document.getElementById('planStartDate').value;
  const travelStyle = document.getElementById('planStyle').value;

  if (!destination) { showToast('Please enter a destination', 'error'); return; }
  if (!days || days < 1) { showToast('Please enter number of days', 'error'); return; }
  if (!budget || budget < 1) { showToast('Please enter your budget', 'error'); return; }

  const preferences = Array.from(
    document.querySelectorAll('#interestCheckboxes input:checked')
  ).map(cb => cb.value);

  showLoading('Generating your personalized itinerary...');

  try {
    const res = await fetch(`${API_BASE}/itinerary/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination, days, budget, travelers, startDate, travelStyle, preferences })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to generate itinerary');

    const resultEl = document.getElementById('itineraryResult');
    resultEl.innerHTML = `
      <div class="result-header">
        <div>
          <div class="result-title">🗺️ ${destination} — ${days}-Day Itinerary</div>
          <div class="result-meta">💰 Budget: $${budget} · 👥 ${travelers} traveler(s) · 🎯 ${travelStyle}</div>
        </div>
        <button class="copy-btn" onclick="copyResult('itineraryResult')">📋 Copy</button>
      </div>
      <div class="result-content">${markdownToHTML(data.itinerary.content)}</div>
    `;

    showToast('Itinerary generated successfully!', 'success');

  } catch (err) {
    showToast(err.message, 'error');
    document.getElementById('itineraryResult').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">❌</div>
        <h3>Generation Failed</h3>
        <p>${err.message}</p>
      </div>`;
  } finally {
    hideLoading();
  }
}

// =============================================
// DESTINATION EXPLORER
// =============================================
async function suggestDestinations() {
  const budget = document.getElementById('expBudget').value;
  const duration = document.getElementById('expDuration').value;
  const departingFrom = document.getElementById('expDepart').value.trim();
  const season = document.getElementById('expSeason').value;
  const travelStyle = document.getElementById('expStyle').value;
  const travelers = document.getElementById('expTravelers').value;

  const interests = Array.from(
    document.querySelectorAll('.exp-interest:checked')
  ).map(cb => cb.value);

  showLoading('Finding your perfect destinations...');

  try {
    const res = await fetch(`${API_BASE}/destinations/suggest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ budget, duration, interests, travelStyle, departingFrom, season, travelers })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch destinations');

    const resultEl = document.getElementById('exploreResult');
    resultEl.innerHTML = `
      <div class="result-header">
        <div>
          <div class="result-title">🌍 Recommended Destinations</div>
          <div class="result-meta">Budget: $${budget} · ${duration} · ${travelStyle} style</div>
        </div>
        <button class="copy-btn" onclick="copyResult('exploreResult')">📋 Copy</button>
      </div>
      <div class="result-content">${markdownToHTML(data.destinations)}</div>
    `;

    showToast('Destinations found!', 'success');

  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    hideLoading();
  }
}

async function getPopularDestinations() {
  showLoading('Fetching popular destinations...');
  try {
    const res = await fetch(`${API_BASE}/destinations/popular`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed');

    const resultEl = document.getElementById('exploreResult');
    resultEl.innerHTML = `
      <div class="result-header">
        <div class="result-title">🌟 Most Popular Travel Destinations</div>
        <button class="copy-btn" onclick="copyResult('exploreResult')">📋 Copy</button>
      </div>
      <div class="result-content">${markdownToHTML(data.popular)}</div>
    `;
    showToast('Loaded popular destinations!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    hideLoading();
  }
}

// =============================================
// WEATHER
// =============================================
async function getWeatherAdvice() {
  const destination = document.getElementById('wxDestination').value.trim();
  const month = document.getElementById('wxMonth').value;
  const duration = document.getElementById('wxDuration').value;

  if (!destination) { showToast('Please enter a destination', 'error'); return; }

  showLoading('Getting weather insights...');
  try {
    const res = await fetch(`${API_BASE}/weather/advice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination, month, duration })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed');

    const resultEl = document.getElementById('weatherResult');
    resultEl.innerHTML = `
      <div class="result-header">
        <div>
          <div class="result-title">🌤️ Weather Guide: ${destination}</div>
          <div class="result-meta">📅 ${month} · ${duration} days</div>
        </div>
        <button class="copy-btn" onclick="copyResult('weatherResult')">📋 Copy</button>
      </div>
      <div class="result-content">${markdownToHTML(data.weatherAdvice)}</div>
    `;
    showToast('Weather advice loaded!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    hideLoading();
  }
}

async function getBestTime() {
  const destination = document.getElementById('btDestination').value.trim();
  if (!destination) { showToast('Please enter a destination', 'error'); return; }

  showLoading('Analyzing best travel times...');
  try {
    const res = await fetch(`${API_BASE}/weather/best-time`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed');

    const resultEl = document.getElementById('weatherResult');
    resultEl.innerHTML = `
      <div class="result-header">
        <div class="result-title">📅 Best Time to Visit: ${destination}</div>
        <button class="copy-btn" onclick="copyResult('weatherResult')">📋 Copy</button>
      </div>
      <div class="result-content">${markdownToHTML(data.bestTimeAdvice)}</div>
    `;
    showToast('Best time analysis complete!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    hideLoading();
  }
}

// =============================================
// PACKING LIST
// =============================================
async function generatePackingList() {
  const destination = document.getElementById('pkDestination').value.trim();
  const days = document.getElementById('pkDays').value;
  const season = document.getElementById('pkSeason').value;

  if (!destination) { showToast('Please enter a destination', 'error'); return; }

  const activities = Array.from(
    document.querySelectorAll('.pk-activity:checked')
  ).map(cb => cb.value);

  showLoading('Creating your personalized packing list...');
  try {
    const res = await fetch(`${API_BASE}/itinerary/packing-list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination, days, season, activities })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed');

    const resultEl = document.getElementById('packingResult');
    resultEl.innerHTML = `
      <div class="result-header">
        <div>
          <div class="result-title">🎒 Packing List: ${destination}</div>
          <div class="result-meta">📅 ${days} days · 🌡️ ${season}</div>
        </div>
        <button class="copy-btn" onclick="copyResult('packingResult')">📋 Copy</button>
      </div>
      <div class="result-content">${markdownToHTML(data.packingList)}</div>
    `;
    showToast('Packing list ready!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    hideLoading();
  }
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

/**
 * Convert markdown-like text to HTML
 */
function markdownToHTML(text) {
  if (!text) return '';

  let html = text
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headers
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`(.+?)`/g, '<code>$1</code>')
    // Bullet lists
    .replace(/^[-*•] (.+)$/gm, '<li>$1</li>')
    // Numbered lists
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Horizontal rule
    .replace(/^---+$/gm, '<hr/>')
    // Line breaks for paragraphs
    .replace(/\n\n/g, '</p><p>')
    // Wrap li sequences in ul
    .replace(/(<li>.*<\/li>\n?)+/g, match => `<ul>${match}</ul>`);

  // Wrap remaining text in paragraphs
  html = '<p>' + html + '</p>';

  // Clean up: remove empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '');
  html = html.replace(/<p>(<h[1-6]>)/g, '$1');
  html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
  html = html.replace(/<p>(<ul>)/g, '$1');
  html = html.replace(/(<\/ul>)<\/p>/g, '$1');
  html = html.replace(/<p>(<hr\/>)/g, '$1');
  html = html.replace(/(<hr\/>)<\/p>/g, '$1');

  return html;
}

function showLoading(message = 'IBM Granite AI is thinking...') {
  document.getElementById('loadingText').textContent = message;
  document.getElementById('loadingOverlay').classList.add('active');
  isLoading = true;
}

function hideLoading() {
  document.getElementById('loadingOverlay').classList.remove('active');
  isLoading = false;
}

function setLoading(loading, showOverlay = true) {
  isLoading = loading;
  const sendBtn = document.getElementById('sendBtn');
  if (sendBtn) sendBtn.disabled = loading;
  if (showOverlay) {
    if (loading) showLoading();
    else hideLoading();
  }
}

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  setTimeout(() => {
    toast.className = 'toast';
  }, 3500);
}

function copyResult(containerId) {
  const el = document.getElementById(containerId);
  const resultContent = el.querySelector('.result-content');
  if (!resultContent) return;

  const text = resultContent.innerText;
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied to clipboard!', 'success');
  }).catch(() => {
    showToast('Could not copy — please select and copy manually', 'error');
  });
}

function setCurrentMonth() {
  const monthSelect = document.getElementById('wxMonth');
  if (!monthSelect) return;
  const months = ['January','February','March','April','May','June',
    'July','August','September','October','November','December'];
  const currentMonth = months[new Date().getMonth()];
  monthSelect.value = currentMonth;
}
