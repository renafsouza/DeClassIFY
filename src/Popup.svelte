<script>
  import {onMount} from "svelte";
  import { resultsStore } from './store/store.js';
  import { onDestroy } from 'svelte';

  export let url

  let imageUrl;
  let isModalVisible = false;
  let isLoading = false;
  let articleTitle = '';
  let results = [];

  const unsubscribe = resultsStore.subscribe(value => {
    results = value;
  });

  onDestroy(() => unsubscribe());

  function showModal() {
    isModalVisible = true;
  }

  function hideModal() {
    isModalVisible = false;
  }

  onMount(() => {
    imageUrl = chrome.runtime.getURL("images/QueroQuero-Fundo.png");
  });
</script>

{#if url}
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap"
          rel="stylesheet">
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
          <div id="document-title">{articleTitle}</div>
          <div id="pdf-classify-results">
            {#each results as {name, result}}
              <p><strong>{name}</strong>: {result}</p>
            {/each}
          </div>
          {#if isLoading}
            <div id="pdf-classify-loader">
              <span></span>
            </div>
          {/if}
        </div>
      {/if}

  </div>
  <style>
    #declassify-wrapper {
      position: fixed;
      right: 64px;
      bottom: 0;
      display: flex;
      align-items: flex-end;
      flex-direction: column;
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
      transition: background-color .3s;
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
      border-bottom: 1px solid black
    }

    #declassify-wrapper #pdf-classify-results p {
      margin: 10px 0;
    }

    #declassify-wrapper  #document-title {
      color: #1D7392;
      font-size:14pt;
      text-decoration: underline;
      margin-bottom: 20px ;
    }

    #declassify-wrapper #pdf-classify-loader > span {
      width: 48px;
      height: 48px;
      border: 5px solid #000;
      border-bottom-color: transparent;
      border-radius: 50%;
      display: inline-block;
      box-sizing: border-box;
      animation: rotation 1s linear infinite;
    }

    @keyframes rotation {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }

    #declassify-wrapper #pdf-classify-loader {
      display: flex;
      justify-content: center;
      align-items: center;
    }
  </style>
{/if}
