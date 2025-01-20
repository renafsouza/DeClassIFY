<script>
    import DeclassifyService from './services/declassify.service.js'; // Statically import the service
    import {onMount} from "svelte";

    let imageUrl;
    let url
    let isModalVisible = false;
    let results = [];
    let isLoading = false;
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

    function showModal() {
        isModalVisible = true;
    }

    function hideModal() {
        isModalVisible = false;
    }

    function addResult(name, result) {
        results = [...results, {name, result}];
    }

    async function classifyDocument() {
        const declassify = new DeclassifyService();
        isLoading = true;
        const {title, results: newResults} = await declassify.classify(url);
        articleTitle = title;
        isLoading = false;

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
    }

    url = getUrl();

    classifyDocument();
    onMount(() => {
        imageUrl = chrome.runtime.getURL("images/owl-big.png");
    });
</script>

{#if url}
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap"
          rel="stylesheet">
    <div id="wrapper">
        <!-- Modal button -->
        {#if !isModalVisible}
            <div on:click={showModal} id="modal-button">
                {#if imageUrl}
                    <img src={imageUrl} alt="Owl Image" id="modal-button-img"/>
                {/if}
            </div>
        {/if}

        <!-- Modal content -->
        {#if isModalVisible}
            <div id="modal">
                <div id="modal-close-container">
                    <div id="modal-close-button" on:click={hideModal}>✖</div>
                </div>
                <div id="title"><span>De</span><span>classify</span></div>
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
{/if}

<style>
    #wrapper {
        position: fixed;
        right: 32px;
        bottom: 0;
        display: flex;
        align-items: flex-end;
        flex-direction: column;
    }

    #modal-button-img {
        height: 100%;
    }

    #modal-button {
        width: 74px;
        height: 74px;
        border-radius: 100%;
        cursor: pointer;
        box-shadow: rgba(0, 0, 0, 0.25) 5px 10px 15px 5px;
        overflow: hidden;
        margin-bottom: 20px;
    }

    #modal-button:hover {
        background-color: rgb(33, 36, 38);
        transition: background-color .3s;
    }

    #modal-button > p {
        margin: 0;
        padding: 0;
    }

    #modal {
        font-family: sans-serif;
        background-color: white;
        box-shadow: rgba(0, 0, 0, 0.35) 0 5px 15px;
        width: 230px;
        border-radius: 8px 8px 0 0;
        padding: 20px;
    }

    #modal-close-container {
        display: flex;
        justify-content: flex-end;
        height: 0;
    }

    #modal-close-button {
        cursor: pointer;
    }

    #modal #title {
        text-align: center;
        margin: 0;
        margin-bottom: 8px;
        font-family: Inter;
        font-size: 28px;
    }

    #modal #title > span:nth-child(1) {
        font-weight: 200;
        text-decoration: underline;
    }

    #modal #title > span:nth-child(2) {
        font-weight: bold;
    }

    #pdf-classify-results {
        border-bottom: 1px solid black
    }

    #pdf-classify-results p {
        margin: 10px 0;
    }

    #document-title {
        color: #1D7392;
        text-decoration: underline;
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