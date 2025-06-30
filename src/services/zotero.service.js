import axios from "axios";
import SparkMD5 from "spark-md5";
import backgroundService from "./background.service.js";

class ZoteroService {
  async saveResults(apiKey, userId, itemKey, version, results) {
    const body = {
      tags: results.map(it => ({ tag: `${it.name}:${it.result}` })),
    };

    return await axios.patch(
      `https://api.zotero.org/users/${userId}/items/${itemKey}`,
      body,
      {
        headers: {
          "Zotero-API-Key": apiKey,
          "Content-Type": "application/json",
          "If-Unmodified-Since-Version": version,
        },
      }
    );
  }

  async saveToZotero(apiKey, userId, pdfUrl, articleTitle = "", parentItemKey = false) {
    try {
      const filename = articleTitle || this._extractFilename(pdfUrl);
      console.log("Saving to Zotero with filename:", filename);
      const metadata = this._buildMetadata(filename, parentItemKey);
console.log("Metadata for Zotero item:", metadata);

      const itemResult = await this._createItem(apiKey, userId, metadata);
console.log("Created item in Zotero:", itemResult);
      const arrayBuffer = await this._fetchPdfAsArrayBuffer(pdfUrl);
      const uint8Array = new Uint8Array(arrayBuffer);
      const hash = SparkMD5.ArrayBuffer.hash(arrayBuffer);
console.log("PDF hash:", hash);
      const formParams = this._buildUploadParams(itemResult.item.key, hash, filename, uint8Array.length);
      const uploadLinkJson = await this._requestUploadLink(apiKey, userId, itemResult.item.key, formParams);
console.log("Upload link JSON:", uploadLinkJson);
      if (!uploadLinkJson.exists) {
        console.log("Uploading file to Zotero...");
        const response = await backgroundService.sendUploadToBackground(
          apiKey,
          userId,
          uploadLinkJson,
          filename,
          uint8Array,
          itemResult.item.key
        );
        console.log("File upload response:", response);
        itemResult.item.version++;
      }
      console.log("Item saved to Zotero:", itemResult.item);
      return itemResult;
    } catch (err) {
      console.error("saveToZotero error:", err);
    }
  }

  async getTags(apiKey, userId, itemKey) {
    return axios.get(`https://api.zotero.org/users/${userId}/items/${itemKey}/tags?v=3`, {
      headers: {
        "Zotero-API-Key": apiKey,
        "Content-Type": "application/json",
      },
    }).then(res => res.data);
  }

  async getItem(apiKey, userId, itemKey) {
    return axios.get(`https://api.zotero.org/users/${userId}/items/${itemKey}?v=3`, {
      headers: {
        "Zotero-API-Key": apiKey,
        "Content-Type": "application/json",
      },
    }).then(res => res.data);
  }

  // ==== private helpers ====

  _extractFilename(pdfUrl) {
    return pdfUrl.split("/").pop() || "document.pdf";
  }

  _buildMetadata(filename, parentItemKey) {
    return [{
      itemType: "attachment",
      parentItem: parentItemKey,
      linkMode: "imported_file",
      title: filename,
      contentType: "application/pdf",
      filename,
    }];
  }

  async _createItem(apiKey, userId, metadata) {
    console.log("metadata:", metadata);
    const res = await axios.post(
      `https://api.zotero.org/users/${userId}/items`,
      metadata,
      {
        headers: {
          "Zotero-API-Key": apiKey,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("Zotero item creation response:", res.data);
    const result = res.data.successful[0];
    return {
      item: result.data,
      readerLink: result.links.alternate.href + "/reader",
    };
  }

  async _fetchPdfAsArrayBuffer(pdfUrl) {
    const res = await axios.get(pdfUrl, { responseType: "arraybuffer" });
    return res.data;
  }

  _buildUploadParams(itemKey, hash, filename, fileSize) {
    const params = new URLSearchParams();
    params.append("url", `https://api.zotero.org/items/${itemKey}/file`);
    params.append("md5", hash);
    params.append("filename", filename);
    params.append("filesize", fileSize.toString());
    params.append("mtime", "1");
    return params;
  }

  async _requestUploadLink(apiKey, userId, itemKey, formParams) {
    const res = await axios.post(
      `https://api.zotero.org/users/${userId}/items/${itemKey}/file?params=1`,
      formParams.toString(),
      {
        headers: {
          "Zotero-API-Key": apiKey,
          "If-None-Match": "*",
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    return res.data;
  }
};


const zoteroService = new ZoteroService();
export default zoteroService;
