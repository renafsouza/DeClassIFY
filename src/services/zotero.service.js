import axios from "axios";
import SparkMD5 from "spark-md5";
import backgroundService from "./background.service.js";

export class ZoteroService {
  constructor(apiKey, userId) {
    this.apiKey = apiKey;
    this.userId = userId;
    this.baseUrl = `https://api.zotero.org/users/${userId}`;
    this.axiosInstance = axios.create({
      headers: {
        "Zotero-API-Key": apiKey,
        "Content-Type": "application/json",
      },
    });
  }

  async saveResults(itemKey, version, results) {
    const body = {
      tags: results.map(it => ({tag: `${it.name}:${it.result}`}))
    }
    return await this.axiosInstance.patch(
      `${this.baseUrl}/items/${itemKey}`,
      body,
      {
        headers: {
          "If-Unmodified-Since-Version": version
        }
      });

  }

  async saveToZotero(pdfUrl, parentItemKey = false) {
    try {
      const filename = this._extractFilename(pdfUrl);
      const metadata = this._buildMetadata(filename, parentItemKey);

      const itemResult = await this._createItem(metadata);

      const arrayBuffer = await this._fetchPdfAsArrayBuffer(pdfUrl);
      const uint8Array = new Uint8Array(arrayBuffer);
      const hash = SparkMD5.ArrayBuffer.hash(arrayBuffer);

      const formParams = this._buildUploadParams(itemResult.item.key, hash, filename, uint8Array.length);
      const uploadLinkJson = await this._requestUploadLink(itemResult.item.key, formParams);

      if (uploadLinkJson.exists) {
        return itemResult;
      }

      if (!uploadLinkJson.exists) {
        const response = await backgroundService.sendUploadToBackground(
          this.apiKey,
          this.userId,
          uploadLinkJson,
          filename,
          uint8Array,
          itemResult.item.key
        );
        console.log("sendUploadToBackground response", response)
        itemResult.item.version++
      }
      return itemResult
    } catch (err) {
      console.error("saveToZotero error:", err);
    }
  }

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
      filename: filename,
    }];
  }

  async _createItem(metadata) {
    const res = await this.axiosInstance.post(`${this.baseUrl}/items`, metadata);
    const result = res.data.successful[0];
    console.log("result", result)
    return {
      item: result.data,
      readerLink: result.links.alternate.href + "/reader",
    };
  }

  async _fetchPdfAsArrayBuffer(pdfUrl) {
    const res = await axios.get(pdfUrl, {responseType: "arraybuffer"});
    return res.data;
  }

  _buildUploadParams(itemKey, hash, filename, fileSize) {
    const params = new URLSearchParams();
    params.append("url", `${this.baseUrl}/items/${itemKey}/file`);
    params.append("md5", hash);
    params.append("filename", filename);
    params.append("filesize", fileSize.toString());
    params.append("mtime", "1");
    return params;
  }

  async _requestUploadLink(itemKey, formParams) {
    const res = await axios.post(
      `${this.baseUrl}/items/${itemKey}/file?params=1`,
      formParams.toString(),
      {
        headers: {
          "Zotero-API-Key": this.apiKey,
          "If-None-Match": "*",
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    return res.data;
  }

  async getTags(itemKey){
    return this.axiosInstance.get(`${this.baseUrl}/items/${itemKey}/tags?v=3`).then(res=>res.data)
  }

  async getItem(itemKey){
    return this.axiosInstance.get(`${this.baseUrl}/items/${itemKey}?v=3`).then(res=>res.data)
  }
}

const zoteroService = new ZoteroService('iegen7UiqTSygbpo3ffdWJdt', '16630422');
export default zoteroService;
