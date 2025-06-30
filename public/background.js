const pendingMessages = {};

chrome.runtime.onMessage.addListener(handleRuntimeMessage);
chrome.webRequest.onHeadersReceived.addListener(handleHeadersReceived, { urls: ["<all_urls>"] }, ["responseHeaders"]);

/* ==========================
   HANDLERS
========================== */

// Handles all runtime messages
function handleRuntimeMessage(message, sender, sendResponse) {
  switch (message.type || message.action) {
    case "content-script-ready":
      onContentScriptReady(sender.tab.id);
      break;

    case "uploadFile":
      handleUploadFile(message, sendResponse);
      return true;

    case "get-redirect-url":
      sendResponse({ url: chrome.identity.getRedirectURL("zotero") });
      return true;

    case "launch-auth-popup":
      launchAuthPopup(message.url, sendResponse);
      return true;

    case "background-fetch":
      backgroundFetch(message.payload, sendResponse);
      return true;
  }
}

// Intercepts response headers to detect PDFs
function handleHeadersReceived(details) {
  const contentType = details.responseHeaders.find(
    (h) => h.name.toLowerCase() === "content-type"
  )?.value?.toLowerCase();

  if (contentType?.includes("application/pdf")) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (tabId != null) {
        queueOrSendMessage(tabId, { type: "pdfUrlDetected", url: details.url });
      }
    });
  }
}

// When content script signals it's ready
function onContentScriptReady(tabId) {
  const queued = pendingMessages[tabId];
  if (queued) {
    chrome.tabs.sendMessage(tabId, queued);
    delete pendingMessages[tabId];
  }
}

/* ==========================
   MESSAGE QUEUING
========================== */

function queueOrSendMessage(tabId, message) {
  chrome.tabs.sendMessage(tabId, message, (res) => {
    if (chrome.runtime.lastError) {
      pendingMessages[tabId] = message;
    }
  });
}

/* ==========================
   UPLOAD HANDLING
========================== */

function handleUploadFile(message, sendResponse) {
  const { uploadLinkJson, blobBuffer, filename, itemKey, blobType, apiKey, userId } = message;
  const blob = new Blob([new Uint8Array(blobBuffer)], { type: blobType });

  uploadFile(uploadLinkJson, blob, filename, itemKey, apiKey, userId)
    .then((success) => sendResponse({ success }))
    .catch((e) => {
      console.error("Upload failed:", e);
      sendResponse({ success: false });
    });
}

async function uploadFile(uploadLinkJson, blob, filename, itemKey, apiKey, userId) {
  const baseUrl = `https://api.zotero.org/users/${userId}`;
  const p = uploadLinkJson.params;
  const form = new FormData();

  form.append("key", p.key);
  form.append("acl", "private");
  if (p["Content-MD5"]) form.append("Content-MD5", p["Content-MD5"]);
  form.append("success_action_status", "201");
  form.append("policy", p.policy);
  form.append("x-amz-algorithm", p["x-amz-algorithm"]);
  form.append("x-amz-credential", p["x-amz-credential"]);
  form.append("x-amz-date", p["x-amz-date"]);
  form.append("x-amz-signature", p["x-amz-signature"]);
  form.append("x-amz-security-token", p["x-amz-security-token"]);
  form.append("file", blob, filename);

  const uploadRes = await fetch(uploadLinkJson.url, {
    method: "POST",
    body: form,
  });

  const text = await uploadRes.text();

  if (uploadRes.status === 201) {
    await registerUploadedFile(baseUrl, itemKey, uploadLinkJson.uploadKey, apiKey);
    return true;
  } else {
    console.error("Failed to upload PDF:", uploadRes.status, text);
    return false;
  }
}

async function registerUploadedFile(baseUrl, itemKey, uploadKey, apiKey) {
  const res = await fetch(`${baseUrl}/items/${itemKey}/file`, {
    method: "POST",
    headers: {
      "Zotero-API-Key": apiKey,
      "If-None-Match": "*",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ upload: uploadKey }).toString(),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Register failed: ${res.status} ${text}`);
  }

  return text;
}

/* ==========================
   AUTH / FETCH
========================== */

function launchAuthPopup(url, sendResponse) {
  chrome.identity.launchWebAuthFlow(
    { url, interactive: true },
    (redirectUrl) => {
      if (chrome.runtime.lastError || !redirectUrl) {
        sendResponse({ error: chrome.runtime.lastError?.message });
      } else {
        sendResponse({ redirectUrl });
      }
    }
  );
}

function backgroundFetch(payload, sendResponse) {
  const { url, method, headers, body } = payload;

  fetch(url, { method, headers, body })
    .then(async (res) => {
      const text = await res.text();
      sendResponse({ status: res.status, text });
    })
    .catch((err) => {
      console.error("Background fetch error:", err);
      sendResponse({ error: err.message });
    });
}
