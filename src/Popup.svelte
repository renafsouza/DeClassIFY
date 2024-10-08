<script>
  import DeclassifyService from './services/declassify.service.js'; // Statically import the service
  let url = '';
  let isModalVisible = false;
  let results = [];
  let isLoading = false;

  // Function to get the URL if it's a PDF
  function getUrl() {
    const currentUrl = window.location.href;

    if (currentUrl.endsWith(".pdf")) {
      return currentUrl;
    }

    const plugin = document.querySelector('embed[type="application/pdf"]');
    if (plugin && plugin.getAttribute("type") == "application/pdf") {
      return currentUrl;
    }
    return null;
  }

  // Function to show the modal
  function showModal() {
    isModalVisible = true;
  }

  // Function to hide the modal
  function hideModal() {
    isModalVisible = false;
    results = []; // Clear results when modal is closed
  }

  // Function to add classification result
  function addResult(name, result) {
    results = [...results, { name, result }];
  }

  // On component mount, get the URL
  // Fetch classification results on mount
  async function classifyDocument() {
    const declassify = new DeclassifyService();
    isLoading = true;
    const { results: newResults } = await declassify.classify(url);
    isLoading = false;

    // Add classification results
    addResult("Nature", `${newResults.nature}`);
    addResult("Method", `${newResults.method}`);
    addResult("Validation Strategy", `${newResults.validation_strategy}`);
    addResult("Data Nature", `${newResults.data_nature}`);
    addResult("Environment", `${newResults.environment}`);
    addResult("Methodological", `${newResults.methodological}`);
    addResult("Proof", `${newResults.proof}`);
    addResult("Purpose", `${newResults.purpose}`);
    addResult("Secondary Proof", `${newResults.secondary_proof}`);
    addResult("Validation Result", `${newResults.validation_result}`);
  }

  // Initialize URL on component mount
  url = getUrl();

  // Call classifyDocument when component is ready
  classifyDocument();
</script>

{#if url}
  <!-- Main button to open the modal -->
  <div on:click={showModal} id="pdf-classify">
    <p >Declassify</p>
  </div>

  <!-- Modal content -->
  {#if isModalVisible}
    <div id="pdf-classify-modal">
      <div id="pdf-classify-modal-close-container">
        <div id="pdf-classify-modal-close-button" on:click={hideModal}>✖</div>
      </div>
      <h2>Classification</h2>
      <div id="pdf-classify-results">
        {#each results as { name, result }}
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
{/if}

<style>
  #pdf-classify {
    position: fixed;
    background-color: rgb(50, 54, 57);
    width: 86px;
    height: 86px;
    border-radius: 100%;
    right: 32px;
    bottom: 32px;
    align-items: center;
    justify-content: center;
    display: flex;
    color: white;
    font-size: .87rem;
    font-weight: 600;
    font-family: system-ui, sans-serif;
    display: flex;
    cursor: pointer;
    box-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;
  }

  #pdf-classify:hover {
    background-color: rgb(33, 36, 38);
    transition: background-color .3s;
  }

  #pdf-classify > p {
    margin: 0;
    padding: 0;
  }

  #pdf-classify-modal {
    font-family: sans-serif;
    position: fixed;
    margin: 0 auto;
    background-color: white;
    box-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;
    width: 300px;
    height: 400px;
    border-radius: 8px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 8px;
  }

  #pdf-classify-modal-close-container {
    display: flex;
    justify-content: flex-end;
  }

  #pdf-classify-modal-close-button {
    cursor: pointer;
  }

  #pdf-classify-modal h2 {
    text-align: center;
    margin: 0;
    margin-bottom: 8px;
  }

  #pdf-classify-results {
    padding: 0 16px;
  }

  #pdf-classify-loader > span {
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

  #pdf-classify-loader {
    display: flex;
    justify-content: center;
    align-items: center;
  }

</style>