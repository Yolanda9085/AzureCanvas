/**
 * render.js — Rendering Layer
 * Responsible for rendering data as HTML, exposed via window.Render
 * Dependencies: store.js (Store)
 */
window.Render = (function () {

  // ===== Utility Functions =====

  /** Relative time formatting */
  function formatTime(ts) {
    const diff = Date.now() - ts;
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return Math.floor(diff / 60000) + "m ago";
    if (diff < 86400000) return Math.floor(diff / 3600000) + "h ago";
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }

  /** HTML escaping to prevent XSS */
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /** Render user avatar: use image if avatarUrl exists, otherwise pink-purple gradient + first letter */
  function renderAvatar(avatarUrl, avatarLetter, extraClass, userId) {
    const letter = avatarLetter || "Anon";
    const cls = extraClass ? " " + extraClass : "";
    const userIdAttr = userId ? ` data-user-id="${userId}"` : "";
    const escapedLetter = escapeHtml(letter);
    
    // Unified avatar placeholder logic: use single-quote attributes to prevent HTML parsing crashes when injecting via onerror
    const fallbackHtml = `<div class='avatar avatar-gradient${cls}'${userIdAttr.replace(/"/g, "'")}>${escapedLetter}</div>`;

    if (avatarUrl) {
      // Ensure URL is complete
      let fullUrl = avatarUrl;
      if (!avatarUrl.startsWith('http') && !avatarUrl.startsWith('/')) {
        fullUrl = '/resources/' + avatarUrl;
      }
      // Use double quotes for attributes, internally use escaped single-quote fallbackHtml
      return `<img src="${fullUrl}" alt="" class="avatar-img${cls}"${userIdAttr} onerror="this.onerror=null; this.outerHTML='${fallbackHtml.replace(/'/g, "\\'")}'">`;
    }
    return fallbackHtml;
  }

  /** Highlight keywords */
  function highlightKeyword(text, keyword) {
    if (!keyword || !text) return escapeHtml(text);
    // Check if text already contains backend-highlighted tags
    if (text.includes('<em>')) {
      return text; // Already contains highlight tags, return as is
    }
    // Check if text already contains frontend highlight tags
    if (text.includes('<span class="text-red-500 font-bold">')) {
      return text; // Already contains highlight tags, return as is
    }
    // Split keywords into individual characters and highlight each
    var chars = keyword.split('');
    var result = escapeHtml(text);
    chars.forEach(function (char) {
      if (char.trim()) {
        var regex = new RegExp('(' + escapeHtml(char) + ')', 'gi');
        result = result.replace(regex, '<span class="text-red-500 font-bold">$1</span>');
      }
    });
    return result;
  }

  // ===== Post Feed Rendering =====

  /**
   * Render homepage post feed
   * @param {HTMLElement} container - Post container
   * @param {HTMLElement} emptyEl - Empty state prompt element
   * @param {Array} posts - Post array
   * @param {Function} onCardClick - Click card callback (postId)
   */
  function renderFeed(container, emptyEl, posts, onCardClick) {
    if (!posts || posts.length === 0) {
      container.innerHTML = "";
      if (emptyEl) emptyEl.style.display = "block";
      return;
    }
    if (emptyEl) emptyEl.style.display = "none";

    container.innerHTML = posts.map(post => {
      const imgHtml = post.imagesList && post.imagesList.length
          ? `<div class="post-images">${post.imagesList.map(u => `<img src="${u}" alt="">`).join("")}</div>`
          : "";
      const commentCount = post.comments ? post.comments.length : 0;
      const isMe = post.authorId === Store.currentUser.id;
      const following = Store.isFollowing(post.authorId);
      const followBtn = isMe ? "" : `
        <button class="follow-btn-card ${following ? "following" : ""}" data-author-id="${post.authorId}"
          data-author="${escapeHtml(post.author)}" data-avatar="${escapeHtml(post.avatarLetter || "Anon")}">
          ${following ? '<i class="fas fa-check"></i> Following' : '<i class="fas fa-plus"></i> Follow'}
        </button>`;
      const userPosts = Store.posts.filter(p => p.authorId === post.authorId).length;
      return `
        <div class="post-card animated" data-id="${post.id}">
          <div class="post-header">
            <div class="avatar-popover-wrap">
              ${renderAvatar(post.avatarUrl, post.avatarLetter, "", post.authorId)}
              <div class="author-popover">
                ${renderAvatar(post.avatarUrl, post.avatarLetter, "ap-avatar", post.authorId)}
                <div class="ap-name">${escapeHtml(post.author)}</div>
                <div class="ap-meta">${userPosts} posts</div>
                ${!isMe ? `<button class="ap-follow-btn ${following ? "following" : ""}" data-author-id="${post.authorId}">
                  ${following ? "Following" : "+ Follow"}
                </button>` : ""}
              </div>
            </div>
            <div class="post-meta" style="flex:1">
              <span class="post-author">${escapeHtml(post.author)}</span>
              <span class="post-time">${formatTime(post.timestamp)}</span>
            </div>
            ${followBtn}
          </div>
          <div class="post-body">${highlightKeyword(post.content, window._curQuery)}</div>
          ${imgHtml}
          <div class="post-actions" onclick="event.stopPropagation()">
            <button class="action-btn ${post.liked ? "liked" : ""}" data-action="like" data-id="${post.id}">
              <i class="${post.liked ? "fas" : "far"} fa-heart"></i> ${post.likes || 0}
            </button>
            <button class="action-btn" data-action="comment" data-id="${post.id}">
              <i class="far fa-comment"></i> ${commentCount}
            </button>
            <button class="action-btn ${post.collected ? "collected" : ""}" data-action="collect" data-id="${post.id}">
              <i class="${post.collected ? "fas" : "far"} fa-bookmark"></i> ${post.collected ? "Collected" : "Collect"}
            </button>
          </div>
        </div>`;
    }).join("");

    container.querySelectorAll(".post-card").forEach(card => {
      card.addEventListener("click", () => onCardClick(card.dataset.id));
    });

    container.querySelectorAll("[data-action]").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const { action, id } = btn.dataset;
        if (action === "like") { Store.toggleLike(id); renderFeed(container, emptyEl, Store.getFilteredPosts(window._curCategory, window._curQuery), onCardClick); }
        else if (action === "collect") { Store.toggleCollect(id); renderFeed(container, emptyEl, Store.getFilteredPosts(window._curCategory, window._curQuery), onCardClick); }
        else if (action === "comment") onCardClick(id);
      });
    });

    // Follow button & popover handled by main.js bindFollowBtns
    if (window.bindFollowBtns) window.bindFollowBtns(container);
  }

  // ===== Detail Page Rendering =====

  /**
   * Render post detail (post body section)
   * @param {HTMLElement} bodyEl - Post body container
   * @param {HTMLElement} actionsEl - Action bar container
   * @param {Object} post - Post object
   * @param {Function} onFollowClick - Follow/message button callback
   */
  function renderDetailPost(bodyEl, actionsEl, post, onFollowClick) {
    const images = post.imagesList || post.images || [];
    const imgHtml = images.length
        ? `<div class="post-images">${images.map(u => `<img src="${u}" alt="">`).join("")}</div>`
        : "";

    const isMe = post.authorId === Store.currentUser.id;
    const following = Store.isFollowing(post.authorId);

    // Follow/message buttons (not shown on own posts)
    const followBtn = isMe ? "" : following
        ? `<button class="btn btn-sm" id="detailMsgBtn" data-author-id="${post.authorId}" data-author="${escapeHtml(post.author)}" data-avatar="${escapeHtml(post.avatarLetter || "Anon")}">
           <i class="far fa-comment-dots"></i> Message
         </button>`
        : `<button class="btn btn-sm" id="detailFollowBtn" data-author-id="${post.authorId}">
           <i class="fas fa-plus"></i> Follow
         </button>`;

    bodyEl.innerHTML = `
      <div class="post-header">
        <div id="detailAvatar" data-user-id="${post.authorId}" style="cursor:pointer" title="Click to go to profile page">
          ${renderAvatar(post.avatarUrl, post.avatarLetter, "detail-avatar", post.authorId)}
        </div>
        <div class="post-meta" style="flex:1">
          <span class="post-author">${escapeHtml(post.author)}</span>
          <span class="post-time">${formatTime(post.timestamp)}</span>
        </div>
        ${followBtn}
      </div>
      <div class="post-body" style="font-size:1rem; margin:14px 0;">${highlightKeyword(post.content, window._curQuery)}</div>
      ${imgHtml}
    `;

    actionsEl.innerHTML = `
      <button class="action-btn ${post.liked ? "liked" : ""}" id="detailLikeBtn">
        <i class="${post.liked ? "fas" : "far"} fa-heart"></i> ${post.likes || 0} Likes
      </button>
      <button class="action-btn ${post.collected ? "collected" : ""}" id="detailCollectBtn">
        <i class="${post.collected ? "fas" : "far"} fa-bookmark"></i> ${post.collected ? "Collected" : "Collect"}
      </button>
    `;

    // Bind like/collect
    document.getElementById("detailLikeBtn").addEventListener("click", () => {
      Store.toggleLike(post.id);
      renderDetailPost(bodyEl, actionsEl, Store.getPost(post.id), onFollowClick);
    });
    document.getElementById("detailCollectBtn").addEventListener("click", () => {
      Store.toggleCollect(post.id);
      renderDetailPost(bodyEl, actionsEl, Store.getPost(post.id), onFollowClick);
    });

    // Bind follow button
    const followBtnEl = document.getElementById("detailFollowBtn");
    if (followBtnEl) {
      followBtnEl.addEventListener("click", () => {
        Store.toggleFollow(post.authorId);
        renderDetailPost(bodyEl, actionsEl, Store.getPost(post.id), onFollowClick);
        updateNotifBadges();
      });
    }

    // Bind message button
    const msgBtnEl = document.getElementById("detailMsgBtn");
    if (msgBtnEl) {
      msgBtnEl.addEventListener("click", () => {
        onFollowClick(msgBtnEl.dataset.authorId, msgBtnEl.dataset.author, msgBtnEl.dataset.avatar);
      });
    }

    // Click avatar to navigate to profile page
    const avatarEl = document.getElementById("detailAvatar");
    if (avatarEl) {
      avatarEl.style.cursor = 'pointer';
      // Remove old event listener and add new one
      const newAvatarEl = avatarEl.cloneNode(true);
      avatarEl.parentNode.replaceChild(newAvatarEl, avatarEl);
      
      newAvatarEl.addEventListener("click", (e) => {
        e.stopPropagation();
        const clickedUserId = newAvatarEl.dataset.userId;
        const currentUserId = Store.currentUser && (Store.currentUser.uuid || Store.currentUser.id || Store.currentUser.userId);
        
        if (clickedUserId === String(currentUserId)) {
          window.location.href = '../azure_trade/profile.html';
        } else {
          window.location.href = '../azure_trade/seller-profile.html?id=' + encodeURIComponent(clickedUserId);
        }
      });
    }
  }

  // ===== Comment Rendering =====

  function countComments(comments) {
    if (!comments || comments.length === 0) return 0;
    let count = 0;
    for (const c of comments) {
      count++;
      if (c.children && c.children.length) count += countComments(c.children);
    }
    return count;
  }

  function renderCommentNode(c, depth, onReply) {
    const replyTag = c.parentId
        ? `<span class="reply-tag">Reply to #${c.parentId}</span> `
        : "";
    const authorName = c.authorName || c.author || "Anonymous User";
    
    // Process avatar: if avatar (UUID) exists, convert to /resources/{uuid}
    let avatarUrl = c.avatarUrl || null;
    if (c.avatar && !avatarUrl) {
      avatarUrl = '/resources/' + c.avatar;
    }
    
    const avatarLetter = c.avatarLetter || (authorName ? authorName.substring(0, 1) : "Anon");
    // Get commenter user UUID (supports multiple field names)
    const userId = c.authorId || c.userId || c.userUuid || null;
    const time = c.createdAt
        ? formatTime(new Date(c.createdAt).getTime())
        : formatTime(c.timestamp || Date.now());
    const text = c.content || c.text || "";
    const children = c.children && c.children.length > 0
        ? `<div class="comment-children">${c.children.map(child => renderCommentNode(child, depth + 1, onReply)).join("")}</div>`
        : "";
    return `
      <div class="comment-item" data-cmt-id="${c.id}" style="margin-left: ${depth * 16}px">
        <div class="comment-header">
          ${renderAvatar(avatarUrl, avatarLetter, "comment-avatar", userId)}
          <span class="comment-author">${escapeHtml(authorName)}</span>
          <span class="comment-time">${time}</span>
          <button class="reply-btn" data-cmt-id="${c.id}">Reply</button>
        </div>
        <div class="comment-text">${replyTag}${escapeHtml(text)}</div>
        ${children}
      </div>`;
  }

  /**
   * Render comment list (supports multi-level nesting)
   * @param {HTMLElement} listEl - Comment list container
   * @param {HTMLElement} countEl - Comment count title element
   * @param {Object} post - Post object
   * @param {Function} onReply - Reply callback (comment)
   */
  function renderComments(listEl, countEl, post, onReply) {
    const totalCount = countComments(post.comments);
    if (countEl) countEl.textContent = `Comments (${totalCount})`;
    if (!post.comments || post.comments.length === 0) {
      listEl.innerHTML = `<div class="empty-tip" style="padding:16px 0;">No comments yet, be the first</div>`;
      return;
    }
    listEl.innerHTML = post.comments.map(c => renderCommentNode(c, 0, onReply)).join("");

    // Bind reply button events
    listEl.querySelectorAll(".reply-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const findComment = (list, id) => {
          for (const c of list) {
            if (String(c.id) === String(id)) return c;
            if (c.children && c.children.length) {
              const found = findComment(c.children, id);
              if (found) return found;
            }
          }
          return null;
        };
        const cmt = findComment(post.comments, btn.dataset.cmtId);
        if (cmt && onReply) onReply(cmt);
      });
    });

    // Bind comment avatar click events (for navigation)
    bindCommentAvatarClickEvents(listEl);
  }

  /**
   * Bind click events on comment avatars
   * Click other's avatar → navigate to seller-profile.html?id=user_uuid
   * Click own avatar → navigate to profile.html
   */
  function bindCommentAvatarClickEvents(container) {
    // Find all comment avatar elements (including div.avatar and img.avatar-img)
    const avatarDivs = container.querySelectorAll('div.comment-avatar[data-user-id]');
    const avatarImgs = container.querySelectorAll('img.comment-avatar[data-user-id]');
    const allAvatars = [...avatarDivs, ...avatarImgs];

    if (allAvatars.length === 0) {
      console.log('[DEBUG] No comment avatar elements found, skipping event binding');
      return;
    }

    console.log(`[DEBUG] Found ${allAvatars.length} comment avatars, starting to bind click events`);

    allAvatars.forEach(avatar => {
      // Add cursor style
      avatar.style.cursor = 'pointer';

      // Remove old event listeners (via node cloning)
      const newAvatar = avatar.cloneNode(true);
      avatar.parentNode.replaceChild(newAvatar, avatar);

      // Add new click event
      newAvatar.addEventListener('click', function(e) {
        e.stopPropagation();

        const clickedUserId = this.dataset.userId;

        if (!clickedUserId) {
          console.warn('[DEBUG] Avatar missing data-user-id attribute');
          return;
        }

        // Unified current user UUID retrieval
        const currentUserId = Store.currentUser && (Store.currentUser.uuid || Store.currentUser.id || Store.currentUser.userId);
        console.log(`[DEBUG] Clicked avatar, user ID: ${clickedUserId}, current user ID: ${currentUserId}`);

        // Check if it's own avatar
        if (clickedUserId === String(currentUserId)) {
          console.log('[DEBUG] Clicked own avatar, navigating to profile.html');
          window.location.href = '../azure_trade/profile.html';
        } else {
          console.log(`[DEBUG] Clicked other avatar, navigating to seller-profile.html?id=${clickedUserId}`);
          window.location.href = '../azure_trade/seller-profile.html?id=' + encodeURIComponent(clickedUserId);
        }
      });
    });

    console.log('[DEBUG] Comment avatar click event binding completed');
  }

  // ===== Notification Badge Updates =====

  function setBadge(el, count) {
    if (!el) return;
    if (count <= 0) { el.style.display = "none"; return; }
    el.style.display = "inline-block";
    el.textContent = count > 99 ? "…" : count;
  }

  /** Update left sidebar notification badge numbers */
  function updateNotifBadges() {
    const replyCount = Store.unreadCount("reply");
    setBadge(document.getElementById("replyBadge"), replyCount);

    // Messages: number of conversations where the other party last spoke
    const myId = Store.currentUser.id;
    const msgCount = Object.values(Store.messages).filter(t => {
      const msgs = t.messages;
      return msgs.length > 0 && msgs[msgs.length - 1].from !== myId;
    }).length;
    setBadge(document.getElementById("msgBadge"), msgCount);

    // Collections: number of collected posts
    const collectCount = Store.getCollectedPosts().length;
    setBadge(document.getElementById("collectBadge"), collectCount);
  }

  // ===== Public API =====
  return { formatTime, escapeHtml, renderAvatar, renderFeed, renderDetailPost, renderComments, updateNotifBadges, bindCommentAvatarClickEvents };
})();
