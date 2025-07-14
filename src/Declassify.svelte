<script>
  import Popup from './Popup.svelte';
  import { resultsStore } from './store/store.js';
  import { onDestroy, onMount } from 'svelte';



  let url,
    modalHost,
    hosted = false

  function getUrl() {
    const currentUrl = window.location.href;
    if (currentUrl.endsWith(".pdf")) {
      return currentUrl;
    }
    return null;
  }

  onMount(() => {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === "pdfUrlDetected") {
        if (!url) {
          url = message.url;
        }
        if (modalHost && url && !hosted) {
          hosted = true
          const shadowRoot = modalHost.attachShadow({mode: 'open'});
          new Popup({target: shadowRoot, props: {open: true, url}});
        }
      }
    });
    url = getUrl();
    chrome.runtime.sendMessage({ type: "content-script-ready" });
  });

  onDestroy(() => unsubscribe());
</script>

<div bind:this={modalHost} ></div>

