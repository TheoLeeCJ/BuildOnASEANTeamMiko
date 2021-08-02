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

    let presigned = sessionStorage.getItem("chat-url");
    if (presigned !== null) {
      let chatData = await fetch(presigned).then(res => res.json());
      renderChat(chatData);
    }
  
    // let startChatData = new FormData();
  
    // // POST to start chat API
    // let chatData = await fetch(`${API_ENDPOINT}/chat/begin`, {
    //   method: "post",
    //   body: startChatData,
    // }).then(res => res.json());
  }
}

function renderChat(chatData) {
  document.querySelector("#content-inside h3").innerText = chatData.itemName;
  document.querySelector("#content-inside h4").innerText = (chatData.buyer == user.user) ? chatData.seller : chatData.buyer;

  let chatHtml = ``;
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

initChatPage();