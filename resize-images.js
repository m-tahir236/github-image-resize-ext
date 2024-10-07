(function() {
    'use strict';

    let imgWidth = 100;  // Default width
    let scriptEnabled = true;  // Default enabled state
    let updateExisting = false;  // Default to not update existing images

    // Load settings from Chrome storage
    chrome.storage.sync.get(['imgWidth', 'scriptEnabled', 'updateExisting'], (data) => {
        imgWidth = data.imgWidth || 100;
        scriptEnabled = data.scriptEnabled !== false;  // Enabled by default
        updateExisting = data.updateExisting || false;
    });

    // Function to resize images in the PR description
    function resizeImages(text) {
        if (!scriptEnabled) return text;  // Do nothing if the script is disabled

        // Regex for Markdown images
        const markdownRegex = /!\[.*?\]\((.*?)\)/g;
        // Regex for existing HTML <img> tags
        const imgTagRegex = /<img.*?src="(.*?)".*?>/g;

        let textWithoutImages = text; // To hold the text without images

        // Replace Markdown images with resized <img> tags
        textWithoutImages = textWithoutImages.replace(markdownRegex, (match, url) => {
            if (url.includes('Uploading') || url.trim() === '') return match;  // Skip if uploading or empty URL
            return `<img src="${url}" width="${imgWidth}" />`;  // Replace Markdown image with <img>
        });

        // If updating existing images, replace <img> tags inside textarea content
        if (updateExisting) {
            textWithoutImages = textWithoutImages.replace(imgTagRegex, (match, url) => {
                return `<img src="${url}" width="${imgWidth}" />`;  // Replace with resized <img> tag
            });
        }

        return textWithoutImages; // Return the updated text
    }

    // Function to move images to the screenshots section
    function moveImagesToScreenshots() {
        const prBody = document.getElementById('pull_request_body');  // The PR description textarea
        if (prBody) {
            const currentText = prBody.value;
            const imgTagRegex = /<img.*?src="(.*?)".*?>/g;  // Regex for <img> tags

            let imagesToMove = [];
            let textWithoutImages = currentText.replace(imgTagRegex, (match) => {
                imagesToMove.push(match);  // Collect images to move
                return '';  // Remove images from the current text
            });

            // Update the PR body text without images
            prBody.value = textWithoutImages;

            // Move the collected images to the "Screenshots" section
            const screenshotSectionRegex = /(#\s*Screenshots\s*#\s*)([\s\S]*?)(?=\n#|\z)/i;  // Regex to find the Screenshots section
            if (screenshotSectionRegex.test(prBody.value)) {
                const imagesToInsert = imagesToMove.join('\n').trim();  // Combine images
                prBody.value = prBody.value.replace(screenshotSectionRegex, (match, sectionHeader) => {
                    return `${sectionHeader}${imagesToInsert ? `\n${imagesToInsert}\n` : ''}`;  // Insert images in the section
                });
            }
        }
    }

    // Listen for messages from the popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'updateSettings') {
            // Reload settings and immediately apply them
            chrome.storage.sync.get(['imgWidth', 'scriptEnabled', 'updateExisting'], (data) => {
                imgWidth = data.imgWidth || 100;
                scriptEnabled = data.scriptEnabled !== false;
                updateExisting = data.updateExisting || false;

                // Apply the updates immediately
                checkAndUpdatePRBody();
            });
        } else if (request.action === 'moveImages') {
            moveImagesToScreenshots();  // Move images when button is clicked
        }
    });

    // Function to check and update PR body (textarea content)
    function checkAndUpdatePRBody() {
        const prBody = document.getElementById('pull_request_body');  // The PR description textarea
        if (prBody) {
            const currentText = prBody.value;
            const updatedText = resizeImages(currentText);  // Resize images in the PR body

            // Only update the textarea if changes are detected
            if (currentText !== updatedText) {
                prBody.value = updatedText;  // Update the textarea content
            }
        }
    }

    // Use MutationObserver to watch for changes in the textarea
    const observer = new MutationObserver(() => {
        const prBody = document.getElementById('pull_request_body');
        if (prBody && window.location.href.includes("github.com")) {  // Check if on GitHub
            checkAndUpdatePRBody();  // Update the content whenever the textarea changes
        }
    });

    // Observe changes to the body in case of dynamic loading
    observer.observe(document.body, { childList: true, subtree: true });

    // Periodically check and update content
    setInterval(() => {
        if (window.location.href.includes("github.com")) {  // Check if on GitHub
            checkAndUpdatePRBody();
        }
    }, 1000);  // Check every second for updates in the text
})();
