chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    const contentType = details.responseHeaders.find(
      (h) => h.name.toLowerCase() === "content-type"
    )?.value?.toLowerCase();

    if (contentType?.includes("application/pdf")) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0]?.id },
          func: (url) => {
            window.dispatchEvent(new CustomEvent("pdfUrlDetected", { detail: url }));
          },
          args: [details.url],
        });
      });
    }
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "uploadFile") {
    const { uploadLinkJson, blobBuffer, filename, itemKey, blobType, apiKey, userId } = message;
    const blob = new Blob([new Uint8Array(blobBuffer)], { type: blobType });

    uploadFile(uploadLinkJson, blob, filename, itemKey, apiKey, userId)
      .then((success) => sendResponse({ success }))
      .catch((e) => {
        console.error("Upload failed:", e);
        sendResponse({ success: false });
      });

    return true; // Keep message channel open for async response
  }
});

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
  console.log("Upload response:", text);

  if (uploadRes.status === 201) {
    await registerUploadedFile(baseUrl, itemKey, uploadLinkJson.uploadKey, apiKey);
    console.log("PDF uploaded and registered successfully.");
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
