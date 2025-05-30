<script>
  import DeclassifyService from './services/declassify.service.js'; // Statically import the service
  import Popup from './Popup.svelte';
  import { resultsStore } from './store/store.js';
  import { onDestroy } from 'svelte';

  let url
  let articleTitle = '';
  let modalHost;
  let hosted = false;
  let results = []
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

  function addResult(name, result) {
    resultsStore.update((items) => [...items, { name, result }]);
  }

  async function classifyDocument() {
    const declassify = new DeclassifyService();
    const {title, results: newResults} = await declassify.classify(url);
    articleTitle = title;
    resultsStore.update(()=>[])
    addResult("Nature", `${newResults.nature}`);
    addResult("Method", `${newResults.method}`);
    addResult("Validation Strategy", `${newResults.validationStrategy}`);
    addResult("Data Nature", `${newResults.dataNature}`);
    addResult("Environment", `${newResults.environment}`);
    addResult("Methodological", `${newResults.methodological}`);
    addResult("Proof", `${newResults.proof}`);
    addResult("Purpose", `${newResults.purpose}`);
    addResult("Secondary Proof", `${newResults.secondaryProof}`);
    addResult("Validation Result", `${newResults.validationResult}`);
    addResult("exemplo", `${newResults.exemplo}`);
  }

  window.addEventListener('pdfUrlDetected', async (event) => {
    if (!url) {
      url = event.detail;
      classifyDocument();
    }
    if (modalHost && url && !hosted) {
      hosted = true
      const shadowRoot = modalHost.attachShadow({mode: 'open'});
      new Popup({target: shadowRoot, props: {open: true, url}});
    }
  });

  window.addEventListener('pdfUrlDetected', (event) => {
    if(!url){
      url = event.detail;
      classifyDocument();
    }
  });

  url = getUrl();
  if(url) classifyDocument();
  onDestroy(() => unsubscribe());
</script>

{#if results}
    <div bind:this={modalHost} ></div>
{/if}

