document.addEventListener("DOMContentLoaded", () => {

  // ===== 0. 加载画面 =====
  const loadingScreen = document.getElementById("loadingScreen");
  const welcomeModal = document.getElementById("welcomeModal");
  const isFirstVisit = !localStorage.getItem("th_visited");
  const loadingBar = document.getElementById("loadingBar");
  const loadingStatus = document.getElementById("loadingStatus");
  const loadingWelcome = document.getElementById("loadingWelcome");

  // 启动粒子背景
  startLoadingParticles();

  // 模拟加载进度
  const steps = [
    { pct: 20, text: "初始化数据…" },
    { pct: 50, text: "加载帖子…" },
    { pct: 75, text: "渲染界面…" },
    { pct: 95, text: "即将完成…" },
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

  // 最短显示 1.6s，之后等页面就绪
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

  // ===== 1. 初始化数据层 =====
  Store.init();

  // ===== 2. 初始化各功能模块 =====
  UserModule.init();
  MessageModule.init();

  // ===== 3. 缓存 DOM =====
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

  // ===== 4. 全局状态 =====
  window._curCategory = "all";
  window._curQuery = "";
  let currentPostId = null;
  let replyingTo = null;

  // ===== 5. 视图路由 =====

  function showHome() {
    homeView.classList.remove("hidden");
    detailView.classList.remove("active");
    messageView.classList.remove("active");
    refreshFeed();
    Render.updateNotifBadges();
  }

  function showDetail(postId) {
    currentPostId = postId;
    const post = Store.getPost(postId);
    if (!post) return;
    homeView.classList.add("hidden");
    detailView.classList.add("active");
    messageView.classList.remove("active");
    Render.renderDetailPost(detailPostBody, detailActions, post, openMessage);
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

  // ===== 热搜榜（前3 + 更多）=====
  let hotShowAll = false;
  function renderHotSearch() {
    const el = document.getElementById("hotSearchList");
    const moreEl = document.getElementById("hotSearchMore");
    const moreBtn = document.getElementById("hotMoreBtn");
    if (!el) return;
    const posts = Store.getFilteredPosts("all", "");
    const ranked = [...posts]
      .map(p => ({ id: p.id, text: p.content.slice(0, 22), heat: (p.likes || 0) * 3 + (p.comments ? p.comments.length : 0) * 5 }))
      .sort((a, b) => b.heat - a.heat)
      .slice(0, 10);
    const heatLabels = ["沸", "热", "热", "热", "热"];
    const makeItem = (item, i) => `
      <div class="hot-item" data-id="${item.id}">
        <span class="hot-rank ${i===0?"top1":i===1?"top2":i===2?"top3":""}">${i+1}</span>
        <span class="hot-text">${Render.escapeHtml(item.text)}</span>
        <span class="hot-heat">${i < 5 ? heatLabels[i] : ""} ${item.heat}</span>
      </div>`;
    el.innerHTML = ranked.slice(0, 5).map((item, i) => makeItem(item, i)).join("");
    if (moreEl) {
      moreEl.innerHTML = ranked.slice(5).map((item, i) => makeItem(item, i + 5)).join("");
      moreEl.style.display = hotShowAll ? "block" : "none";
    }
    if (moreBtn) {
      moreBtn.style.display = ranked.length > 5 ? "flex" : "none";
      moreBtn.innerHTML = hotShowAll
        ? '<i class="fas fa-chevron-up"></i> 收起'
        : '<i class="fas fa-chevron-down"></i> 更多热搜';
    }
    [el, moreEl].forEach(container => {
      if (!container) return;
      container.querySelectorAll(".hot-item").forEach(item => {
        item.addEventListener("click", () => showDetail(item.dataset.id));
      });
    });
  }

  // 更多热搜按钮
  const hotMoreBtn = document.getElementById("hotMoreBtn");
  if (hotMoreBtn) {
    hotMoreBtn.addEventListener("click", () => {
      hotShowAll = !hotShowAll;
      renderHotSearch();
    });
  }

  // ===== 6. Feed 刷新（前3条 + 展开更多）=====
  let feedExpanded = false;
  let feedOffset = 0;

  function refreshFeed() {
    const posts = Store.getFilteredPosts(window._curCategory, window._curQuery);

    if (window._curQuery) {
      searchResultsBar.textContent = `搜索「${window._curQuery}」，找到 ${posts.length} 条结果`;
      searchResultsBar.classList.add("visible");
    } else {
      searchResultsBar.classList.remove("visible");
    }

    const displayPosts = feedExpanded ? posts : posts.slice(feedOffset, feedOffset + 3);
    Render.renderFeed(feedContainer, emptyFeedMsg, displayPosts, showDetail);
    animateNewCards();
    renderHotSearch();

    // update expand button
    const expandBtn = document.getElementById("feedExpandBtn");
    if (expandBtn) {
      if (feedExpanded) {
        expandBtn.innerHTML = '<i class="fas fa-chevron-up"></i> 收起';
      } else {
        const remaining = posts.length - (feedOffset + 3);
        expandBtn.innerHTML = remaining > 0
          ? `<i class="fas fa-chevron-down"></i> 展开更多 (${remaining})`
          : '<i class="fas fa-chevron-down"></i> 展开更多';
        expandBtn.style.display = posts.length > 3 ? "flex" : "none";
      }
    }
  }

  // 刷新按钮（换一批）
  const feedRefreshBtn = document.getElementById("feedRefreshBtn");
  if (feedRefreshBtn) {
    feedRefreshBtn.addEventListener("click", e => {
      e.stopPropagation();
      if (feedExpanded) return;
      const posts = Store.getFilteredPosts(window._curCategory, window._curQuery);
      feedOffset = (feedOffset + 3) % Math.max(posts.length, 1);
      // spin icon
      const icon = feedRefreshBtn.querySelector("i");
      if (icon) { icon.style.transition = "transform 0.4s"; icon.style.transform = "rotate(360deg)"; setTimeout(() => { icon.style.transition = ""; icon.style.transform = ""; }, 400); }
      refreshFeed();
    });
  }

  // 展开/收起按钮
  const feedExpandBtn = document.getElementById("feedExpandBtn");
  if (feedExpandBtn) {
    feedExpandBtn.addEventListener("click", e => {
      e.stopPropagation();
      feedExpanded = !feedExpanded;
      if (!feedExpanded) feedOffset = 0;
      refreshFeed();
    });
  }

  // ===== 7. 帖子卡片入场动画 =====
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

  // ===== 8. 新帖子实时插入（仅真实用户发布触发）=====
  document.addEventListener("th:postAdded", e => {
    const post = e.detail;
    if (!post) { refreshFeed(); return; }
    if (window._curQuery) return;
    if (window._curCategory !== "all" && window._curCategory !== post.category) return;

    const card = document.createElement("div");
    card.className = "post-card real-inject animated";
    card.dataset.id = post.id;
    const imgHtml = post.images && post.images.length
      ? `<div class="post-images">${post.images.map(u => `<img src="${u}" alt="">`).join("")}</div>`
      : "";
    const isMe = post.authorId === Store.currentUser.id;
    card.innerHTML = `
      <div class="post-header">
        <div class="avatar" style="cursor:pointer" data-author-id="${post.authorId}">${Render.escapeHtml(post.avatarLetter || "匿")}</div>
        <div class="post-meta" style="flex:1">
          <span class="post-author">${Render.escapeHtml(post.author)}</span>
          <span class="post-time">刚刚</span>
        </div>
        ${!isMe ? `<button class="follow-btn-card" data-author-id="${post.authorId}" data-author="${Render.escapeHtml(post.author)}" data-avatar="${Render.escapeHtml(post.avatarLetter||"匿")}">
          ${Store.isFollowing(post.authorId) ? '<i class="fas fa-check"></i> 已关注' : '<i class="fas fa-plus"></i> 关注'}
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
          <i class="far fa-bookmark"></i> 收藏
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

  // ===== 9. 评论回复 =====

  function onReply(comment) {
    replyingTo = comment;
    updateReplyHint();
    commentInput.focus();
  }

  function updateReplyHint() {
    const hint = document.getElementById("replyHint");
    if (!hint) return;
    if (replyingTo) {
      hint.textContent = `回复 @${replyingTo.author}`;
      hint.style.display = "inline-flex";
    } else {
      hint.style.display = "none";
    }
  }

  submitCommentBtn.addEventListener("click", () => {
    const text = commentInput.value.trim();
    if (!text || !currentPostId) return;
    Store.addComment(currentPostId, text, replyingTo ? { id: replyingTo.id, author: replyingTo.author, authorId: replyingTo.authorId } : null);
    commentInput.value = "";
    replyingTo = null;
    updateReplyHint();
    const post = Store.getPost(currentPostId);
    Render.renderComments(commentsList, commentCountEl, post, onReply);
    Render.updateNotifBadges();
  });

  commentInput.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitCommentBtn.click(); }
    if (e.key === "Escape") { replyingTo = null; updateReplyHint(); }
  });

  // ===== 10. 导航栏搜索 =====
  let searchTimer = null;
  document.getElementById("searchInput").addEventListener("input", e => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      window._curQuery = e.target.value.trim();
      refreshFeed();
    }, 300);
  });

  // ===== 11. 左侧分类筛选 =====
  document.querySelectorAll(".sidebar-item[data-category]").forEach(item => {
    item.addEventListener("click", () => {
      document.querySelectorAll(".sidebar-item[data-category]").forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      window._curCategory = item.dataset.category;
      refreshFeed();
    });
  });

  // ===== 12. 通知栏点击 → 跳转收藏页对应 tab =====
  document.getElementById("notifyRepliesBtn").addEventListener("click", () => {
    window.location.href = "favorites.html#comments";
  });

  document.getElementById("notifyMsgBtn").addEventListener("click", () => {
    window.location.href = "favorites.html#messages";
  });

  // ===== 我的关注 =====
  document.getElementById("myFollowingBtn").addEventListener("click", () => {
    window.location.href = "favorites.html#following";
  });

  // ===== 我的收藏 =====
  document.getElementById("myFavoritesBtn").addEventListener("click", () => {
    window.location.href = "favorites.html";
  });

  // ===== 关注按钮 & 作者气泡 =====
  window.bindFollowBtns = function(root) {
    (root || document).querySelectorAll(".follow-btn-card").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const uid = btn.dataset.authorId;
        Store.toggleFollow(uid);
        const following = Store.isFollowing(uid);
        btn.innerHTML = following
          ? '<i class="fas fa-check"></i> 已关注'
          : '<i class="fas fa-plus"></i> 关注';
        btn.classList.toggle("following", following);
        // 同步气泡内按钮
        const card = btn.closest(".post-card");
        if (card) {
          const apBtn = card.querySelector(".ap-follow-btn");
          if (apBtn) {
            apBtn.textContent = following ? "已关注" : "+ 关注";
            apBtn.classList.toggle("following", following);
          }
        }
      });
    });

    (root || document).querySelectorAll(".ap-follow-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const uid = btn.dataset.authorId;
        Store.toggleFollow(uid);
        const following = Store.isFollowing(uid);
        btn.textContent = following ? "已关注" : "+ 关注";
        btn.classList.toggle("following", following);
        const card = btn.closest(".post-card");
        if (card) {
          const fbBtn = card.querySelector(".follow-btn-card");
          if (fbBtn) {
            fbBtn.innerHTML = following
              ? '<i class="fas fa-check"></i> 已关注'
              : '<i class="fas fa-plus"></i> 关注';
            fbBtn.classList.toggle("following", following);
          }
        }
      });
    });

    // 头像悬停气泡（fixed 定位，覆盖所有内容）
    (root || document).querySelectorAll(".avatar-popover-wrap").forEach(wrap => {
      const avatar = wrap.querySelector(".avatar");
      const popover = wrap.querySelector(".author-popover");
      if (!avatar || !popover) return;
      let timer;

      function positionPopover() {
        const rect = avatar.getBoundingClientRect();
        const pw = 200, ph = 160;
        let left = rect.left;
        let top = rect.bottom + 6;
        // 防止超出右边界
        if (left + pw > window.innerWidth - 8) left = window.innerWidth - pw - 8;
        // 防止超出下边界，改为显示在头像上方
        if (top + ph > window.innerHeight - 8) top = rect.top - ph - 6;
        popover.style.left = left + "px";
        popover.style.top = top + "px";
      }

      avatar.addEventListener("mouseenter", () => {
        clearTimeout(timer);
        positionPopover();
        popover.classList.add("visible");
      });
      avatar.addEventListener("mouseleave", () => {
        timer = setTimeout(() => popover.classList.remove("visible"), 200);
      });
      popover.addEventListener("mouseenter", () => clearTimeout(timer));
      popover.addEventListener("mouseleave", () => {
        timer = setTimeout(() => popover.classList.remove("visible"), 200);
      });
    });
  };
  document.getElementById("backBtn").addEventListener("click", showHome);

  // ===== 14. 跨模块事件监听 =====

  // 检查从 publish.html 带回的新帖子
  const newPostRaw = sessionStorage.getItem("th_new_post");
  if (newPostRaw) {
    sessionStorage.removeItem("th_new_post");
    try {
      const newPost = JSON.parse(newPostRaw);
      setTimeout(() => {
        document.dispatchEvent(new CustomEvent("th:postAdded", { detail: newPost }));
      }, 300);
    } catch(e) {}
  }

  // 检查从 favorites.html 带回的私信跳转
  const openChatRaw = sessionStorage.getItem("th_open_chat");
  if (openChatRaw) {
    sessionStorage.removeItem("th_open_chat");
    try {
      const { uid, name, avatar } = JSON.parse(openChatRaw);
      setTimeout(() => openMessage(uid, name, avatar), 200);
    } catch(e) {}
  }

  document.addEventListener("th:closeMessage", () => {
    if (currentPostId) showDetail(currentPostId);
    else showHome();
  });

  // 点击遮罩关闭欢迎弹窗
  welcomeModal.addEventListener("click", e => { if (e.target === welcomeModal) welcomeModal.classList.remove("open"); });

  // ===== 15. 用户设置面板 =====
  document.getElementById("userAvatarBtn").addEventListener("click", () => {
    window.location.href = "settings.html";
  }, true);

  // ===== 深夜模式 =====
  const nightBtn = document.getElementById("nightModeBtn");
  let isNightMode = localStorage.getItem("th_night_mode") === "1";

  function applyNightMode(on) {
    document.body.classList.toggle("night-mode", on);
    if (nightBtn) {
      nightBtn.innerHTML = on
        ? '<i class="fas fa-sun"></i> Day Mode'
        : '<i class="fas fa-moon"></i> Night Mode';
    }
  }
  applyNightMode(isNightMode);

  if (nightBtn) {
    nightBtn.addEventListener("click", () => {
      isNightMode = !isNightMode;
      localStorage.setItem("th_night_mode", isNightMode ? "1" : "0");
      applyNightMode(isNightMode);
    });
  }

  // ===== 主页背景图 =====
  const bgImg = localStorage.getItem("th_bg_img");
  if (bgImg) {
    document.body.style.backgroundImage = `url(${bgImg})`;
    document.body.classList.add("has-bg-img");
  }

  // ===== 用户头像图片 =====
  const avatarImg = localStorage.getItem("th_avatar_img");
  const userAvatarBtn = document.getElementById("userAvatarBtn");
  if (avatarImg && userAvatarBtn) {
    userAvatarBtn.textContent = "";
    userAvatarBtn.style.backgroundImage = `url(${avatarImg})`;
    userAvatarBtn.style.backgroundSize = "cover";
    userAvatarBtn.style.backgroundPosition = "center";
  }

  // 首页输入栏小头像
  const homeAvatarSm = document.getElementById("homeAvatarSm");
  if (homeAvatarSm) {
    if (avatarImg) {
      homeAvatarSm.innerHTML = `<img src="${avatarImg}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    } else {
      const u = Store.currentUser;
      homeAvatarSm.textContent = u.avatarLetter || "";
      if (u.avatarColor) homeAvatarSm.style.background = u.avatarColor;
    }
  }

  // ===== 16. 初始渲染 =====
  refreshFeed();
  Render.updateNotifBadges();
});
