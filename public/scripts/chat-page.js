let currentChatItemCatWithId;
let currentChat;

function refreshChat() {
  openChat(currentChat, currentChatItemCatWithId);
}

async function sendComplete() {
  if (currentChatItemCatWithId === null) return;

  let sendForm = new FormData();
  sendForm.set("jwt", localStorage.getItem("session"));
  sendForm.set("chatstore", currentChat);
  sendForm.set("itemCatWithId", currentChatItemCatWithId);
  sendForm.set("message", "none");
  sendForm.set("action", "complete");

  let res = await fetch(`${API_ENDPOINT}/chat/send`, {
    method: "post",
    body: sendForm,
  }).then(res => res.json());

  document.querySelector("#msg-input > input").value = "";

  openChat(currentChat, currentChatItemCatWithId);
}

async function sendMsg() {
  if (currentChatItemCatWithId === null) return;
  let message = document.querySelector("#msg-input > input").value;
  if (message.trim().length === 0){
    alert("You cannot send an empty message.");
    return;
  }

  console.log(message);
  console.log(message.indexOf(" at "));

  if (message.indexOf(" at ") !== -1) {
    document.querySelector("#locdialog").classList.add("display");
    document.querySelector("#locdialog-content h2").innerText = "Location Suggestions";
    document.querySelector("#locdialog-content p").innerText = "Your selected location may be a little crowded at this time. Please consider potential alternatives below (not mandatory):\n\nHeartland Mall, Kovan\nBlock Kovan Residences";
  }

  let sendForm = new FormData();
  sendForm.set("jwt", localStorage.getItem("session"));
  sendForm.set("chatstore", currentChat);
  sendForm.set("itemCatWithId", currentChatItemCatWithId);
  sendForm.set("message", message);
  sendForm.set("action", "send");

  let res = await fetch(`${API_ENDPOINT}/chat/send`, {
    method: "post",
    body: sendForm,
  }).then(res => res.json());

  document.querySelector("#msg-input > input").value = "";

  openChat(currentChat, currentChatItemCatWithId);
}

async function openChat(chatStore, itemCatWithId) {
  currentChatItemCatWithId = itemCatWithId;
  currentChat = chatStore;

  let obtainPresignedForm = new FormData();
  obtainPresignedForm.set("jwt", localStorage.getItem("session"));
  obtainPresignedForm.set("chatstore", chatStore);

  let presigned = await fetch(`${API_ENDPOINT}/chat/get-url`, {
    method: "post",
    body: obtainPresignedForm,
  }).then(res => res.json());
  presigned = presigned["data"];

  sessionStorage.setItem("chat-url", presigned);

  if (presigned !== null) {
    fetch(presigned).then(res => res.json()).then((chatData) => {
      chatData["chatStore"] = new URL(presigned).pathname.replace("/chats/", "");
      renderChat(chatData);
    });
  }
}

async function initChatPage() {
  if (user === null) {
    location.href = "/login.html?r=0";
    return;
  }
  else {
    if (!notificationsEnabled) {
      console.log("Prompt for subscription");
      await initSubscription();
    }

    navigator.serviceWorker.addEventListener("message", event => {
      refreshChat();
      document.querySelector("#locdialog").classList.add("display");
      document.querySelector("#locdialog-content h2").innerText = "Chat Update!";
      document.querySelector("#locdialog-content p").innerText = "You have a chat update!";
    });

    let presigned = sessionStorage.getItem("chat-url");
    if (presigned !== null) {
      try {
        await fetch(presigned).then(res => res.json()).then((chatData) => {
          chatData["chatStore"] = new URL(presigned).pathname.replace("/chats/", "");
          console.log(chatData["chatStore"]);
          renderChat(chatData);
        });
      }
      catch (e) {

      }
    }

    let listData = new FormData();
    listData.set("jwt", localStorage.getItem("session"));

    fetch(`${API_ENDPOINT}/chat/list`, {
      method: "post",
      body: listData,
    }).then(res => res.json()).then((chats) => {
      renderChats(chats.data);
    });
  }
}

function renderChats(chats) {
  let chatsHtml = ``;
  
  for (let chat of chats) {
    let itemCatWithId = chat["itemCatWithId-lastUpdate"].split("-");
    itemCatWithId.splice(3, 1);
    itemCatWithId = itemCatWithId.join("-");

    console.log(chat.chatStore);
    console.log(currentChat);
    if (chat.chatStore == currentChat) {
      currentChatItemCatWithId = itemCatWithId;
    }

    console.log(chat["itemCatWithId-lastUpdate"].split("-")[3]);
    chatsHtml += SaferHTML`<div class="chat-summary" onclick="openChat('${chat.chatStore}', '${itemCatWithId}');">
  <h3>${chat.itemName}</h3>
  <h4>${chat.other}</h4>
  <div>${chat.lastMsg}</div>
  <h5>${new Date(parseInt(chat["itemCatWithId-lastUpdate"].split("-")[3])).toLocaleString()}</h5>
</div>`;
  }

  document.querySelector("#left-pane").innerHTML = chatsHtml;
}

function renderChat(chatData) {
  currentChat = chatData.chatStore;

  document.querySelector("#content-inside h3").innerText = chatData.itemName;
  document.querySelector("#content-inside h4").innerText = (chatData.buyer == user.user) ? chatData.seller : chatData.buyer;

  let chatHtml = ``;

  chatHtml += `<div class="left">
  <a href="javascript:geoFindMe();">Turn on Proximity Tracking</a>
  <a href="javascript:sendComplete();">Complete Sale</a>
</div>`;

  for (let msg of chatData.chat) {
    if (msg.from === user.user) {
      chatHtml += SaferHTML`<div class="right"><div class="bubble">${msg.text}</div></div>`;
    }
    else {
      chatHtml += SaferHTML`<div class="left">
  <div class="bubble">
    <div class="profile">
      <span>${msg.from[0]}</span>
    </div>
    ${msg.text}
  </div>
</div>`;
    }
  }

  document.querySelector("#chat").innerHTML = chatHtml;
}

function geoFindMe() {
  function success(position) {
    const latitude  = position.coords.latitude;
    const longitude = position.coords.longitude;

    console.log(latitude);
    console.log(longitude);

    document.querySelector("#locdialog").classList.add("display");
    document.querySelector("#locdialog-content h2").innerText = "Waiting for other user...";
    document.querySelector("#locdialog-content p").innerText = "The other user should be here any minute... They will be reminded to turn on location-tracking too.";
  }

  function error() {
    // status.textContent = 'Unable to retrieve your location';
  }

  if(!navigator.geolocation) {
    // status.textContent = 'Geolocation is not supported by your browser';
  } else {
    // status.textContent = 'Locating…';
    navigator.geolocation.getCurrentPosition(success, error);
  }
}

initChatPage();