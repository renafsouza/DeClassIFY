chrome.webRequest.onCompleted.addListener(
  (details) => {
    if (details.url.endsWith(".pdf")) {
      console.log("PDF URL detected:", details.url);
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: (url) => {
            window.dispatchEvent(new CustomEvent('pdfUrlDetected', { detail: url }));
          },
          args: [details.url],
        });
      });
    }
  },
  { urls: ["<all_urls>"] }
);