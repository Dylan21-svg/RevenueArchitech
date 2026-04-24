console.log('Sting Shopify Bridge background worker loaded.');

const findShopifyAdminThemeTab = async () => {
  const tabs = await chrome.tabs.query({ url: ['*://*.shopify.com/*', '*://*.myshopify.com/*'] });
  return tabs.find((tab) => tab.url && /\/admin\/themes/.test(tab.url));
};

const createRevenueArchitectPreviewTheme = async (storeDomain, apiToken) => {
  if (!storeDomain || !apiToken) {
    throw new Error('Store domain and API token are required.');
  }

  const endpoint = `https://${storeDomain}/admin/api/2026-04/themes.json`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': apiToken
    },
    body: JSON.stringify({
      theme: {
        name: 'RevenueArchitect Preview',
        role: 'unpublished'
      }
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.errors ? JSON.stringify(data.errors) : response.statusText);
  }
  return data;
};

const applyArchitectFixesToTheme = async (storeDomain, apiToken, themeId, fixes) => {
  // Mock applying fixes: update theme assets
  const assetEndpoint = `https://${storeDomain}/admin/api/2026-04/themes/${themeId}/assets.json`;
  // For simplicity, assume fixes are CSS/JS updates
  for (const fix of fixes) {
    await fetch(assetEndpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': apiToken
      },
      body: JSON.stringify({
        asset: {
          key: fix.key,
          value: fix.value
        }
      })
    });
  }
  return { status: 'applied' };
};

chrome.runtime.onInstalled.addListener(() => {
  console.log('Sting Bridge installed.');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'STING_FORWARD_FIX_H1') {
    findShopifyAdminThemeTab().then((tab) => {
      if (!tab || !tab.id) {
        sendResponse({ status: 'no-admin-theme-tab' });
        return;
      }
      chrome.tabs.sendMessage(tab.id, { type: 'STING_PERFORM_FIX_H1', payload: message.payload }, (response) => {
        sendResponse({ status: 'sent', response });
      });
    }).catch((error) => {
      sendResponse({ status: 'error', error: error.message });
    });
    return true;
  }

  if (message.type === 'STING_CREATE_PREVIEW_THEME') {
    createRevenueArchitectPreviewTheme(message.payload.storeDomain, message.payload.apiToken)
      .then((result) => sendResponse({ status: 'created', result }))
      .catch((error) => sendResponse({ status: 'error', error: error.message }));
    return true;
  }

  if (message.type === 'STING_APPLY_ARCHITECT_FIXES') {
    applyArchitectFixesToTheme(message.payload.storeDomain, message.payload.apiToken, message.payload.themeId, message.payload.fixes)
      .then((result) => sendResponse({ status: 'applied', result }))
      .catch((error) => sendResponse({ status: 'error', error: error.message }));
    return true;
  }
});
