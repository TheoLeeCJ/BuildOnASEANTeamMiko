async function startChat(itemId) {
  if (user === null) {
    location.href = "/login.html?r=0";
    return;
  }
  else {
    if (!notificationsEnabled) {
      await registerServiceWorker();

      let res = confirm("To use chat functionality of the Used Item Marketplace, we recommend allowing us to send you notifications.\n\n" +
"If you press OK, you will be prompted to allow notifications; please press 'Allow'.\n\n" +
"Otherwise, you can just press Cancel.");

      if (res) {
        let subscription;
        try {
          subscription = await subscribeUser();
          localStorage.setItem("notifications", "");
          notificationsEnabled = true;

          // POST subscription
          let subscribeData = new FormData();
          subscribeData.append("endpoint", subscription.endpoint);
          subscribeData.append("keys", JSON.stringify(subscription.keys));

          (user !== null) ? subscribeData.append("jwt", localStorage.getItem("session")) : "";
          
          await fetch(`${API_ENDPOINT}/chat/subscribe`, {
            method: "post",
            body: subscribeData,
          });
        }
        catch (e) {
          alert("You denied us permission to send you chat notifications. To fully utilise chat, please enable notifications.");
        }
      }
    }

    let startChatData = new FormData();

    // POST to start chat API
    let chatData = await fetch(`${API_ENDPOINT}/chat/begin`, {
      method: "post",
      body: startChatData,
    }).then(res => res.json());
  }
}

async function registerServiceWorker() {
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service worker successfully registered.');
    return registration;
  } catch (err) {
    console.error('Unable to register service worker.', err);
  }
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

async function subscribeUser() {
  const registration = await navigator.serviceWorker.register('/sw.js');
  const subscribeOptions = {
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(
      'BFuEzfLArTeOYWVKHoGnTFNYx_Wy8QdEZqUDtjFfkFh0Sj17pnWeBn79DksHp7eq-8Zqoeixd-uQzLtDNQYmhaQ'
    ),
  };
  const pushSubscription = await registration.pushManager.subscribe(subscribeOptions);
  return JSON.parse(JSON.stringify(pushSubscription));
}