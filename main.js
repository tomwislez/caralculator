// Register the service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register("./caralculator-service-worker.js").then((reg) => {
    console.log("[Service Worker] Registered.")

    // Auto-check for updates
    setInterval(() => {
      reg.update().catch(err => {
        console.error('[Service Worker] Error checking for service worker update:', err);
      });
    }, 60 * 60 * 1000); // Check every hour
  }).catch((err) =>{
    console.error("[Service Worker] Restration failed: ", err);
  });
};

$(document).ready(function(){
  // Catch the install event from the browser to use it later and to show an install button.

  let deferredPrompt;

  // Listen for the beforeinstallprompt event to show the install button
  window.addEventListener('beforeinstallprompt', (event) => {
      console.log('[Service Worker] beforeinstallprompt fired');
      // Prevent the default behavior (which is to show the native install prompt)
      event.preventDefault();
      // Save the event to trigger later
      deferredPrompt = event;
      // Make your install button visible
      $('#install-button').removeClass('hidden'); // Show your install button
  });

  $('#install-button').click( () => {
      if (deferredPrompt) {
          // Show the install prompt
          deferredPrompt.prompt();
          // Wait for the user to respond to the prompt
          deferredPrompt.userChoice
          .then((choiceResult) => {
              if (choiceResult.outcome == 'accepted') {
              console.log('[Service Worker] User accepted the A2HS prompt');
              $('#install-button').addClass('hidden')
              } else {
              console.log('[Service Worker] User dismissed the A2HS prompt');
              }
              // Clear the deferred prompt after user interaction
              deferredPrompt = null;
          });
      }
  });
});