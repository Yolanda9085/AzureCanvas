document.addEventListener("DOMContentLoaded", () => {
  // ===== 0. Loading Screen =====
  const loadingScreen = document.getElementById("loadingScreen");
  const welcomeModal = document.getElementById("welcomeModal");
  const isFirstVisit = !localStorage.getItem("th_visited");
  const loadingBar = document.getElementById("loadingBar");
  const loadingStatus = document.getElementById("loadingStatus");
  const loadingWelcome = document.getElementById("loadingWelcome");

  // Start particle background
  startLoadingParticles();

  // Simulate loading progress
  const steps = [
    { pct: 20, text: "Initializing data…" },
    { pct: 50, text: "Loading posts…" },
    { pct: 75, text: "Rendering interface…" },
    { pct: 95, text: "Almost done…" },
  ];
  let stepIdx = 0;
  const stepTimer = setInterval(() => {
    if (stepIdx < steps.length) {
      loadingBar.style.width = steps[stepIdx].pct + "%";
      loadingStatus.textContent = steps[stepIdx].text;
      stepIdx++;
    } else {
      clearInterval(stepTimer);
    }
  }, 320);

  function finishLoading() {
    clearInterval(stepTimer);
    loadingBar.style.width = "100%";
    loadingStatus.style.opacity = "0";
    loadingWelcome.classList.add("show");
    setTimeout(() => {
      if (window._stopLoadingParticles) window._stopLoadingParticles();
      loadingScreen.classList.add("fade-out");
      setTimeout(() => {
        loadingScreen.style.display = "none";
        if (isFirstVisit) {
          localStorage.setItem("th_visited", "1");
          welcomeModal.classList.add("open");
        }
      }, 700);
    }, 900);
  }

  // Minimum display 1.6s, then wait for page ready
  setTimeout(finishLoading, 1600);

  function startLoadingParticles() {
    const canvas = document.getElementById("loadingCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    window.addEventListener("resize", () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    });

    const STAR_COUNT = 260;
    const stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      z: Math.random() * W, pz: 0
    }));
    stars.forEach(s => s.pz = s.z);

    const meteors = [];
    const meteorTimer = setInterval(() => {
      meteors.push({
        x: Math.random() * W, y: Math.random() * H * 0.5,
        vx: 5 + Math.random() * 5, vy: 2 + Math.random() * 3,
        len: 80 + Math.random() * 100, life: 1
      });
    }, 1000);

    let running = true;
    let frame = 0;
    function draw() {
      if (!running) return;
      ctx.fillStyle = "rgba(13,17,23,0.2)";
      ctx.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2, speed = 5;

      stars.forEach(s => {
        s.pz = s.z; s.z -= speed;
        if (s.z <= 0) { s.x = Math.random() * W; s.y = Math.random() * H; s.z = W; s.pz = W; }
        const sx = (s.x - cx) * (W / s.z) + cx;
        const sy = (s.y - cy) * (W / s.z) + cy;
        const px = (s.x - cx) * (W / s.pz) + cx;
        const py = (s.y - cy) * (W / s.pz) + cy;
        const bright = 1 - s.z / W;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(sx, sy);
        ctx.strokeStyle = `rgba(${180 + Math.floor(bright*75)},${200 + Math.floor(bright*55)},255,${bright})`;
        ctx.lineWidth = Math.max(0.3, bright * 2); ctx.stroke();
      });

      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.x += m.vx; m.y += m.vy; m.life -= 0.02;
        if (m.life <= 0 || m.x > W + 200) { meteors.splice(i, 1); continue; }
        const grad = ctx.createLinearGradient(m.x - m.vx * 10, m.y - m.vy * 10, m.x, m.y);
        grad.addColorStop(0, "rgba(255,255,255,0)");
        grad.addColorStop(1, `rgba(168,216,255,${m.life * 0.85})`);
        ctx.beginPath(); ctx.moveTo(m.x - m.vx * 10, m.y - m.vy * 10); ctx.lineTo(m.x, m.y);
        ctx.strokeStyle = grad; ctx.lineWidth = 1.5; ctx.stroke();
      }

      if (frame % 3 === 0) {
        const gx = cx + Math.sin(frame * 0.007) * 100;
        const gy = cy + Math.cos(frame * 0.005) * 70;
        const nebula = ctx.createRadialGradient(gx, gy, 0, gx, gy, 240);
        nebula.addColorStop(0, "rgba(80,60,160,0.05)");
        nebula.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = nebula; ctx.fillRect(0, 0, W, H);
      }
      frame++;
      requestAnimationFrame(draw);
    }
    draw();

    window._stopLoadingParticles = () => {
      running = false;
      clearInterval(meteorTimer);
    };
  }

  document.getElementById("welcomeCloseBtn").addEventListener("click", () => {
    welcomeModal.classList.remove("open");
  });

  // ===== 1. Initialize Data Layer =====
  Store.init();

  // ===== 2. Initialize Feature Modules =====
  UserModule.init();
  MessageModule.init();

  // ===== 3. Cache DOM =====
  const homeView = document.getElementById("homeView");
  const detailView = document.getElementById("detailView");
  const messageView = document.getElementById("messageView");
  const feedContainer = document.getElementById("postsFeedContainer");
  const emptyFeedMsg = document.getElementById("emptyFeedMsg");
  const searchResultsBar = document.getElementById("searchResultsBar");
  const detailPostBody = document.getElementById("detailPostBody");
  const detailActions = document.getElementById("detailActions");
  const commentsList = document.getElementById("commentsList");
  const commentCountEl = document.getElementById("commentCount");
  const commentInput = document.getElementById("commentInput");
  const submitCommentBtn = document.getElementById("submitCommentBtn");

  // ===== 4. Global State =====
  window._curCategory = "all";
  window._curQuery = "";
  let currentPostId = null;
  let replyingTo = null;

  // ===== 5. View Routing =====

  async function showHome() {
    homeView.classList.remove("hidden");
    detailView.classList.remove("active");
    messageView.classList.remove("active");
    await refreshFeed();
    Render.updateNotifBadges();
  }

  async function showDetail(postId) {
    currentPostId = postId;
    const post = await Store.fetchPostFromApi(postId);
    if (!post) return;
    homeView.classList.add("hidden");
    detailView.classList.add("active");
    messageView.classList.remove("active");
    Render.renderDetailPost(detailPostBody, detailActions, post, openMessage);

    // Get commenter user info (replace "Anonymous User" with real username)
    if (post.comments && post.comments.length > 0) {
      post.comments = await Store.enrichCommentsWithUserInfo(post.comments);
    }

    Render.renderComments(commentsList, commentCountEl, post, onReply);
    replyingTo = null;
    updateReplyHint();
  }

  function openMessage(userId, nickname, avatarLetter) {
    MessageModule.openChat(userId, nickname, avatarLetter);
    homeView.classList.add("hidden");
    detailView.classList.remove("active");
    messageView.classList.add("active");
  }

  // ===== Hot Search List =====
  // Static trending topics pinned at top, then dynamic post-based rankings below
  const STATIC_HOT_TOPICS = [
    { text: "ByteDance internship offer tips", tag: "🔥 Hot" },
    { text: "Graduation anxiety — am I alone?", tag: "🔥 Hot" },
    { text: "Group project teammates ghosting", tag: "📈 Rising" },
    { text: "Best midnight snacks near Gate 2", tag: "📈 Rising" },
    { text: "Library seat reservation guide", tag: "📌 Pinned" },
    { text: "Spring Concert tickets available", tag: "" },
    { text: "Three-Body Problem book discussion", tag: "" },
    { text: "Campus bike theft — stay alert", tag: "⚠️ Alert" },
    { text: "National Scholarship deadline May 20", tag: "📌 Pinned" },
    { text: "Cherry blossoms by east lake 🌸", tag: "" },
    { text: "IEEE embedded systems lecture", tag: "" },
    { text: "Dance Alliance open class signup", tag: "📈 Rising" },
  ];

  function renderHotSearch() {
    const el = document.getElementById("hotSearchList");
    if (!el) return;

    // Dynamic: rank posts by engagement
    const allPosts = Store.getFilteredPosts("all", "");
    const dynRanked = [...allPosts]
      .map(p => ({
        id: p.id,
        text: p.content.slice(0, 28),
        heat: (p.likes || 0) * 3 + (p.comments ? p.comments.length : 0) * 5
      }))
      .sort((a, b) => b.heat - a.heat)
      .slice(0, 5);

    // Merge: static topics first (no id = no click-to-detail), then dynamic
    const merged = [
      ...STATIC_HOT_TOPICS.slice(0, 7).map(t => ({ text: t.text, tag: t.tag, id: null })),
      ...dynRanked.map((p, i) => ({ text: p.text, tag: i === 0 ? "🔥 Hot" : "", id: p.id, heat: p.heat }))
    ].slice(0, 12);

    el.innerHTML = merged.map((item, i) => `
      <div class="hot-item" ${item.id ? `data-id="${item.id}"` : ""} style="${item.id ? "cursor:pointer" : "cursor:default"}">
        <span class="hot-rank ${i === 0 ? "top1" : i === 1 ? "top2" : i === 2 ? "top3" : ""}">${i + 1}</span>
        <span class="hot-text">${Render.escapeHtml(item.text)}</span>
        <span class="hot-heat" style="font-size:0.7rem;white-space:nowrap">${item.tag || (item.heat ? item.heat : "")}</span>
      </div>`).join("");

    el.querySelectorAll(".hot-item[data-id]").forEach(item => {
      item.addEventListener("click", () => showDetail(item.dataset.id));
    });
  }

  // ===== 6. Feed Refresh (Real Posts Only, No Auto Polling) =====

  async function refreshFeed() {
    let posts;

    if (window._curQuery) {
      // Show loading state
      feedContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;"><i class="fas fa-spinner fa-spin"></i> Searching...</div>';
      if (emptyFeedMsg) emptyFeedMsg.style.display = "none";

      // Use ES API to search
      posts = await Store.searchPostsWithES(window._curQuery, window._curCategory);

      searchResultsBar.textContent = `Search "${window._curQuery}", found ${posts.length} results`;
      searchResultsBar.classList.add("visible");
    } else {
      // Get posts from API
      await Store.fetchPostsFromApi();
      posts = Store.getFilteredPosts(window._curCategory, window._curQuery);
      searchResultsBar.classList.remove("visible");
    }

    Render.renderFeed(feedContainer, emptyFeedMsg, posts, showDetail);
    animateNewCards();
    renderHotSearch();
  }

  // ===== 7. Post Card Entry Animation =====
  function animateNewCards() {
    const cards = feedContainer.querySelectorAll(".post-card:not(.animated)");
    cards.forEach((card, i) => {
      card.classList.add("animated");
      card.style.opacity = "0";
      card.style.transform = "translateY(16px)";
      card.style.transition = "none";
      requestAnimationFrame(() => {
        setTimeout(() => {
          card.style.transition = "opacity 0.3s ease, transform 0.3s ease";
          card.style.opacity = "1";
          card.style.transform = "translateY(0)";
        }, i * 60);
      });
    });
  }

  // ===== 8. Real-time New Post Insertion (Triggered Only by Real User Posts) =====
  document.addEventListener("th:postAdded", e => {
    const post = e.detail;
    if (!post) { refreshFeed(); return; }
    if (window._curQuery) return;
    if (window._curCategory !== "all" && window._curCategory !== post.category) return;

    const card = document.createElement("div");
    card.className = "post-card real-inject animated";
    card.dataset.id = post.id;
    const images = post.imagesList || post.images || [];
    const imgHtml = images.length
        ? `<div class="post-images">${images.map(u => `<img src="${u}" alt="">`).join("")}</div>`
        : "";
    const isMe = post.authorId === Store.currentUser.id;
    card.innerHTML = `
      <div class="post-header">
        <div class="avatar" style="cursor:pointer" data-author-id="${post.authorId}">${Render.escapeHtml(post.avatarLetter || "Anon")}</div>
        <div class="post-meta" style="flex:1">
          <span class="post-author">${Render.escapeHtml(post.author)}</span>
          <span class="post-time">Just now</span>
        </div>
        ${!isMe ? `<button class="follow-btn-card" data-author-id="${post.authorId}" data-author="${Render.escapeHtml(post.author)}" data-avatar="${Render.escapeHtml(post.avatarLetter || "Anon")}">
          ${Store.isFollowing(post.authorId) ? '<i class="fas fa-check"></i> Following' : '<i class="fas fa-plus"></i> Follow'}
        </button>` : ""}
      </div>
      <div class="post-body">${Render.escapeHtml(post.content)}</div>
      ${imgHtml}
      <div class="post-actions" onclick="event.stopPropagation()">
        <button class="action-btn" data-action="like" data-id="${post.id}">
          <i class="far fa-heart"></i> ${post.likes || 0}
        </button>
        <button class="action-btn" data-action="comment" data-id="${post.id}">
          <i class="far fa-comment"></i> 0
        </button>
        <button class="action-btn" data-action="collect" data-id="${post.id}">
          <i class="far fa-bookmark"></i> Collect
        </button>
      </div>`;

    card.style.opacity = "0";
    card.style.transform = "translateY(-12px)";
    if (emptyFeedMsg) emptyFeedMsg.style.display = "none";
    feedContainer.insertBefore(card, feedContainer.firstChild);
    requestAnimationFrame(() => {
      card.style.transition = "opacity 0.4s ease, transform 0.4s ease";
      card.style.opacity = "1";
      card.style.transform = "translateY(0)";
    });

    card.addEventListener("click", () => showDetail(card.dataset.id));
    card.querySelectorAll("[data-action]").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const { action, id } = btn.dataset;
        if (action === "like") { Store.toggleLike(id); refreshFeed(); }
        else if (action === "collect") { Store.toggleCollect(id); refreshFeed(); }
        else if (action === "comment") showDetail(id);
      });
    });
    bindFollowBtns(card);
    renderHotSearch();
  });

  // ===== 9. Comment Replies =====

  function onReply(comment) {
    replyingTo = comment;
    updateReplyHint();
    commentInput.focus();
  }

  function updateReplyHint() {
    const hint = document.getElementById("replyHint");
    if (!hint) return;
    if (replyingTo) {
      hint.textContent = `Reply to @${replyingTo.author}`;
      hint.style.display = "inline-flex";
    } else {
      hint.style.display = "none";
    }
  }

  submitCommentBtn.addEventListener("click", async () => {
    const text = commentInput.value.trim();
    if (!text || !currentPostId) return;
    try {
      const body = { content: text };
      if (replyingTo && replyingTo.id) body.parentId = parseInt(replyingTo.id) || null;
      const res = await fetch("https://api.szsummer.com/api/treeholes/posts/" + currentPostId + "/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body)
      });
      if (res.ok) {
        commentInput.value = "";
        replyingTo = null;
        updateReplyHint();
        const post = await Store.fetchPostFromApi(currentPostId);
        Render.renderComments(commentsList, commentCountEl, post, onReply);
        Render.updateNotifBadges();
      } else {
        const err = await res.json();
        if (err.message === "NOT_LOGGED_IN") {
          window.notify.show.show("Please log in before commenting", 'error');
        } else {
          window.notify.show.show("Comment failed: " + (err.message || res.status), 'error');
        }
      }
    } catch (e) {
      console.warn("addComment failed:", e);
    }
  });

  commentInput.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitCommentBtn.click(); }
    if (e.key === "Escape") { replyingTo = null; updateReplyHint(); }
  });

  // ===== 10. Navbar Search =====
  let searchTimer = null;
  document.getElementById("searchInput").addEventListener("input", e => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(async () => {
      window._curQuery = e.target.value.trim();
      await refreshFeed();
    }, 300);
  });

  // Search button click event
  document.getElementById("searchButton").addEventListener("click", async e => {
    e.preventDefault();
    window._curQuery = document.getElementById("searchInput").value.trim();
    await refreshFeed();
  });

  // Search input enter key event
  document.getElementById("searchInput").addEventListener("keypress", async e => {
    if (e.key === "Enter") {
      e.preventDefault();
      window._curQuery = e.target.value.trim();
      await refreshFeed();
    }
  });

  // ===== 11. Left Category Filter =====
  document.querySelectorAll(".sidebar-item[data-category]").forEach(item => {
    item.addEventListener("click", async () => {
      document.querySelectorAll(".sidebar-item[data-category]").forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      window._curCategory = item.dataset.category;
      await refreshFeed();
    });
  });

  // ===== 12. Notification Bar Click → Navigate to Favorites Tab =====
  document.getElementById("notifyRepliesBtn").addEventListener("click", () => {
    window.location.href = "favorites.html#comments";
  });

  document.getElementById("notifyMsgBtn").addEventListener("click", () => {
    window.location.href = "favorites.html#messages";
  });

  // ===== My Following =====
  document.getElementById("myFollowingBtn").addEventListener("click", () => {
    window.location.href = "favorites.html#following";
  });

  // ===== My Favorites =====
  document.getElementById("myFavoritesBtn").addEventListener("click", () => {
    window.location.href = "favorites.html";
  });

  // ===== Follow Button & Author Popover =====
  window.bindFollowBtns = function (root) {
    (root || document).querySelectorAll(".follow-btn-card").forEach(btn => {
      btn.addEventListener("click", async e => {
        e.stopPropagation();
        const uid = btn.dataset.authorId;
        const following = await Store.toggleFollow(uid);
        btn.innerHTML = following
            ? '<i class="fas fa-check"></i> Following'
            : '<i class="fas fa-plus"></i> Follow';
        btn.classList.toggle("following", following);
        // Sync button in popover
        const card = btn.closest(".post-card");
        if (card) {
          const apBtn = card.querySelector(".ap-follow-btn");
          if (apBtn) {
            apBtn.textContent = following ? "Following" : "+ Follow";
            apBtn.classList.toggle("following", following);
          }
        }
      });
    });

    (root || document).querySelectorAll(".ap-follow-btn").forEach(btn => {
      btn.addEventListener("click", async e => {
        e.stopPropagation();
        const uid = btn.dataset.authorId;
        const following = await Store.toggleFollow(uid);
        btn.textContent = following ? "Following" : "+ Follow";
        btn.classList.toggle("following", following);
        const card = btn.closest(".post-card");
        if (card) {
          const fbBtn = card.querySelector(".follow-btn-card");
          if (fbBtn) {
            fbBtn.innerHTML = following
                ? '<i class="fas fa-check"></i> Following'
                : '<i class="fas fa-plus"></i> Follow';
            fbBtn.classList.toggle("following", following);
          }
        }
      });
    });

    // Avatar hover popover
    (root || document).querySelectorAll(".avatar-popover-wrap").forEach(wrap => {
      const avatar = wrap.querySelector(".avatar");
      const popover = wrap.querySelector(".author-popover");
      if (!avatar || !popover) return;
      let timer;
      avatar.addEventListener("mouseenter", () => {
        clearTimeout(timer);
        popover.classList.add("visible");
      });
      wrap.addEventListener("mouseleave", () => {
        timer = setTimeout(() => popover.classList.remove("visible"), 200);
      });
      popover.addEventListener("mouseenter", () => clearTimeout(timer));
    });
  };
  document.getElementById("backBtn").addEventListener("click", showHome);

  // ===== 14. Cross-Module Event Listeners =====

  // Check for new posts brought back from publish.html
  const newPostRaw = sessionStorage.getItem("th_new_post");
  if (newPostRaw) {
    sessionStorage.removeItem("th_new_post");
    try {
      const newPost = JSON.parse(newPostRaw);
      setTimeout(() => {
        document.dispatchEvent(new CustomEvent("th:postAdded", { detail: newPost }));
      }, 300);
    } catch (e) { }
  }

  // Check for chat navigation brought back from favorites.html
  const openChatRaw = sessionStorage.getItem("th_open_chat");
  if (openChatRaw) {
    sessionStorage.removeItem("th_open_chat");
    try {
      const { uid, name, avatar } = JSON.parse(openChatRaw);
      setTimeout(() => openMessage(uid, name, avatar), 200);
    } catch (e) { }
  }

  document.addEventListener("th:closeMessage", () => {
    if (currentPostId) showDetail(currentPostId);
    else showHome();
  });

  // Click overlay to close welcome modal
  welcomeModal.addEventListener("click", e => { if (e.target === welcomeModal) welcomeModal.classList.remove("open"); });

  // ===== 15. User Settings Panel =====
  document.getElementById("userAvatarBtn").addEventListener("click", () => {
    window.location.href = "settings.html";
  }, true);

  // ===== 16. Initial Render =====
  (async function () {
    await refreshFeed();
    Render.updateNotifBadges();
  })();
});
