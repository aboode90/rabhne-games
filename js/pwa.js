// PWA Install Logic

let deferredPrompt;
const pwaBtn = document.createElement('div');
pwaBtn.id = 'pwaInstallBtn';
pwaBtn.className = 'pwa-install-btn';
pwaBtn.innerHTML = `
    <button class="btn btn-primary pulse-animation" style="box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
        📱 تثبيت التطبيق
    </button>
`;
pwaBtn.style.display = 'none'; // Hidden by default
pwaBtn.style.position = 'fixed';
pwaBtn.style.bottom = '80px';
pwaBtn.style.right = '20px'; // Changed to right for RTL
pwaBtn.style.zIndex = '9999';

// Add to DOM on load
window.addEventListener('load', () => {
    document.body.appendChild(pwaBtn);
});

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    // Update UI to notify the user they can add to home screen
    pwaBtn.style.display = 'block';

    pwaBtn.querySelector('button').addEventListener('click', (e) => {
        // hide our user interface that shows our A2HS button
        pwaBtn.style.display = 'none';
        // Show the prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the A2HS prompt');
            } else {
                console.log('User dismissed the A2HS prompt');
            }
            deferredPrompt = null;
        });
    });
});
