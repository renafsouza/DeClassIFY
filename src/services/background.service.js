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

    async fetchWithChunks(url, { method = "GET", headers = {}, body = null }) {
        return new Promise((resolve, reject) => {
            const port = chrome.runtime.connect();
            let chunks = [];
            let expectedChunks = 0;

            port.postMessage({
                type: "background-fetch-with-chunks",
                payload: { url, method, headers, body },
            });

            port.onMessage.addListener((msg) => {
                if (msg.type === "start") {
                    expectedChunks = msg.totalChunks;
                    chunks = new Array(expectedChunks);
                } else if (msg.type === "chunk") {
                    chunks[msg.index] = new Uint8Array(msg.data);
                } else if (msg.type === "end") {
                    if (chunks.every((c) => c !== undefined)) {
                        const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
                        const fullArray = new Uint8Array(totalLength);
                        let offset = 0;
                        for (const chunk of chunks) {
                            fullArray.set(chunk, offset);
                            offset += chunk.length;
                        }
                        port.disconnect();
                        resolve(fullArray.buffer);
                    } else {
                        port.disconnect();
                        reject(new Error("Missing chunks"));
                    }
                } else if (msg.type === "error") {
                    port.disconnect();
                    reject(new Error(msg.message));
                }
            });

            // Optional: handle port disconnect/error events here
        });
    }

}

const backgroundService = new BackgroundService();
export default backgroundService;
