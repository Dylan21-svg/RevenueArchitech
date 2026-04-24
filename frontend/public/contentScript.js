console.log('Sting Shopify Bridge content script active.');

const adminThemePage = /\/admin\/themes/.test(window.location.pathname);

const findThemeTitleInput = () => {
  return document.querySelector(
    'input[name="theme[name]"], input[id*="theme_name"], input[placeholder*="Theme name"], input[aria-label*="Theme name"], input[type="text"]'
  );
};

const dispatchInputEvents = (element) => {
  ['focus', 'input', 'change', 'blur'].forEach((eventName) => {
    const event = new Event(eventName, { bubbles: true });
    element.dispatchEvent(event);
  });
};

const performFixH1 = (headline) => {
  if (!adminThemePage) {
    console.log('Sting Bridge: not on Shopify theme page, aborting fix.');
    return;
  }

  const titleInput = findThemeTitleInput();
  if (!titleInput) {
    console.warn('Sting Bridge: theme title input not found.');
    return;
  }

  titleInput.focus();
  titleInput.value = headline;
  dispatchInputEvents(titleInput);
  console.log('Sting Bridge: injected optimized headline into theme title input.');
};

window.addEventListener('message', (event) => {
  if (event.source !== window || !event.data) return;
  const { type, payload } = event.data;

  if (type === 'STING_WEBAPP_FIX_H1') {
    chrome.runtime.sendMessage({ type: 'STING_FORWARD_FIX_H1', payload });
  }

  if (type === 'STING_WEBAPP_CREATE_PREVIEW') {
    chrome.runtime.sendMessage({ type: 'STING_CREATE_PREVIEW_THEME', payload });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'STING_PERFORM_FIX_H1') {
    performFixH1(message.payload.headline);
    sendResponse({ status: 'completed' });
  }
  return true;
});

chrome.runtime.sendMessage({ type: 'STING_CONTENT_READY', pageUrl: window.location.href });
