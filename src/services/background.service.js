export class BackgroundService {
  sendUploadToBackground(apiKey, userId, uploadLinkJson, filename, uint8Array, itemKey) {
    return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        action: "uploadFile",
        uploadLinkJson,
        filename,
        blobBuffer: Array.from(uint8Array),
        blobType: "application/pdf",
        itemKey,
        apiKey,
        userId,
      },
      (response) => {
        if(response.success) return resolve(response)
        return reject(response)
      }
    );

    })
  }

  async fetch(url, { method = "GET", headers = {}, body = null }) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: "background-fetch",
          payload: { url, method, headers, body },
        },
        (res) => {
          if (chrome.runtime.lastError || !res) {
            reject(chrome.runtime.lastError || new Error("No response"));
          } else if (res.error) {
            reject(new Error(res.error));
          } else {
            resolve(res);
          }
        }
      );
    });
  }
}

const backgroundService = new BackgroundService();
export default backgroundService;
