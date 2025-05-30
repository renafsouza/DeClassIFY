chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    const contentTypeHeader = details.responseHeaders.find(
      (h) => h.name.toLowerCase() === "content-type"
    );

    const isPdf = contentTypeHeader?.value?.toLowerCase().includes("application/pdf");

    if (isPdf) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0]?.id },
          func: (url) => {
            window.dispatchEvent(new CustomEvent('pdfUrlDetected', { detail: url }));
          },
          args: [details.url],
        });
      });
    }
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
);
