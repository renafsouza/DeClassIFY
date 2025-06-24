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
}

const backgroundService = new BackgroundService();
export default backgroundService;
