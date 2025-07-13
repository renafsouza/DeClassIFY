import OAuth from "oauth-1.0a";
import CryptoJS from "crypto-js";
import backgroundService from "./background.service";

const ZOTERO_OAUTH_REQUEST_URL = "https://www.zotero.org/oauth/request";
const ZOTERO_OAUTH_ACCESS_URL = "https://www.zotero.org/oauth/access";
const ZOTERO_OAUTH_AUTHORIZE_URL = "https://www.zotero.org/oauth/authorize";

const CONSUMER_KEY = "04ee924f8b535bab4dcd";
const CONSUMER_SECRET = "3647ec6cafd19b1080f8";

class ZoteroAuthService {
  constructor() {
    this.oauth = OAuth({
      consumer: {key: CONSUMER_KEY, secret: CONSUMER_SECRET},
      signature_method: "HMAC-SHA1",
      hash_function(base_string, key) {
        return CryptoJS.HmacSHA1(base_string, key).toString(CryptoJS.enc.Base64);
      },
    });
  }

  async getRedirectUrl() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({type: "get-redirect-url"}, (res) => {
        if (chrome.runtime.lastError || !res?.url) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(res.url);
        }
      });
    });
  }

  async launchAuthPopup(authUrl) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({type: "launch-auth-popup", url: authUrl}, (res) => {
        if (chrome.runtime.lastError || !res?.redirectUrl) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(res.redirectUrl);
        }
      });
    });
  }

  async startOAuthFlow() {
    try {
      const callbackUrl = await this.getRedirectUrl();
      // 1. Get request token
      const request_data = {
        url: ZOTERO_OAUTH_REQUEST_URL,
        method: "POST",
        data: {oauth_callback: callbackUrl},
      };
      const headers = this.oauth.toHeader(this.oauth.authorize(request_data));
      const res = await backgroundService.fetch(ZOTERO_OAUTH_REQUEST_URL, {
        method: "POST",
        headers: {Authorization: headers.Authorization},
      });

      const data = new URLSearchParams(res.data);
      const oauth_token = data.get("oauth_token");
      const oauth_token_secret = data.get("oauth_token_secret");

      const authUrl = `${ZOTERO_OAUTH_AUTHORIZE_URL}?oauth_token=${oauth_token}&library_access=1&write_access=1`;
      const redirectUrl = await this.launchAuthPopup(authUrl);

      const url = new URL(redirectUrl);
      const verifier = url.searchParams.get("oauth_verifier");

      return await this.getAccessToken(oauth_token, oauth_token_secret, verifier);
    } catch (err) {
      console.error(err);
    }
  }

  async getAccessToken(oauth_token, oauth_token_secret, oauth_verifier) {
    const request_data = {
      url: ZOTERO_OAUTH_ACCESS_URL,
      method: "POST",
      data: {oauth_verifier},
    };
    const token = {key: oauth_token, secret: oauth_token_secret};
    const headers = this.oauth.toHeader(this.oauth.authorize(request_data, token));

    const res = await backgroundService.fetch(ZOTERO_OAUTH_ACCESS_URL, {
      method: "POST",
      headers: {Authorization: headers.Authorization},
    });
    const data = new URLSearchParams(res.data);
    return {
      accessToken: data.get("oauth_token"),
      accessSecret: data.get("oauth_token_secret"),
      userID: data.get("userID"),
    };
  }

  async saveZoteroToken(token) {
    return new Promise((resolve) => {
      chrome.storage.local.set({zoteroToken: token}, resolve);
    });
  }

  async getZoteroToken() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["zoteroToken"], async (result) => {
        resolve(result.zoteroToken || null);
      });
    });
  }
}

export default new ZoteroAuthService();
