/**
 * user.js — User Module
 * Responsible for rendering and syncing the avatar button in the top-right corner
 * Supports fetching user avatar from API (UUID format → /resource/{uuid})
 */
window.UserModule = (function () {

  function init() {
    fetchCurrentUser();
  }

  /**
   * Convert avatar UUID to complete resource URL
   * @param {string} avatar - Avatar identifier in UUID format
   * @returns {string|null} Complete avatar URL or null
   */
  function resolveAvatarUrl(avatar) {
    if (!avatar) return null;
    // If already a complete URL, return directly
    if (avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('/')) {
      return avatar;
    }
    // Assume UUID format, convert to /resources/{uuid}
    return '/resources/' + avatar;
  }

  async function fetchCurrentUser() {
    try {
      const res = await fetch("https://api.szsummer.com/api/users/me", { credentials: "include" });
      if (res.ok) {
        const u = await res.json();

        // Process avatar URL: supports avatar field (UUID format)
        const avatarUrl = resolveAvatarUrl(u.avatar || u.avatarUrl);

        Store.updateUser({
          id: u.userId || u.id,
          nickname: u.username || u.nickname,
          avatarUrl: avatarUrl,
          avatarLetter: u.username ? u.username.substring(0, 1) : "U",
          uuid: u.userId || u.id  // Save user UUID for subsequent navigation
        });
      } else {
        // If not logged in and currently on a page requiring authentication, redirect
        const protectedPages = ['publish.html', 'settings.html', 'favorites.html'];
        const currentPage = window.location.pathname.split('/').pop();
        if (protectedPages.includes(currentPage)) {
          window.location.href = "../login/index.html?redirect=" + encodeURIComponent(window.location.pathname);
        }
      }
    } catch (e) {
      console.warn("fetchCurrentUser failed:", e);
    }
    renderUserBadge();
  }

  function renderUserBadge() {
    const btn = document.getElementById("userAvatarBtn");
    if (!btn) return;
    const u = Store.currentUser;
    if (u.avatarUrl) {
      btn.textContent = "";
      btn.style.backgroundImage = `url(${u.avatarUrl})`;
      btn.style.backgroundSize = "cover";
      btn.style.backgroundPosition = "center";
    } else {
      const letter = u.avatarLetter || u.nickname ? u.nickname.substring(0, 1) : "U";
      btn.textContent = letter;
      btn.style.backgroundImage = "linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)";
      btn.style.backgroundSize = "auto";
    }
  }

  function openSettings() {
    window.location.href = "settings.html";
  }

  return { init, renderUserBadge, openSettings, resolveAvatarUrl };
})();
