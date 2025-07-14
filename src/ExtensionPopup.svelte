<script>
  import { onMount } from 'svelte';
  import zoteroAuthService from "./services/zotero-auth.service.js";

  // --- Reactive State ---
  let zoteroUser = null; // Holds the username if logged in, otherwise null
  let currentDomain = ''; // The domain of the current active tab
  let ignoredDomains = []; // Array of ignored domains from storage
  let isDomainIgnored = false; // Reactive boolean for the toggle state
  let isReady = false; // Prevents UI flicker before data is loaded
  let isLoggingIn = false; // Tracks the login process state

  // --- Lifecycle Hook (runs when the component is first rendered) ---
  onMount(async () => {
    // Fetch Zotero user status from storage
    chrome.storage.local.get(['zoteroUser', 'ignoredDomains'], (result) => {
      zoteroUser = result.zoteroUser || null;
      ignoredDomains = result.ignoredDomains || [];

      // Get the current tab to identify the domain
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url) {
          try {
            const url = new URL(tabs[0].url);
            currentDomain = url.hostname;
          } catch (e) {
            currentDomain = "Invalid page";
          }
        } else {
          currentDomain = "No active tab";
        }

        // Update the toggle's state based on the loaded data
        updateIsDomainIgnored();
        isReady = true; // Mark as ready to show the UI
      });
    });

    // Listen for storage changes from other parts of the extension
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (changes.zoteroUser) {
        zoteroUser = changes.zoteroUser.newValue || null;
      }
      if (changes.ignoredDomains) {
        ignoredDomains = changes.ignoredDomains.newValue || [];
        updateIsDomainIgnored();
      }
    });
  });

  // --- Logic ---

  // A derived store would be overkill here; a simple function is fine.
  function updateIsDomainIgnored() {
    isDomainIgnored = currentDomain && ignoredDomains.includes(currentDomain);
  }

  // Handle login
  async function handleLogin() {
    isLoggingIn = true; // Show loading indicator
    try {
      const user = await zoteroAuthService.startOAuthFlow();
      await zoteroAuthService.saveZoteroUser(user);
    } catch (error) {
      console.error("Zotero login failed:", error);
      // Optionally, show an error message to the user
    } finally {
      isLoggingIn = false; // Hide loading indicator
    }
  }

  function handleLogout() {
    zoteroAuthService.unsaveZoteroUser();
  }

  $: if (isReady && currentDomain) {
    let updatedIgnoredDomains;
    if (isDomainIgnored) {
      updatedIgnoredDomains = [...new Set([...ignoredDomains, currentDomain])];
    } else {
      updatedIgnoredDomains = ignoredDomains.filter(domain => domain !== currentDomain);
    }
    chrome.storage.local.set({ ignoredDomains: updatedIgnoredDomains });
  }
</script>

<main>
  {#if isReady}
    <div class="header">
      <h1 class="title">My Extension</h1>
    </div>

    <div class="section">
      <h2 class="section-title">Zotero Account</h2>
      {#if zoteroUser}
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon-check" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <span class="username">{zoteroUser?.username}</span>
          </div>
          <button on:click={handleLogout} class="button button-sm button-red">
            Logout
          </button>
        </div>
      {:else}
        <div>
          {#if isLoggingIn}
            <div class="loading-container">
              <div class="spinner"></div>
              <p class="text-sm text-center text-gray-600">
                Redirecting to Zotero...<br/>Please complete the authorization in the new window.
              </p>
            </div>
          {:else}
            <button on:click={handleLogin} class="button button-blue" disabled={isLoggingIn}>
              Connect to Zotero
            </button>
          {/if}
        </div>
      {/if}
    </div>

    <div class="container">
      <h2 class="section-title">Site Settings</h2>
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm">Ignore this domain:</p>
          <p class="text-xs text-gray-500 font-mono">{currentDomain || '...'}</p>
        </div>
        <div class="toggle-container">
          <input type="checkbox" bind:checked={isDomainIgnored} id="ignoreDomainToggle" class="toggle-checkbox" disabled={!currentDomain || currentDomain === 'Invalid page'}/>
          <label for="ignoreDomainToggle" class="toggle-label"></label>
        </div>
      </div>
    </div>
  {/if}
</main>

<style>
    :global(body) {
        padding: 0;
        margin: 0;
    }
    main {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
        width: 320px;
        background-color: #f9fafb;
        color: #1f2937;
    }
    .container {
        padding: 1rem;
    }
    .header {
        padding: 1rem;
        border-bottom: 1px solid #e5e7eb;
        text-align: center;
    }
    .title {
        font-size: 1.125rem;
        font-weight: 700;
        color: #111827;
        margin: 0;
    }
    .section {
        padding: 1rem;
        border-bottom: 1px solid #e5e7eb;
    }
    .section-title {
        font-weight: 600;
        color: #374151;
        margin-top: 0;
        margin-bottom: 0.75rem;
    }
    .flex {
        display: flex;
    }
    .items-center {
        align-items: center;
    }
    .justify-between {
        justify-content: space-between;
    }
    .space-x-2 > :not([hidden]) ~ :not([hidden]) {
        margin-left: 0.5rem;
    }
    .username {
        font-size: 0.875rem;
        font-weight: 500;
    }
    .icon-check {
        height: 1.5rem;
        width: 1.5rem;
        color: #10b981;
        flex-shrink: 0;
    }
    .button {
        font-weight: 700;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        border: none;
        cursor: pointer;
        transition: background-color 0.3s;
    }
    .button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    .button-sm {
        font-size: 0.875rem;
        padding: 0.25rem 0.75rem;
    }
    .button-red {
        background-color: #ef4444;
        color: white;
    }
    .button-red:hover {
        background-color: #dc2626;
    }
    .button-blue {
        background-color: #3b82f6;
        color: white;
        width: 100%;
    }
    .button-blue:hover {
        background-color: #2563eb;
    }
    .text-sm {
        font-size: 0.875rem;
    }
    .text-xs {
        font-size: 0.75rem;
    }
    .text-center {
        text-align: center;
    }
    .text-gray-500 {
        color: #6b7280;
    }
    .text-gray-600 {
        color: #4b5563;
    }
    .font-mono {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    }
    .toggle-container {
        position: relative;
        display: inline-block;
        width: 2.5rem;
        flex-shrink: 0;
        vertical-align: middle;
        user-select: none;
    }
    .toggle-checkbox {
        position: absolute;
        display: block;
        width: 1.5rem;
        height: 1.5rem;
        border-radius: 9999px;
        background-color: white;
        border: 4px solid transparent;
        appearance: none;
        cursor: pointer;
        left: 0;
        transition: left 0.2s ease-in;
        margin: 0;
    }
    .toggle-label {
        display: block;
        overflow: hidden;
        height: 1.5rem;
        border-radius: 9999px;
        background-color: #d1d5db;
        cursor: pointer;
    }
    .toggle-checkbox:checked {
        left: 1rem;
        border-color: #4f46e5;
    }
    .toggle-checkbox:checked + .toggle-label {
        background-color: #4f46e5;
    }
    .toggle-checkbox:disabled {
        cursor: not-allowed;
        opacity: 0.5;
    }
    .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        padding: 0.5rem;
    }
    .spinner {
        width: 1.5rem;
        height: 1.5rem;
        border: 3px solid #e5e7eb;
        border-top-color: #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>