const resultArea = document.getElementById('scan-result');
const urlInput = document.getElementById('url-input');

// Helper function to extract a URL from a string
function extractUrl(text) {
    // Improved regex to capture URLs but avoid trailing punctuation common in text
    // Matches http/https, ignores trailing ., ) ] > " '
    const urlRegex = /(https?:\/\/[^\s<>\[\]{}()]+)/g;

    // Fallback: If no http/https, try to find www.
    // const wwwRegex = /(www\.[^\s<>\[\]{}()]+)/g;

    let match = text.match(urlRegex);

    if (match) {
        let cleanUrl = match[0];
        // Strip common trailing punctuation often caught by simple regex
        const trailingPunctuation = /[.,;:!?'")\]>]+$/;
        cleanUrl = cleanUrl.replace(trailingPunctuation, '');
        return cleanUrl;
    }

    return null;
}

async function scanUrl() {
    let inputText = urlInput.value.trim();

    if (!inputText) {
        displayResult("ERROR: No input provided. Please enter a URL or text containing one.", "error");
        return;
    }

    // Attempt to extract URL
    let urlToCheck = extractUrl(inputText);

    // If regex failed, but text looks like a domain, prepend https://
    // This allows "google.com" to work
    if (!urlToCheck) {
        if (inputText.includes('.') && !inputText.includes(' ') && inputText.length > 3) {
            // Check if it already has protocol
            if (!/^https?:\/\//i.test(inputText)) {
                urlToCheck = "https://" + inputText;
            } else {
                urlToCheck = inputText;
            }
        } else {
            displayResult("ERROR: Could not find a valid URL in the input.", "error");
            return;
        }
    }

    displayResult(`>> TARGET_ACQUIRED: ${urlToCheck}\n>> INITIALIZING_SCAN...\n>> CONNECTING_TO_SATELLITE...`, "loading");

    try {
        const response = await fetch('https://phishing-proxy.imnullpo.workers.dev', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ urlToCheck: urlToCheck })
        });

        if (!response.ok) {
            // Handle HTTP errors
            throw new Error(`Server returned status: ${response.status}`);
        }

        const data = await response.json();

        console.log("Scan Response:", data);

        // Handle logical API errors
        if (data.error) {
            // Special case: URL not found (often means no scan report exists yet)
            if (data.error.message && data.error.message.includes("not found")) {
                const report = `
[ UNKNOWN STATUS ]
--------------------------------
NO PRIOR SCAN DATA FOUND.
--------------------------------
> The database has no record of this specific URL.
> This implies it is either:
  1. A very new URL (Potentially Risky)
  2. A randomly generated link
  3. A malformed link

>> RECOMMENDATION: EXTREME CAUTION.
>> ACTION: DO NOT VISIT UNLESS CERTAIN.
`;
                displayResult(report, "danger"); // Treat unknown as potentially dangerous in this context
                return;
            }
            throw new Error(data.error.message || "Unknown API Error");
        }

        // Parse VirusTotal Stats
        const stats = data.data?.attributes?.last_analysis_stats;

        if (!stats) {
            throw new Error("Invalid data structure received from scanner.");
        }

        const maliciousCount = stats.malicious;
        const suspiciousCount = stats.suspicious;
        const harmlessCount = stats.harmless;

        if (maliciousCount > 0 || suspiciousCount > 0) {
            const report = `
[ ! WARNING ! ]
--------------------------------
THREAT DETECTED!
--------------------------------
> Malicious Votes: ${maliciousCount}
> Suspicious: ${suspiciousCount}
> Harmless: ${harmlessCount}

>> STATUS: DANGEROUS / UNSAFE
>> ACTION: DO NOT VISIT.
`;
            displayResult(report, "danger");
        } else {
            const report = `
[ SAFE ]
--------------------------------
NO THREATS DETECTED.
--------------------------------
> Malicious Votes: ${maliciousCount}
> Verified Safe by: ${harmlessCount} engines

>> STATUS: CLEAN
>> ACTION: PROCEED_WITH_CAUTION.
`;
            displayResult(report, "safe");
        }

    } catch (error) {
        console.error("Scan Error:", error);
        displayResult(`>> SYSTEM_ERROR: ${error.message}\n>> CHECK_URL_AND_TRY_AGAIN.`, "error");
    }
}

function displayResult(message, type) {
    resultArea.classList.remove('hidden');
    resultArea.textContent = message;

    // Reset classes
    resultArea.className = 'result-area';

    // Clear inline styles
    resultArea.style.borderColor = '';
    resultArea.style.color = '';
    resultArea.style.backgroundColor = '';

    if (type === 'danger') {
        resultArea.classList.add('status-danger');
    } else if (type === 'safe') {
        resultArea.classList.add('status-safe');
    } else if (type === 'error') {
        resultArea.style.borderColor = "#f00";
        resultArea.style.color = "#f00";
    }
}

// Allow pressing "Enter" to scan
urlInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        document.getElementById("scan-btn").click();
    }
});
