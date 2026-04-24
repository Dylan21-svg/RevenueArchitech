const statusEl = document.getElementById('status');
const createButton = document.getElementById('create-preview');
const applyButton = document.getElementById('apply-fixes');

const setStatus = (message) => {
  if (statusEl) statusEl.textContent = message;
};

createButton.addEventListener('click', async () => {
  const storeDomain = document.getElementById('store-domain')?.value?.trim();
  const apiToken = document.getElementById('api-token')?.value?.trim();

  if (!storeDomain || !apiToken) {
    setStatus('Enter both store domain and Admin API token first.');
    return;
  }

  setStatus('Creating RevenueArchitect Preview theme...');

  chrome.runtime.sendMessage(
    {
      type: 'STING_CREATE_PREVIEW_THEME',
      payload: { storeDomain, apiToken }
    },
    (response) => {
      if (!response) {
        setStatus('No response from background worker.');
        return;
      }
      if (response.status === 'created') {
        const theme = response.result.theme;
        setStatus(`Preview theme created: ${theme.name} (ID ${theme.id})`);
      } else if (response.status === 'error') {
        setStatus(`Error: ${response.error}`);
      } else {
        setStatus('Unknown response from extension.');
      }
    }
  );
});

applyButton.addEventListener('click', async () => {
  const storeDomain = document.getElementById('store-domain')?.value?.trim();
  const apiToken = document.getElementById('api-token')?.value?.trim();

  if (!storeDomain || !apiToken) {
    setStatus('Enter both store domain and Admin API token first.');
    return;
  }

  // Mock theme ID and fixes
  const themeId = '123456789'; // In real app, get from created theme
  const fixes = [
    { key: 'assets/custom.css', value: '.hero { font-weight: bold; }' },
    { key: 'assets/custom.js', value: 'console.log("Architect fixes applied");' }
  ];

  setStatus('Applying Architect fixes to preview theme...');

  chrome.runtime.sendMessage(
    {
      type: 'STING_APPLY_ARCHITECT_FIXES',
      payload: { storeDomain, apiToken, themeId, fixes }
    },
    (response) => {
      if (!response) {
        setStatus('No response from background worker.');
        return;
      }
      if (response.status === 'applied') {
        setStatus('Architect fixes applied successfully.');
      } else if (response.status === 'error') {
        setStatus(`Error: ${response.error}`);
      } else {
        setStatus('Unknown response from extension.');
      }
    }
  );
});
