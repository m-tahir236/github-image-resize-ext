// Load settings when the popup is opened
document.addEventListener('DOMContentLoaded', () => {
    // Load stored settings
    chrome.storage.sync.get(['imgWidth', 'scriptEnabled', 'updateExisting'], (data) => {
        document.getElementById('img-width').value = data.imgWidth || 100;  // Default to 100 if not set
        document.getElementById('toggle-script').checked = data.scriptEnabled !== false;  // Default to enabled
        document.getElementById('update-existing').checked = data.updateExisting || false;  // Default to unchecked
    });

    // Save settings when Save button is clicked
    document.getElementById('save-settings').addEventListener('click', () => {
        const imgWidth = document.getElementById('img-width').value;
        const scriptEnabled = document.getElementById('toggle-script').checked;
        const updateExisting = document.getElementById('update-existing').checked;

        // Store settings in Chrome storage
        chrome.storage.sync.set({ imgWidth: imgWidth, scriptEnabled: scriptEnabled, updateExisting: updateExisting }, () => {
            // Immediately apply the new settings to the current page
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'updateSettings' });
            });

            // Show "Success!" message
            const successMessage = document.getElementById('success-message');
            successMessage.style.display = 'block';
            setTimeout(() => {
                successMessage.style.display = 'none';  // Hide message after 2 seconds
            }, 2000);
        });
    });

    // Move images to screenshots section when button is clicked
    document.getElementById('move-images').addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'moveImages' });
        });
    });
});
