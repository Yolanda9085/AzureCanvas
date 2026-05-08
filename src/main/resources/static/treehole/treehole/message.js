/**
 * message.js — Private Message Module
 * Chat page, quick replies, emoji sending
 * Reference Douyin chat interface: own messages on the right, other's messages on the left
 * Exposed via window.MessageModule
 * Dependencies: store.js (Store), render.js (Render)
 */
window.MessageModule = (function () {

  // Current chat target
  let chatTarget = null; // { id, nickname, avatarLetter }

  // Quick reply presets (daily expressions)
  const QUICK_REPLIES = [
    "OK👍", "Got it!", "Hahaha", "Are you there?",
    "Thank you", "Thanks for your hard work", "Go for it!", "Reply you later"
  ];

  // Custom quick replies (read from localStorage)
  let customReplies = [];

  // Emoji sticker list (text emojis)
  const EMOJI_STICKERS = [
    "😂", "🥺", "😭", "🤣", "😍", "🙃", "😤", "🥳",
    "👀", "💀", "🫡", "🤡", "😴", "🤯", "🫶", "✌️",
    "🐶", "🐱", "🐸", "🦆", "🐼", "🦊", "🐧", "🦁"
  ];

  // Auto reply settings
  let autoReplyEnabled = false;
  let autoReplyText = "Hi! I'm not available right now, will reply to you later 😊";

  function init() {
    // Load custom quick replies
    try { customReplies = JSON.parse(localStorage.getItem("th_custom_replies")) || []; }
    catch (e) { customReplies = []; }
    try {
      const ar = JSON.parse(localStorage.getItem("th_auto_reply") || "{}");
      autoReplyEnabled = ar.enabled || false;
      autoReplyText = ar.text || autoReplyText;
    } catch(e) {}

    // Send button
    document.getElementById("msgSendBtn").addEventListener("click", sendMsg);

    // Input enter key to send
    document.getElementById("msgInput").addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); }
    });

    // Quick reply panel toggle
    document.getElementById("msgQuickBtn").addEventListener("click", e => {
      e.stopPropagation();
      document.getElementById("quickReplyPanel").classList.toggle("open");
      document.getElementById("msgEmojiPanel").classList.remove("open");
    });

    // Emoji panel toggle
    document.getElementById("msgEmojiBtn").addEventListener("click", e => {
      e.stopPropagation();
      document.getElementById("msgEmojiPanel").classList.toggle("open");
      document.getElementById("quickReplyPanel").classList.remove("open");
    });

    // Back button
    document.getElementById("msgBackBtn").addEventListener("click", () => {
      document.dispatchEvent(new CustomEvent("th:closeMessage"));
    });

    // Render emoji panel
    renderEmojiPanel();
  }

  /**
   * Open a private chat with a user
   * @param {string} userId
   * @param {string} nickname
   * @param {string} avatarLetter
   */
  function openChat(userId, nickname, avatarLetter) {
    chatTarget = { id: userId, nickname, avatarLetter };
    document.getElementById("msgTargetName").textContent = nickname;
    document.getElementById("msgTargetAvatar").textContent = avatarLetter || "Anon";
    renderChat();
    renderQuickReplies();
    // Show message view
    document.getElementById("messageView").classList.add("active");
    document.getElementById("homeView").classList.add("hidden");
    document.getElementById("detailView").classList.remove("active");
  }

  /** Send message */
  function sendMsg(text, type) {
    if (!chatTarget) return;
    const input = document.getElementById("msgInput");
    const msgText = text || input.value.trim();
    if (!msgText) return;
    Store.sendMessage(chatTarget.id, chatTarget.nickname, chatTarget.avatarLetter, msgText, type || "text");
    if (!text) input.value = "";
    renderChat();
    document.getElementById("quickReplyPanel").classList.remove("open");
    document.getElementById("msgEmojiPanel").classList.remove("open");
    // Auto reply
    if (autoReplyEnabled && autoReplyText) {
      setTimeout(() => {
        Store.sendMessage(chatTarget.id, chatTarget.nickname, chatTarget.avatarLetter, "[Auto Reply] " + autoReplyText, "text");
        renderChat();
      }, 800);
    }
  }

  /** Render chat bubbles */
  function renderChat() {
    if (!chatTarget) return;
    const thread = Store.getThread(chatTarget.id);
    const msgs = thread ? thread.messages : [];
    const listEl = document.getElementById("msgList");
    const myId = Store.currentUser.id;

    if (msgs.length === 0) {
      listEl.innerHTML = `<div class="msg-empty">Send the first message 👋</div>`;
    } else {
      listEl.innerHTML = msgs.map(m => {
        const isMine = m.from === myId;
        const bubbleClass = isMine ? "bubble-mine" : "bubble-theirs";
        const avatarText = isMine
          ? Render.escapeHtml(Store.currentUser.avatarLetter || "Me")
          : Render.escapeHtml(chatTarget.avatarLetter || "Anon");
        const timeStr = Render.formatTime(m.timestamp);
        return `
          <div class="msg-row ${isMine ? "msg-row-mine" : "msg-row-theirs"}">
            ${!isMine ? `<div class="msg-avatar">${avatarText}</div>` : ""}
            <div class="msg-bubble-wrap">
              <div class="msg-bubble ${bubbleClass}">${Render.escapeHtml(m.text)}</div>
              <div class="msg-time">${timeStr}</div>
            </div>
            ${isMine ? `<div class="msg-avatar">${avatarText}</div>` : ""}
          </div>`;
      }).join("");
    }

    // Scroll to bottom
    listEl.scrollTop = listEl.scrollHeight;
  }

  /** Render quick reply panel */
  function renderQuickReplies() {
    const panel = document.getElementById("quickReplyPanel");
    const allReplies = [...QUICK_REPLIES, ...customReplies];
    panel.innerHTML = `
      <div class="quick-reply-title">Quick Replies</div>
      <div class="quick-reply-list">
        ${allReplies.map(r => `<button class="quick-reply-item">${Render.escapeHtml(r)}</button>`).join("")}
      </div>
      <div class="quick-reply-add">
        <input type="text" id="customReplyInput" placeholder="Add custom quick reply…" maxlength="20">
        <button class="btn btn-sm" id="addCustomReplyBtn">Add</button>
      </div>
      <div class="auto-reply-bar">
        <span class="auto-reply-label">Auto Reply</span>
        <label class="toggle-switch">
          <input type="checkbox" id="autoReplyToggle" ${autoReplyEnabled ? "checked" : ""}>
          <span class="toggle-slider"></span>
        </label>
        <input class="auto-reply-input" id="autoReplyInput" type="text" value="${Render.escapeHtml(autoReplyText)}" placeholder="Auto reply content…" maxlength="40">
      </div>
    `;
    document.getElementById("addCustomReplyBtn").addEventListener("click", () => {
      const input = document.getElementById("customReplyInput");
      const text = input.value.trim();
      if (!text) return;
      customReplies.push(text);
      localStorage.setItem("th_custom_replies", JSON.stringify(customReplies));
      input.value = "";
      renderQuickReplies();
    });
    panel.querySelectorAll(".quick-reply-item").forEach(btn => {
      btn.addEventListener("click", () => sendMsg(btn.textContent, "text"));
    });
    document.getElementById("autoReplyToggle").addEventListener("change", e => {
      autoReplyEnabled = e.target.checked;
      localStorage.setItem("th_auto_reply", JSON.stringify({ enabled: autoReplyEnabled, text: autoReplyText }));
    });
    document.getElementById("autoReplyInput").addEventListener("input", e => {
      autoReplyText = e.target.value;
      localStorage.setItem("th_auto_reply", JSON.stringify({ enabled: autoReplyEnabled, text: autoReplyText }));
    });
  }

  /** Render emoji panel */
  function renderEmojiPanel() {
    const panel = document.getElementById("msgEmojiPanel");
    panel.innerHTML = `
      <div class="quick-reply-title">Emoji Stickers</div>
      <div class="emoji-sticker-grid">
        ${EMOJI_STICKERS.map(e => `<span class="emoji-sticker">${e}</span>`).join("")}
      </div>
    `;
    panel.querySelectorAll(".emoji-sticker").forEach(s => {
      s.addEventListener("click", () => sendMsg(s.textContent, "emoji"));
    });
  }

  return { init, openChat, renderChat };
})();
