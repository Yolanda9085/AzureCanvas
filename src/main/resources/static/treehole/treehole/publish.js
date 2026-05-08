/**
 * publish.js — 发布模块
 * 管理发布弹窗：图片上传、表情插入、分类选择、提交
 * 通过 window.Publish 暴露
 * 依赖：store.js（Store）
 */
window.Publish = (function () {
  let selectedImages = [];

  // ===== DOM 引用（DOMContentLoaded 后初始化）=====
  let modal, textarea, categorySelect, imageInput, imagePreview, emojiPicker, emojiToggleBtn;

  function init() {
    modal = document.getElementById("publishModal");
    textarea = document.getElementById("postTextInput");
    categorySelect = document.getElementById("postCategorySelect");
    imageInput = document.getElementById("imageUploadInput");
    imagePreview = document.getElementById("imagePreviewContainer");
    emojiPicker = document.getElementById("emojiPicker");
    emojiToggleBtn = document.getElementById("emojiToggleBtn");

    // 图片上传
    imageInput.addEventListener("change", e => {
      Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = ev => {
          selectedImages.push(ev.target.result);
          const img = document.createElement("img");
          img.src = ev.target.result;
          img.className = "preview-img";
          imagePreview.appendChild(img);
        };
        reader.readAsDataURL(file);
      });
      imageInput.value = "";
    });

    // 表情切换
    emojiToggleBtn.addEventListener("click", () => {
      emojiPicker.classList.toggle("open");
    });

    // 表情插入到光标位置
    emojiPicker.querySelectorAll("span").forEach(span => {
      span.addEventListener("click", () => {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const val = textarea.value;
        textarea.value = val.slice(0, start) + span.textContent + val.slice(end);
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + span.textContent.length;
        emojiPicker.classList.remove("open");
      });
    });

    // 点击遮罩关闭
    modal.addEventListener("click", e => {
      if (e.target === modal) close();
    });

    // 关闭/取消按钮
    document.getElementById("closeModalBtn").addEventListener("click", close);
    document.getElementById("cancelPublishBtn").addEventListener("click", close);

    // 发布提交
    document.getElementById("submitPostBtn").addEventListener("click", submit);

    // 发布按钮 & home 输入栏
    document.getElementById("newPostBtn").addEventListener("click", open);
    document.getElementById("homeInputBar").addEventListener("click", open);
  }

  /** 打开发布弹窗 */
  function open() {
    modal.classList.add("open");
    textarea.focus();
  }

  /** 关闭并重置 */
  function close() {
    modal.classList.remove("open");
    emojiPicker.classList.remove("open");
    textarea.value = "";
    imagePreview.innerHTML = "";
    selectedImages = [];
  }

  /** 提交发布 */
  function submit() {
    const content = textarea.value.trim();
    if (!content) {
      window.notify.show.show("内容不能为空", 'error');
      return;
    }
    Store.addPost(content, categorySelect.value, [...selectedImages]);
    close();
    // 通知 main.js 刷新 feed
    document.dispatchEvent(new CustomEvent("th:postAdded"));
  }

  return { init, open, close };
})();
