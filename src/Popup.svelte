<script>
  import {onMount, onDestroy} from "svelte";
  import {resultsStore} from "./store/store.js";
  import zoteroService from "./services/zotero.service.js";
  import zoteroAuthService from "./services/zotero-auth.service.js";
  import DeclassifyService from "./services/declassify.service.js";
  import {Plus} from "lucide-svelte";

  const currentUrl = window.location.href;
  const isZotero =
    currentUrl.includes("zotero.org") && currentUrl.includes("/reader");

  export let url;

  let imageUrl,
    isModalVisible = false,
    isLoading = true,
    articleTitle = "",
    results = [],
    isEditing = false,
    isAuthorizing = false,
    token,
    formResults = [],
    newResultLabel = "",
    errorMessage = "",
    ignoredDomains = [],
    isDomainIgnored = true;

  function updateIsDomainIgnored() {
    isDomainIgnored = window.location.hostname && ignoredDomains.includes(window.location.hostname);
  }

  const getToken = async () => {
    token = await zoteroAuthService.getZoteroUser();
  };

  const unsubscribe = resultsStore.subscribe((value) => {
    results = value;
  });

  function showModal() {
    isModalVisible = true;
  }

  function hideModal() {
    isModalVisible = false;
    errorMessage = "";
  }

  async function zoteroAuth() {
    try {
      errorMessage = "";
      isAuthorizing = true;
      const zoteroUser = await zoteroAuthService.startOAuthFlow();
      await zoteroAuthService.saveZoteroUser(zoteroUser);
      isAuthorizing = false;
    } catch (err) {
      errorMessage = "Failed to authorize with Zotero.";
      isAuthorizing = false;
    }
  }

  function deleteResult(index) {
    formResults = formResults.filter((_, i) => i !== index);
  }

  async function salvarZotero() {
    errorMessage = "";
    resultsStore.set(formResults);
    isEditing = false;
    isLoading = true;

    if (isZotero) {
      const itemKey = currentUrl.split("/items/")[1]?.split("/")[0];
      const zoteroItem = await zoteroService.getItem(
        token.accessSecret,
        token.userID,
        itemKey
      );
      await zoteroService.saveResults(
        token.accessSecret,
        token.userID,
        zoteroItem.key,
        results.map((result) => ({...result, result: result.result || "None"}))
      );
    } else {
      try {
        const zoteroResult = await zoteroService.saveToZotero(
          token.accessSecret,
          token.userID,
          url,
          articleTitle);

        await zoteroService.saveResults(
          token.accessSecret,
          token.userID,
          zoteroResult.item.key,
          results
        );
        window.location.href = zoteroResult.readerLink;
      } catch (err) {
        if (err.status === 413) {
          errorMessage = "Error: The file is too large to be saved to Zotero.";
        } else {
          errorMessage = "An unexpected error occurred while saving.";
          console.error("Error saving to Zotero:", err);
        }
        isLoading = false;
        return;
      }
    }
    await loadResults();
    isLoading = false;
  }

  function addEmptyResult() {
    if (!newResultLabel.trim()) return;
    formResults = [...formResults, {name: newResultLabel.trim(), result: ""}];
    newResultLabel = "";
  }

  async function loadResults() {
    errorMessage = ""; // Clear previous errors
    let newResults = null;
    try {
      newResults = await classifyDocument();
      if (isZotero && token) {
        const itemKey = currentUrl.split("/items/")[1]?.split("/")[0];
        if (itemKey) {
          const item = await zoteroService.getItem(
            token.accessSecret,
            token.userID,
            itemKey
          );
          articleTitle = item.data.title || "";
          const tags = item.data.tags || [];
          tags
            .filter((tag) => tag.tag.match(/.+:.+/))
            .forEach((tag) => {
              const [key, value] = tag.tag.split(/:(.*)/s); // Split only on the first colon
              if (newResults[key] !== undefined) {
                newResults[key] = value;
              }
            });
        }
      }
      resultsStore.set([]); // Clear previous results before adding new ones
      for (const resultKey in newResults) {
        addResult(resultKey, newResults[resultKey]);
      }
    } catch (error) {
      errorMessage = "Could not classify the document."
      console.error("Classification Error:", error)
    } finally {
      isLoading = false;
    }
  }

  function addResult(name, result) {
    resultsStore.update((items) => [...items, {name, result}]);
  }

  async function classifyDocument() {
    const declassify = new DeclassifyService();
    const {title, results: newResults} = await declassify.classify(url);
    articleTitle = title;
    resultsStore.update(() => []);
    return newResults;
  }

  onDestroy(() => unsubscribe());
  onMount(() => {
    getToken();
    imageUrl = chrome.runtime.getURL("images/QueroQuero-Fundo.png");
    chrome.storage.local.get(['ignoredDomains'], (result) => {
      ignoredDomains = result.ignoredDomains || [];
      updateIsDomainIgnored();
    });

    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (changes.ignoredDomains) {
        ignoredDomains = changes.ignoredDomains.newValue || [];
        updateIsDomainIgnored();
      }
      // If login info changes, re-fetch the token to update the component's state
      if (changes.zoteroUser) {
        getToken();
      }
    });
  });

  $: if (url) {
    isLoading = true;
    loadResults();
    isEditing = false;
  }

  $: if (isEditing === false) formResults = JSON.parse(JSON.stringify(results));

</script>

{#if url && !isDomainIgnored}
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap"
    rel="stylesheet"
  />
  <div id="declassify-wrapper">
    {#if !isModalVisible}
      <div on:click={showModal} id="modal-button">
        {#if imageUrl}
          <img src={imageUrl} alt="DeClassIFY Logo" id="modal-button-img"/>
        {/if}
      </div>
    {/if}

    {#if isModalVisible}
      <div id="modal">
        <div id="modal-close-container">
          <div id="modal-close-button" on:click={hideModal}>✖</div>
        </div>
        <div id="title"><span>De</span><span>ClassIFY</span></div>

        {#if errorMessage}
          <div class="error-message">
            {errorMessage}
          </div>
        {/if}

        {#if isLoading}
          <div id="pdf-classify-loader">
            <span></span>
          </div>
        {:else if isAuthorizing}
          <div id="pdf-classify-authorizing">
            <span class="loader"></span>
            <p>
              Redirecting to Zotero to authorize the application...<br/>
              Please confirm access and wait for the automatic return.
            </p>
          </div>
        {:else}
          <div id="pdf-classify-results">
            {#each formResults as result, i}
              <div class="input-wrapper">
                {#if isEditing}
                  <label class="floating-label-input">
                    <input
                      type="text"
                      bind:value={result.result}
                      placeholder=" "
                    />
                    <span>{result.name}</span>
                    <button class="delete-btn" on:click={() => deleteResult(i)}>✖</button>
                  </label>
                {:else}
                  <p><strong>{result.name}</strong>: {result.result || 'N/A'}</p>
                {/if}
              </div>
            {/each}
            {#if isEditing}
              <div class="input-wrapper ">
                <label class="floating-label-input">
                  <input
                    type="text"
                    placeholder=" "
                    bind:value={newResultLabel}
                    on:keydown={(e) => e.key === 'Enter' && addEmptyResult()}
                  />
                  <span>Nova categoria</span>
                  <button class="add-btn" on:click={addEmptyResult} aria-label="Adicionar categoria">
                    <Plus size="16" color="#1d7392"/>
                  </button>
                </label>
              </div>
            {/if}
          </div>
        {/if}
        <div class="buttons">
          {#if !isLoading && !isAuthorizing}
            {#if isZotero && token}
              {#if isEditing}
                <button on:click={salvarZotero}>
                  Save
                </button>
                <button
                  class="cancel"
                  on:click={() => {
                    isEditing = false;
                    errorMessage = '';
                  }}>Cancelar
                </button>
              {:else}
                <button
                  on:click={() => {
                    isEditing = true;
                    errorMessage = '';
                  }}
                >
                  Edit
                </button>
              {/if}
            {:else if token}
              <button on:click={salvarZotero}>Save to Zotero</button>
            {:else}
              <button on:click={zoteroAuth}>Connect to Zotero</button>
            {/if}
          {/if}
        </div>
      </div>
    {/if}
  </div>
  <style>
      :global(body) {
          font-family: 'Inter', sans-serif;
      }

      #declassify-wrapper {
          position: fixed;
          z-index: 2147483647;
          right: 64px;
          bottom: 0;
          display: flex;
          align-items: flex-end;
          flex-direction: column;
          color: black;
      }

      #modal-button-img {
          height: 100%;
      }

      #modal-button {
          width: 64px;
          height: 64px;
          border-radius: 100%;
          cursor: pointer;
          box-shadow: rgba(0, 0, 0, 0.25) 5px 10px 15px 5px;
          overflow: hidden;
          margin-bottom: 32px;
      }

      #modal-button:hover {
          background-color: rgb(33, 36, 38);
          transition: background-color 0.3s;
      }

      #modal-button > p {
          margin: 0;
          padding: 0;
      }

      #modal {
          font-family: sans-serif;
          background-color: white;
          box-shadow: rgba(0, 0, 0, 0.35) 0 5px 15px;
          width: 250px;
          border-radius: 8px 8px 0 0;
          padding: 20px;
          box-sizing: border-box;
      }

      #modal-close-container {
          display: flex;
          justify-content: flex-end;
          height: 0;
      }

      #modal-close-button {
          cursor: pointer;
          color: #555;
      }

      #modal #title {
          text-align: center;
          margin: 0;
          margin-bottom: 12px;
          font-family: Inter, sans-serif;
          font-size: 28px;
      }

      #modal #title > span:nth-child(1) {
          font-weight: 200;
          text-decoration: underline;
      }

      #modal #title > span:nth-child(2) {
          font-weight: bold;
      }

      #pdf-classify-results p {
          margin: 10px 0;
          font-size: 14px;
          word-wrap: break-word;
      }

      #pdf-classify-loader {
          display: flex;
          justify-content: center;
          align-items: center;
          margin: 140px 0;
      }

      #pdf-classify-authorizing {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          margin: 100px 0;
          text-align: center;
          color: #333;
          font-family: Inter, sans-serif;
          font-size: 14px;
      }

      .loader, #pdf-classify-loader > span {
          width: 40px;
          height: 40px;
          border: 4px solid #1d7392;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
          box-sizing: border-box;
      }

      @keyframes spin {
          to {
              transform: rotate(360deg);
          }
      }

      input[type="text"] {
          width: 100%;
          padding: 6px 8px;
          margin-top: 4px;
          font-size: 14px;
          border: 1px solid #ccc;
          border-radius: 6px;
          font-family: Inter, sans-serif;
          box-sizing: border-box;
          transition: border-color 0.2s, box-shadow 0.2s;
      }

      input[type="text"]:focus {
          outline: none;
          border-color: #1d7392;
          box-shadow: 0 0 0 2px rgba(29, 115, 146, 0.2);
      }

      button:disabled {
          background-color: #ccc !important;
          color: #666 !important;
          cursor: not-allowed;
          opacity: 0.7;
      }

      .buttons {
          border-top: 1px solid #eee;
          padding-top: 16px;
          margin-top: 16px;
          display: flex;
          gap: 8px;
          flex-direction: column;
      }

      .buttons button {
          width: 100%;
          padding: 10px;
          font-size: 14px;
          font-weight: bold;
          color: white;
          background-color: #1d7392;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.2s;
          font-family: Inter, sans-serif;
      }

      .buttons button:not(:disabled):hover {
          background-color: #155c75;
      }

      button.cancel {
          background-color: #ccc;
          color: #333;
      }

      button.cancel:not(:disabled):hover {
          background-color: #aaa;
      }

      .input-wrapper {
          margin: 12px 0;
      }

      .floating-label-input {
          position: relative;
          display: flex;
          align-items: center;
      }

      .floating-label-input input {
          flex-grow: 1;
          padding: 12px 8px 6px;
      }

      .floating-label-input span {
          position: absolute;
          top: 50%;
          left: 8px;
          transform: translateY(-50%);
          font-size: 14px;
          color: #888;
          pointer-events: none;
          transition: all 0.2s ease;
          background: white;
          padding: 0 4px;
      }

      .floating-label-input input:focus + span,
      .floating-label-input input:not(:placeholder-shown) + span {
          top: 4px;
          font-size: 11px;
          color: #1d7392;
      }

      .delete-btn, .add-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 4px;
          line-height: 1;
      }

      .delete-btn {
          color: #d00;
          margin-left: 4px;
      }

      .delete-btn:hover {
          color: #a00;
      }

      .add-btn {
          color: #1d7392;
      }

      .add-btn:hover {
          color: #0c4f66;
      }

      /* New style for the error message */
      .error-message {
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
          border-radius: 6px;
          padding: 10px;
          margin-bottom: 12px;
          text-align: center;
          font-size: 13px;
          font-family: Inter, sans-serif;
      }
  </style>
{/if}