const STORAGE_KEYS = {
  draft: 'it-support-quote-draft',
  history: 'it-support-quote-history',
  chat: 'it-support-chat-history'
};

const PLAN_PRICING = {
  monthly: { label: 'Monthly', price: 25, interval: 'per month' },
  yearly: { label: 'Yearly', price: 250, interval: 'per year' },
  multi: { label: '2 Years', price: 450, interval: 'for 2 years' }
};

const form = document.getElementById('quoteForm');
const actionForm = document.getElementById('actionForm');
const actionStatus = document.getElementById('actionStatus');
const historyList = document.getElementById('historyList');
const clearStorageButton = document.getElementById('clearStorage');
const summaryTitle = document.getElementById('summaryTitle');
const estimateText = document.getElementById('estimateText');
const rateText = document.getElementById('rateText');
const totalText = document.getElementById('totalText');
const storageStatus = document.getElementById('storageStatus');
const chatToggle = document.getElementById('chatToggle');
const chatAssistant = document.getElementById('chatAssistant');
const chatClose = document.getElementById('chatClose');
const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const suggestionButtons = Array.from(document.querySelectorAll('.suggestion-chip'));

const DEFAULT_CHAT_MESSAGE = {
  role: 'assistant',
  text: 'We support Windows Device, Microsoft 365, Active Directory or Azure AD, SCCM or Intune endpoint management, and basic networking issues like DNS, DHCP, and TCP/IP.'
};

function clearSavedDraft() {
  sessionStorage.removeItem(STORAGE_KEYS.draft);
  localStorage.removeItem(STORAGE_KEYS.draft);
}

function currency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
}

function getDraft() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEYS.draft)) || {};
  } catch {
    return {};
  }
}

function getHistory() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEYS.history));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function getChatHistory() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEYS.chat));
    if (!Array.isArray(value) || !value.length) {
      return [DEFAULT_CHAT_MESSAGE];
    }

    if (
      value.length === 1 &&
      value[0]?.role === 'assistant' &&
      value[0]?.text === 'Hello. I can answer questions about pricing, services, support plans, and quote requests.'
    ) {
      return [DEFAULT_CHAT_MESSAGE];
    }

    return value;
  } catch {
    return [DEFAULT_CHAT_MESSAGE];
  }
}

function saveDraft(values) {
  sessionStorage.setItem(STORAGE_KEYS.draft, JSON.stringify(values));
}

function saveHistory(entry) {
  const entries = [entry, ...getHistory()].slice(0, 6);
  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(entries));
}

function saveChatHistory(entries) {
  localStorage.setItem(STORAGE_KEYS.chat, JSON.stringify(entries.slice(-24)));
}

function getFormValues() {
  const formData = new FormData(form);

  return {
    name: String(formData.get('name') || '').trim(),
    email: String(formData.get('email') || '').trim(),
    company: String(formData.get('company') || '').trim(),
    devices: Math.max(1, Number(formData.get('devices')) || 1),
    plan: String(formData.get('plan') || 'monthly'),
    notes: String(formData.get('notes') || '').trim()
  };
}

function updateSummary(values) {
  const plan = PLAN_PRICING[values.plan] || PLAN_PRICING.monthly;
  const total = plan.price * values.devices;
  const hasEstimateInput = Boolean(
    values.name ||
    values.email ||
    values.company ||
    values.notes ||
    values.devices !== 10 ||
    values.plan !== 'monthly'
  );

  summaryTitle.textContent = values.name
    ? `Estimate ready for ${values.name}`
    : 'Ready to calculate';

  estimateText.textContent = hasEstimateInput
    ? `${plan.label} coverage for ${values.devices} device${values.devices === 1 ? '' : 's'} totals ${currency(total)} ${plan.interval}.`
    : 'Enter your details to see the estimated total.';

  rateText.textContent = hasEstimateInput ? `${currency(plan.price)}` : currency(0);
  totalText.textContent = hasEstimateInput ? currency(total) : currency(0);
}

function clearSummary() {
  summaryTitle.textContent = 'Estimate cleared';
  estimateText.textContent = 'Saved estimate cleared. Enter your details to calculate a new total.';
  rateText.textContent = '--';
  totalText.textContent = '--';
}

function populateForm(values) {
  Object.entries(values).forEach(([key, value]) => {
    const field = form.elements.namedItem(key);
    if (field) {
      field.value = value;
    }
  });
}

function renderHistory() {
  const entries = getHistory();

  if (!entries.length) {
    historyList.innerHTML = '<div class="empty-state">No quote requests saved yet. Submit the form to create the first saved request.</div>';
    return;
  }

  historyList.innerHTML = entries
    .map((entry) => {
      const plan = PLAN_PRICING[entry.plan] || PLAN_PRICING.monthly;
      return `
        <article class="history-item">
          <div class="history-header">
            <div>
              <h3>${entry.name || 'Unnamed contact'}</h3>
              <p class="history-meta">${entry.email || 'No email provided'}${entry.company ? ` · ${entry.company}` : ''}</p>
            </div>
            <strong>${currency(entry.total)}</strong>
          </div>
          <p>${plan.label} plan for ${entry.devices} device${entry.devices === 1 ? '' : 's'}.</p>
          <p class="history-meta">Saved ${new Date(entry.savedAt).toLocaleString()}</p>
          ${entry.notes ? `<p>${entry.notes}</p>` : ''}
        </article>
      `;
    })
    .join('');
}

function createChatMessageElement(message) {
  const article = document.createElement('article');
  article.className = `chat-message ${message.role}`;
  article.textContent = message.text;
  return article;
}

function renderChatHistory() {
  const entries = getChatHistory();
  chatMessages.innerHTML = '';
  entries.forEach((entry) => {
    chatMessages.appendChild(createChatMessageElement(entry));
  });
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function appendChatMessage(role, text) {
  const entries = [...getChatHistory(), { role, text }];
  saveChatHistory(entries);
  renderChatHistory();
}

function openChat() {
  chatAssistant.hidden = false;
  chatToggle.setAttribute('aria-expanded', 'true');
  setTimeout(() => chatInput.focus(), 0);
}

function closeChat() {
  chatAssistant.hidden = true;
  chatToggle.setAttribute('aria-expanded', 'false');
}

function getAssistantReply(input) {
  const message = input.toLowerCase();

  if (message.includes('price') || message.includes('cost') || message.includes('yearly') || message.includes('monthly')) {
    return 'Our plans are $25 per device monthly, $250 per device yearly, and $450 per device for 2 years. You can use the estimator to see a total instantly.';
  }

  if (message.includes('service') || message.includes('support') || message.includes('offer')) {
    return 'We support Windows administration, Microsoft 365, Active Directory or Azure AD, SCCM or Intune endpoint management, and basic networking issues like DNS, DHCP, and TCP/IP.';
  }

  if (message.includes('quote') || message.includes('contact') || message.includes('signup')) {
    return 'Use the quote form to enter your name, email, company, device count, and preferred plan. Your draft is kept only for the current session and clears when the page is reopened.';
  }

  if (message.includes('remote') || message.includes('onsite') || message.includes('location')) {
    return 'This page is currently positioned as a remote support service with full-time managed coverage for business devices and end users.';
  }

  if (message.includes('storage') || message.includes('saved') || message.includes('persist')) {
    return 'The app saves quote history and chat history in browser storage. Quote drafts are temporary and clear when the page is reopened or the app restarts.';
  }

  return 'I can help with pricing, support services, quote requests, remote coverage, and saved browser data. Try asking about plans or services.';
}

function refreshFromForm() {
  const values = getFormValues();
  updateSummary(values);
  saveDraft(values);
}

function clearSavedData() {
  clearSavedDraft();
  localStorage.removeItem(STORAGE_KEYS.history);
  localStorage.removeItem(STORAGE_KEYS.chat);
  form.reset();
  form.elements.namedItem('devices').value = 10;
  form.elements.namedItem('plan').value = 'monthly';
  clearSummary();
  renderHistory();
  renderChatHistory();
  storageStatus.textContent = 'Saved estimate, recent quote requests, and chat history cleared from this browser.';
}

function sendClientResponse(email) {
  const subject = encodeURIComponent('Thank you for contacting Saaflok');
  const body = encodeURIComponent('Thank you for contacting Saaflok. A representative will reach out shortly.');
  window.location.href = `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`;
}

form.addEventListener('input', () => {
  refreshFromForm();
  storageStatus.textContent = 'Draft saved for this session only and will clear when the page is reopened.';
});

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const values = getFormValues();
  const plan = PLAN_PRICING[values.plan] || PLAN_PRICING.monthly;
  const total = plan.price * values.devices;

  saveDraft(values);
  saveHistory({
    ...values,
    total,
    savedAt: new Date().toISOString()
  });

  updateSummary(values);
  renderHistory();
  clearSavedDraft();
  storageStatus.textContent = `Quote saved for ${values.name || 'your contact'} in browser storage.`;
});

clearStorageButton.addEventListener('click', clearSavedData);

if (actionForm) {
  actionForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(actionForm);
    const email = String(formData.get('actionEmail') || '').trim();

    if (!email) {
      actionStatus.textContent = 'Enter a client email address to prepare the response.';
      return;
    }

    actionStatus.textContent = 'Preparing the reply in your default email app.';
    sendClientResponse(email);
    actionForm.reset();
  });
}

chatToggle.addEventListener('click', () => {
  if (chatAssistant.hidden) {
    openChat();
    return;
  }

  closeChat();
});

chatClose.addEventListener('click', closeChat);

chatForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const prompt = chatInput.value.trim();

  if (!prompt) {
    return;
  }

  appendChatMessage('user', prompt);
  appendChatMessage('assistant', getAssistantReply(prompt));
  chatInput.value = '';
});

suggestionButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const prompt = button.dataset.prompt || '';

    if (!prompt) {
      return;
    }

    openChat();
    appendChatMessage('user', prompt);
    appendChatMessage('assistant', getAssistantReply(prompt));
  });
});

(function init() {
  clearSavedDraft();
  updateSummary(getFormValues());
  renderHistory();
  renderChatHistory();
  storageStatus.textContent = 'Drafts reset when the page is reopened. Quote and chat history remain saved.';
})();
