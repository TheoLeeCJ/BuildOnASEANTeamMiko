function registerServiceWorker() {
  return navigator.serviceWorker.register('/sw.js')
  .then(function(registration) {
    console.log('Service worker successfully registered.');
    return registration;
  })
  .catch(function(err) {
    console.error('Unable to register service worker.', err);
  });
}

function urlBase64ToUint8Array(base64String) {
  var padding = '='.repeat((4 - base64String.length % 4) % 4);
  var base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

  var rawData = window.atob(base64);
  var outputArray = new Uint8Array(rawData.length);

  for (var i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function subscribeUser() {
  return navigator.serviceWorker.register('/sw.js')
  .then(function(registration) {
    const subscribeOptions = {
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        'BFuEzfLArTeOYWVKHoGnTFNYx_Wy8QdEZqUDtjFfkFh0Sj17pnWeBn79DksHp7eq-8Zqoeixd-uQzLtDNQYmhaQ'
      ),
    };

    return registration.pushManager.subscribe(subscribeOptions);
  })
  .then(function(pushSubscription) {
    console.log('Received PushSubscription: ', JSON.stringify(pushSubscription));
    console.log(JSON.parse(JSON.stringify(pushSubscription)));
    document.querySelector("pre").innerHTML = JSON.stringify(pushSubscription);
    return pushSubscription;
  });
}
