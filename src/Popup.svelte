<script>
  import {onMount} from "svelte";
  import {resultsStore} from "./store/store.js";
  import {onDestroy} from "svelte";
  import zoteroService from "./services/zotero.service.js";
  import zoteroAuthService from "./services/zotero-auth.service.js";
  import DeclassifyService from "./services/declassify.service.js";
  import {Plus, PlusCircle} from "lucide-svelte";

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
    newResultLabel = "";

  const getToken = async () => {
    token = await zoteroAuthService.getZoteroToken();
  };

  const unsubscribe = resultsStore.subscribe((value) => {
    results = value;
  });

  function showModal() {
    isModalVisible = true;
  }

  function hideModal() {
    isModalVisible = false;
  }

  async function zoteroAuth() {
    try {
      isAuthorizing = true;
      token = await zoteroAuthService.startOAuthFlow();
      await zoteroAuthService.saveZoteroToken(token);
      isAuthorizing = false;
    } catch (err) {
      console.log("err", err)
    }
  }

  function deleteResult(index) {
    formResults = formResults.filter((_, i) => i !== index);
  }

  async function salvarZotero() {
    resultsStore.set(formResults);
    isEditing = false;
    isLoading = true;
    if (isZotero) {
      const itemKey = currentUrl.split("/items/")[1]?.split("/")[0];
      const zoteroItem = await zoteroService.getItem(
        token.accessSecret,
        token.userID,
        itemKey,
      );
      await zoteroService.saveResults(
        token.accessSecret,
        token.userID,
        zoteroItem.key,
        zoteroItem.version,
        results.map(result => ({...result, result: result.result || "None"})),
      );
    } else {
      const zoteroResult = await zoteroService.saveToZotero(
        token.accessSecret,
        token.userID,
        url,
        articleTitle,
      );
      await zoteroService.saveResults(
        token.accessSecret,
        token.userID,
        zoteroResult.item.key,
        zoteroResult.item.version,
        results,
      );
      window.location.href = zoteroResult.readerLink;
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
    let newResults = null;
    newResults = await classifyDocument();
    if (isZotero && token) {
      const itemKey = currentUrl.split("/items/")[1]?.split("/")[0];
      if (itemKey) {
        const item = await zoteroService.getItem(
          token.accessSecret,
          token.userID,
          itemKey,
        );
        articleTitle = item.data.title || "";
        const tags = item.data.tags || [];
        tags
          .filter((tag) => tag.tag.match(/.+:.+/))
          .forEach((tag) => {
            newResults[tag.tag.split(":")[0]] = tag.tag.split(":")[1];
          });
      }
    }
    for (const resultKey in newResults) {
      addResult(resultKey, newResults[resultKey]);
    }
    isLoading = false;
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

  getToken();
  onDestroy(() => unsubscribe());
  onMount(() => {
    imageUrl = chrome.runtime.getURL("images/QueroQuero-Fundo.png");
  });
  $: if (url) {
    isLoading = true;
    loadResults();
    isEditing = false;
  }
  $: if (isEditing === false) formResults = JSON.parse(JSON.stringify(results))
</script>

{#if url}
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap"
    rel="stylesheet"
  />
  <div id="declassify-wrapper">
    <!-- Popup button -->
    {#if !isModalVisible}
      <div on:click={showModal} id="modal-button">
        {#if imageUrl}
          <img src={imageUrl} alt="Owl Image" id="modal-button-img"/>
        {/if}
      </div>
    {/if}

    <!-- Popup content -->
    {#if isModalVisible}
      <div id="modal">
        <div id="modal-close-container">
          <div id="modal-close-button" on:click={hideModal}>✖</div>
        </div>
        <div id="title"><span>De</span><span>ClassIFY</span></div>
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
                  <p><strong>{result.name}</strong>: {result.result}</p>
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
          {#if isZotero && token}
            {#if isEditing}
              <button
                disabled={isLoading || isAuthorizing}
                on:click={() => {
                  salvarZotero();
                }}
              >
                Save
              </button>
              <button
                disabled={isLoading || isAuthorizing}
                class="cancel"
                on:click={() => {
                  isEditing = false;
                }}>Cancelar
              </button
              >
            {:else}
              <button
                disabled={isLoading || isAuthorizing}
                on:click={() => {
                  isEditing = true;
                }}
              >
                Edit
              </button>
            {/if}
          {:else if token}
            <button disabled={isAuthorizing} on:click={salvarZotero}
            >Save to Zotero
            </button
            >
          {:else}
            <button disabled={isAuthorizing} on:click={zoteroAuth}
            >Connect to Zotero
            </button
            >
          {/if}
        </div>
      </div>
    {/if}
  </div>
  <style>
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

      #declassify-wrapper #modal-button-img {
          height: 100%;
      }

      #declassify-wrapper #modal-button {
          width: 64px;
          height: 64px;
          border-radius: 100%;
          cursor: pointer;
          box-shadow: rgba(0, 0, 0, 0.25) 5px 10px 15px 5px;
          overflow: hidden;
          margin-bottom: 32px;
      }

      #declassify-wrapper #modal-button:hover {
          background-color: rgb(33, 36, 38);
          transition: background-color 0.3s;
      }

      #declassify-wrapper #modal-button > p {
          margin: 0;
          padding: 0;
      }

      #declassify-wrapper #modal {
          font-family: sans-serif;
          background-color: white;
          box-shadow: rgba(0, 0, 0, 0.35) 0 5px 15px;
          width: 230px;
          border-radius: 8px 8px 0 0;
          padding: 20px;
      }

      #declassify-wrapper #modal-close-container {
          display: flex;
          justify-content: flex-end;
          height: 0;
      }

      #declassify-wrapper #modal-close-button {
          cursor: pointer;
      }

      #declassify-wrapper #modal #title {
          text-align: center;
          margin: 0;
          margin-bottom: 8px;
          font-family: Inter;
          font-size: 28px;
      }

      #declassify-wrapper #modal #title > span:nth-child(1) {
          font-weight: 200;
          text-decoration: underline;
      }

      #declassify-wrapper #modal #title > span:nth-child(2) {
          font-weight: bold;
      }

      #declassify-wrapper #pdf-classify-results {
      }

      #declassify-wrapper #pdf-classify-results p {
          margin: 10px 0;
      }

      #declassify-wrapper #document-title {
          color: #1d7392;
          font-size: 14pt;
          text-decoration: underline;
          margin-bottom: 20px;
      }

      #declassify-wrapper #pdf-classify-loader {
          display: flex;
          justify-content: center;
          align-items: center;
          margin: 140px 0;
      }

      #declassify-wrapper #pdf-classify-authorizing {
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

      #declassify-wrapper .loader {
          width: 40px;
          height: 40px;
          border: 4px solid #1d7392;
          border-top: 4px solid transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
      }

      #declassify-wrapper #pdf-classify-loader > span {
          width: 48px;
          height: 48px;
          border: 5px solid #000;
          border-bottom-color: transparent;
          border-radius: 50%;
          display: inline-block;
          box-sizing: border-box;
          animation: spin 1s linear infinite;
      }

      @keyframes spin {
          to {
              transform: rotate(360deg);
          }
      }

      #declassify-wrapper input[type="text"] {
          width: 100%;
          padding: 6px 8px;
          margin-top: 4px;
          font-size: 14px;
          border: 1px solid #ccc;
          border-radius: 6px;
          font-family: Inter, sans-serif;
          box-sizing: border-box;
          transition: border-color 0.2s,
          box-shadow 0.2s;
      }

      #declassify-wrapper input[type="text"]:focus {
          outline: none;
          border-color: #1d7392;
          box-shadow: 0 0 0 2px rgba(29, 115, 146, 0.2);
      }

      button:disabled {
          background-color: gray !important;
          color: #333 !important;
          cursor: not-allowed;
          opacity: 0.7;
      }

      #declassify-wrapper .buttons button {
          width: 100%;
          margin-top: 16px;
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

      #declassify-wrapper .buttons button:hover {
          background-color: #155c75;
      }

      #declassify-wrapper .buttons {
          border-top: 1px solid black;
          display: flex;
          gap: 8px;
          flex-direction: column;
      }

      #declassify-wrapper button.cancel {
          background-color: #ccc;
          color: #333;
      }

      #declassify-wrapper button.cancel:hover {
          background-color: #aaa;
      }

      .input-wrapper {
          margin: 12px 0;
      }

      .input-wrapper label {
          display: flex;
          flex-direction: row;
      }

      .floating-label-input {
          position: relative;
          display: block;
      }

      .floating-label-input input {
          width: 100%;
          padding: 12px 8px 6px;
          font-size: 14px;
          border: 1px solid #ccc;
          border-radius: 6px;
          font-family: Inter, sans-serif;
          background: white;
          box-sizing: border-box;
          color: #333;
      }

      .floating-label-input input:focus {
          border-color: #1d7392;
          outline: none;
          box-shadow: 0 0 0 2px rgba(29, 115, 146, 0.2);
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

      .result-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
      }

      .delete-btn {
          background: transparent;
          border: none;
          color: #d00;
          font-size: 16px;
          cursor: pointer;
          padding: 4px;
          margin: 4px;
      }

      .delete-btn:hover {
          color: #a00;
      }

      .add-btn {
          background: transparent;
          border: none;
          color: #1d7392;
          font-size: 16px;
          cursor: pointer;
          padding: 4px;
          margin-left: 4px;
      }

      .add-btn:hover {
          color: #0c4f66;
      }
  </style>
{/if}
