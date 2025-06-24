<script>
  import DeclassifyService from './services/declassify.service.js'; // Statically import the service
  import Popup from './Popup.svelte';
  import { resultsStore } from './store/store.js';
  import { onDestroy } from 'svelte';
  import zoteroService from "./services/zotero.service.js";

  const currentUrl = window.location.href;
  const isZotero = currentUrl.includes("zotero.org") && currentUrl.includes("/reader")
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
      console.log('classifyDocument with URL=',url)
      const declassify = new DeclassifyService();
      const {title, results: newResults} = await declassify.classify(url);
      articleTitle = title;
      resultsStore.update(()=>[])
      return newResults
  }

  async function loadResults() {
    console.log('loadResults')
    let newResults = null
    newResults = await classifyDocument()
    console.log('isZotero', isZotero)
    if (isZotero) {
      const itemKey = currentUrl.split("/items/")[1]?.split("/")[0];
      console.log('itemKey', itemKey)
      if (itemKey) {
        const tags = await zoteroService.getTags(itemKey);
        console.log('tags', tags)
        tags.forEach(tag=>{
          newResults[tag.tag.split(":")[0]] = tag.tag.split(":")[1]
        })
      }
    }
    console.log("newResults", newResults)
    for(const resultKey in newResults) {
      addResult(resultKey, newResults[resultKey]);
    }
  }

  window.addEventListener('pdfUrlDetected', async (event) => {
    if (!url) {
      console.log('pdfUrlDetected', event.detail)
      url = event.detail;
    }
    if (modalHost && url && !hosted) {
      hosted = true
      const shadowRoot = modalHost.attachShadow({mode: 'open'});
      new Popup({target: shadowRoot, props: {open: true, url}});
    }
  });

  url = getUrl();
  $: if(url) loadResults();
  onDestroy(() => unsubscribe());
</script>

{#if results}
    <div bind:this={modalHost} ></div>
{/if}

