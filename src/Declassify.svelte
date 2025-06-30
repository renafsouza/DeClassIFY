<script>
  import Popup from './Popup.svelte';
  import { resultsStore } from './store/store.js';
  import { onDestroy, onMount } from 'svelte';


  let url,
    modalHost,
    hosted = false,
    results = []

  const unsubscribe = resultsStore.subscribe(value => {
    results = value;
  });

  function getUrl() {
    const currentUrl = window.location.href;
    if (currentUrl.endsWith(".pdf")) {
      return currentUrl;
    }
    const plugin = document.querySelector('embed[type="application/pdf"]');
    if (plugin && plugin.getAttribute("type") === "application/pdf") {
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
    chrome.runtime.sendMessage({ type: "content-script-ready" });
    url = getUrl();
  });

  onDestroy(() => unsubscribe());
</script>

{#if results}
    <div bind:this={modalHost} ></div>
{/if}

