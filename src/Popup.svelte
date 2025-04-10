<script>
  import DeclassifyService from './services/declassify.service.js'; // Statically import the service
  import {onMount} from "svelte";
  import Modal from './Modal.svelte';

  let url
  let results = [];
  let articleTitle = '';

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
    results = [...results, {name, result}];
  }

  async function classifyDocument() {
    const declassify = new DeclassifyService();
    const {title, results: newResults} = await declassify.classify(url);
    articleTitle = title;

    // Add classification results
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

  url = getUrl();

  classifyDocument();
  let modalHost;
  let hosted = false;
  window.addEventListener('pdfUrlDetected', (event) => {
    if (!url) {
      url = event.detail;
      classifyDocument();
    }
    if (modalHost && url && !hosted) {
      hosted = true
      console.log("Modal Host: " + url);
      const shadowRoot = modalHost.attachShadow({mode: 'open'});
      new Modal({target: shadowRoot, props: {open: true, url}});
    }
  });

</script>

{#if url}
    <div bind:this={modalHost}></div>
{/if}

