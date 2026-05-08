/**
 * store.js — Data Layer
 * Manages all persistent data: posts, users, follows, messages, notifications
 * Exposed to other modules via window.Store
 */
window.Store = (function () {
  // localStorage key names
  const KEYS = {
    posts: "th_posts_v3",
    user: "th_user",
    follows: "th_follows",
    messages: "th_messages",
    notifications: "th_notifications",
  };

  // ===== Internal State =====
  let posts = [];
  let currentUser = null;
  let follows = new Set(); // Set of followed authorIds
  let messages = {};       // { threadId: { withUser, messages[] } }
  let notifications = [];  // Notification list

  // ===== Default Mock Data =====
  function getMockPosts() {
    return [
      {
        id: "p1", author: "Anonymous Tree", authorId: "u_tree",
        avatarLetter: "A", timestamp: Date.now() - 3600000 * 5,
        content: "Does anyone know if the window seats on the third floor of the library need to be reserved now? 📚",
        category: "question", images: [], likes: 12, liked: false, collected: false,
        comments: [
          { id: "c1", author: "Helpful Classmate", authorId: "u_hot", text: "Yes, you need to reserve, it started last week", timestamp: Date.now() - 800000, replyTo: null },
          { id: "c2", author: "Librarian", authorId: "u_lib", text: "Yes, use the campus card app", timestamp: Date.now() - 400000, replyTo: null }
        ]
      },
      {
        id: "p2", author: "Graduation Countdown", authorId: "u_grad",
        avatarLetter: "G", timestamp: Date.now() - 86400000,
        content: "Taking graduation photos today, keeping four years of memories here 🎓 Thanks, Treehole.",
        category: "emotion", images: [], likes: 45, liked: false, collected: true,
        comments: [
          { id: "c3", author: "Junior", authorId: "u_junior", text: "Wishing seniors a bright future!", timestamp: Date.now() - 4000000, replyTo: null }
        ]
      },
      {
        id: "p3", author: "Canteen Observer", authorId: "u_food",
        avatarLetter: "C", timestamp: Date.now() - 7200000,
        content: "The new spicy hot pot at Canteen 2 is amazing! 🌶️ But the queue is a bit long.",
        category: "life", images: [], likes: 28, liked: true, collected: false,
        comments: []
      },
      // ===== Imported from legacy treehole (translated) =====
      {
        id: "legacy_p1", author: "Anonymous Sprout", authorId: "u_legacy_tree",
        avatarLetter: "A", timestamp: Date.now() - 3600000 * 5,
        content: "Does anyone know if the window seats on the third floor of the library need to be reserved now? 📚",
        category: "question", images: [], likes: 12, liked: false, collected: false,
        comments: [
          { id: "legacy_c1", author: "Helpful Classmate", authorId: "u_legacy_hot", text: "Yes, reservations started last week", timestamp: Date.now() - 800000, replyTo: null },
          { id: "legacy_c2", author: "Librarian", authorId: "u_legacy_lib", text: "Yes, use the campus card app to book", timestamp: Date.now() - 400000, replyTo: null }
        ]
      },
      {
        id: "legacy_p2", author: "Graduation Countdown", authorId: "u_legacy_grad",
        avatarLetter: "G", timestamp: Date.now() - 86400000,
        content: "Taking graduation photos today, leaving four years of memories here 🎓 Thank you, Treehole.",
        category: "emotion", images: [], likes: 45, liked: false, collected: false,
        comments: [
          { id: "legacy_c3", author: "Underclassman", authorId: "u_legacy_junior", text: "Wishing all seniors a bright future!", timestamp: Date.now() - 4000000, replyTo: null }
        ]
      },
      {
        id: "legacy_p3", author: "Canteen Watcher", authorId: "u_legacy_food",
        avatarLetter: "C", timestamp: Date.now() - 7200000,
        content: "The new spicy hot pot at Canteen 2 is absolutely incredible! 🌶️ The queue is a bit long though.",
        category: "life", images: [], likes: 28, liked: false, collected: false,
        comments: []
      },
      {
        id: "legacy_p4", author: "Night Owl", authorId: "u_legacy_night",
        avatarLetter: "N", timestamp: Date.now() - 3600000 * 10,
        content: "It's 2am and I'm still in the lab running experiments. Anyone else pulling an all-nighter? 🌙",
        category: "study", images: [], likes: 33, liked: false, collected: false,
        comments: [
          { id: "legacy_c4", author: "Fellow Sufferer", authorId: "u_legacy_suffer", text: "Same here, thesis deadline is tomorrow 😭", timestamp: Date.now() - 3600000 * 9, replyTo: null }
        ]
      },
      {
        id: "legacy_p5", author: "Lost Freshman", authorId: "u_legacy_fresh",
        avatarLetter: "L", timestamp: Date.now() - 3600000 * 2,
        content: "Just arrived on campus, totally lost 😅 Can anyone tell me where the registration office is?",
        category: "question", images: [], likes: 7, liked: false, collected: false,
        comments: [
          { id: "legacy_c5", author: "Senior Guide", authorId: "u_legacy_senior", text: "It's in Building A, first floor, follow the signs from the main gate!", timestamp: Date.now() - 3600000, replyTo: null }
        ]
      },
      {
        id: "legacy_p6", author: "Music Lover", authorId: "u_legacy_music",
        avatarLetter: "M", timestamp: Date.now() - 86400000 * 2,
        content: "The Music Society's spring concert last night was absolutely amazing 🎵 So proud of everyone who performed!",
        category: "share", images: [], likes: 61, liked: false, collected: false,
        comments: []
      },
      {
        id: "legacy_p7", author: "Stressed Student", authorId: "u_legacy_stress",
        avatarLetter: "S", timestamp: Date.now() - 3600000 * 8,
        content: "Finals week is killing me. Three exams in two days. Someone please send help ☕",
        category: "emotion", images: [], likes: 89, liked: false, collected: false,
        comments: [
          { id: "legacy_c6", author: "Supportive Friend", authorId: "u_legacy_support", text: "You've got this! One exam at a time 💪", timestamp: Date.now() - 3600000 * 7, replyTo: null },
          { id: "legacy_c7", author: "Coffee Addict", authorId: "u_legacy_coffee", text: "The 24h convenience store near Gate 2 has great coffee!", timestamp: Date.now() - 3600000 * 6, replyTo: null }
        ]
      },
      {
        id: "legacy_p8", author: "Campus Photographer", authorId: "u_legacy_photo",
        avatarLetter: "P", timestamp: Date.now() - 86400000 * 3,
        content: "The cherry blossoms by the east lake are in full bloom 🌸 Best spot on campus right now, go check it out!",
        category: "share", images: [], likes: 124, liked: false, collected: false,
        comments: [
          { id: "legacy_c8", author: "Nature Fan", authorId: "u_legacy_nature", text: "Went there this morning, absolutely stunning!", timestamp: Date.now() - 86400000 * 2, replyTo: null }
        ]
      },
      // ===== 20 new posts =====
      {
        id: "new_p1", author: "Early Riser", authorId: "u_new1",
        avatarLetter: "E", timestamp: Date.now() - 3600000 * 1,
        content: "Woke up at 6am to grab a seat in the library and it was already half full 😤 How early do you guys get here?",
        category: "study", images: [], likes: 47, liked: false, collected: false,
        comments: [
          { id: "new_c1", author: "Hardcore Studier", authorId: "u_hc1", text: "I get there at 5:45am, the struggle is real 😅", timestamp: Date.now() - 3600000, replyTo: null },
          { id: "new_c2", author: "Night Owl", authorId: "u_no1", text: "I just stay until closing and sleep there lol", timestamp: Date.now() - 1800000, replyTo: null }
        ]
      },
      {
        id: "new_p2", author: "Foodie Scout", authorId: "u_new2",
        avatarLetter: "F", timestamp: Date.now() - 3600000 * 3,
        content: "Hidden gem alert 🍜 The small noodle shop behind the east dorm has the best beef noodles I've ever had. Only 12 yuan!",
        category: "life", images: [], likes: 93, liked: false, collected: false,
        comments: [
          { id: "new_c3", author: "Hungry Student", authorId: "u_hs1", text: "Going there right now, thanks for the tip!", timestamp: Date.now() - 2400000, replyTo: null }
        ]
      },
      {
        id: "new_p3", author: "Heartbroken", authorId: "u_new3",
        avatarLetter: "H", timestamp: Date.now() - 3600000 * 6,
        content: "We broke up after 2 years together. I keep walking past the places we used to go. Does it ever stop hurting? 💔",
        category: "emotion", images: [], likes: 138, liked: false, collected: false,
        comments: [
          { id: "new_c4", author: "Been There", authorId: "u_bt1", text: "It does get better, I promise. Give yourself time 🤍", timestamp: Date.now() - 5400000, replyTo: null },
          { id: "new_c5", author: "Warm Stranger", authorId: "u_ws1", text: "Sending you strength. You're not alone in this.", timestamp: Date.now() - 3600000, replyTo: null }
        ]
      },
      {
        id: "new_p4", author: "Lost in Code", authorId: "u_new4",
        avatarLetter: "L", timestamp: Date.now() - 3600000 * 4,
        content: "Been debugging this one function for 3 hours. Turns out I forgot a semicolon. I want to cry 😭 #programming",
        category: "study", images: [], likes: 204, liked: false, collected: false,
        comments: [
          { id: "new_c6", author: "Senior Dev", authorId: "u_sd1", text: "Classic. We've all been there. Welcome to programming 😂", timestamp: Date.now() - 3000000, replyTo: null }
        ]
      },
      {
        id: "new_p5", author: "Roommate Rant", authorId: "u_new5",
        avatarLetter: "R", timestamp: Date.now() - 3600000 * 7,
        content: "My roommate plays games with headphones off until 2am every night. I've asked nicely three times. What do I do? 😩",
        category: "question", images: [], likes: 56, liked: false, collected: false,
        comments: [
          { id: "new_c7", author: "Dorm Veteran", authorId: "u_dv1", text: "Talk to your RA, that's what they're there for", timestamp: Date.now() - 6000000, replyTo: null },
          { id: "new_c8", author: "Sympathizer", authorId: "u_sym1", text: "Buy earplugs in the meantime, seriously a lifesaver", timestamp: Date.now() - 4200000, replyTo: null }
        ]
      },
      {
        id: "new_p6", author: "Internship Hunter", authorId: "u_new6",
        avatarLetter: "I", timestamp: Date.now() - 86400000,
        content: "Just got an offer from ByteDance for a summer internship! 🎉 For anyone applying: LeetCode medium problems daily for 2 months really works.",
        category: "share", images: [], likes: 312, liked: false, collected: true,
        comments: [
          { id: "new_c9", author: "Aspiring Dev", authorId: "u_ad1", text: "Congrats!! Which team are you joining?", timestamp: Date.now() - 82800000, replyTo: null },
          { id: "new_c10", author: "Grinder", authorId: "u_gr1", text: "This is so motivating, I'm starting today!", timestamp: Date.now() - 79200000, replyTo: null }
        ]
      },
      {
        id: "new_p7", author: "Campus Cyclist", authorId: "u_new7",
        avatarLetter: "C", timestamp: Date.now() - 3600000 * 9,
        content: "Someone stole my bike from the parking area near Building C again 😡 This is the second time. Campus security please do something!",
        category: "question", images: [], likes: 87, liked: false, collected: false,
        comments: [
          { id: "new_c11", author: "Same Victim", authorId: "u_sv1", text: "Mine got stolen last month too. Always use a U-lock!", timestamp: Date.now() - 32400000, replyTo: null }
        ]
      },
      {
        id: "new_p8", author: "Exam Survivor", authorId: "u_new8",
        avatarLetter: "E", timestamp: Date.now() - 3600000 * 2,
        content: "Just finished my last final exam of the semester! 🥳 Four months of hard work done. Time to sleep for 12 hours straight.",
        category: "emotion", images: [], likes: 175, liked: false, collected: false,
        comments: [
          { id: "new_c12", author: "Fellow Survivor", authorId: "u_fs1", text: "CONGRATULATIONS! You deserve all the rest 🎊", timestamp: Date.now() - 7200000, replyTo: null }
        ]
      },
      {
        id: "new_p9", author: "Lost & Found", authorId: "u_new9",
        avatarLetter: "L", timestamp: Date.now() - 3600000 * 5,
        content: "Found a set of keys near the main cafeteria entrance — has a small panda keychain. DM me if it's yours! 🐼",
        category: "question", images: [], likes: 23, liked: false, collected: false,
        comments: [
          { id: "new_c13", author: "Panda Owner", authorId: "u_po1", text: "Oh my gosh that's mine!! Sending you a message now!", timestamp: Date.now() - 18000000, replyTo: null }
        ]
      },
      {
        id: "new_p10", author: "Bookworm", authorId: "u_new10",
        avatarLetter: "B", timestamp: Date.now() - 86400000 * 4,
        content: "Just finished 'The Three-Body Problem' in one weekend. My mind is completely blown 🌌 Best sci-fi I've ever read. Anyone else obsessed?",
        category: "share", images: [], likes: 142, liked: false, collected: true,
        comments: [
          { id: "new_c14", author: "Sci-Fi Fan", authorId: "u_sf1", text: "Read the whole trilogy! Dark Forest is even better 🔥", timestamp: Date.now() - 345600000, replyTo: null },
          { id: "new_c15", author: "New Reader", authorId: "u_nr1", text: "Adding it to my list right now!", timestamp: Date.now() - 259200000, replyTo: null }
        ]
      },
      {
        id: "new_p11", author: "Gym Newbie", authorId: "u_new11",
        avatarLetter: "G", timestamp: Date.now() - 3600000 * 11,
        content: "Started going to the campus gym this week. My arms are so sore I can't lift my backpack 😂 But I'm proud of myself for starting!",
        category: "life", images: [], likes: 68, liked: false, collected: false,
        comments: [
          { id: "new_c16", author: "Gym Regular", authorId: "u_gymr1", text: "The soreness goes away after week 2, keep going! 💪", timestamp: Date.now() - 39600000, replyTo: null }
        ]
      },
      {
        id: "new_p12", author: "Scholarship Seeker", authorId: "u_new12",
        avatarLetter: "S", timestamp: Date.now() - 3600000 * 13,
        content: "Does anyone know the deadline for the National Scholarship application? The academic office website keeps timing out 😤",
        category: "question", images: [], likes: 34, liked: false, collected: false,
        comments: [
          { id: "new_c17", author: "Admin Helper", authorId: "u_ah1", text: "Deadline is May 20th, submit to your department office directly", timestamp: Date.now() - 46800000, replyTo: null }
        ]
      },
      {
        id: "new_p13", author: "Rain Lover", authorId: "u_new13",
        avatarLetter: "R", timestamp: Date.now() - 3600000 * 15,
        content: "Sitting by the window in the library watching the rain fall on campus. These quiet moments make university life so beautiful ☔",
        category: "emotion", images: [], likes: 211, liked: false, collected: true,
        comments: [
          { id: "new_c18", author: "Poet Soul", authorId: "u_ps1", text: "This is the most relatable thing I've read all week 🌧️", timestamp: Date.now() - 54000000, replyTo: null }
        ]
      },
      {
        id: "new_p14", author: "Group Project Victim", authorId: "u_new14",
        avatarLetter: "G", timestamp: Date.now() - 3600000 * 8,
        content: "Our group project presentation is tomorrow and one member just said they 'forgot' to do their part. I'm doing it all myself AGAIN 😤",
        category: "emotion", images: [], likes: 289, liked: false, collected: false,
        comments: [
          { id: "new_c19", author: "Solidarity", authorId: "u_sol1", text: "Tell the professor. You shouldn't carry the whole team.", timestamp: Date.now() - 28800000, replyTo: null },
          { id: "new_c20", author: "Same Energy", authorId: "u_se1", text: "Group projects are the bane of my existence 😭", timestamp: Date.now() - 21600000, replyTo: null }
        ]
      },
      {
        id: "new_p15", author: "Transfer Student", authorId: "u_new15",
        avatarLetter: "T", timestamp: Date.now() - 86400000 * 5,
        content: "Just transferred here from another city. Everything is new and a bit overwhelming. Any tips for making friends quickly? 😊",
        category: "question", images: [], likes: 76, liked: false, collected: false,
        comments: [
          { id: "new_c21", author: "Friendly Senior", authorId: "u_frs1", text: "Join a club! That's how I made all my best friends here 🙌", timestamp: Date.now() - 432000000, replyTo: null },
          { id: "new_c22", author: "Fellow Transfer", authorId: "u_ft1", text: "I transferred last year — feel free to DM me anytime!", timestamp: Date.now() - 388800000, replyTo: null }
        ]
      },
      {
        id: "new_p16", author: "Sunrise Chaser", authorId: "u_new16",
        avatarLetter: "S", timestamp: Date.now() - 3600000 * 20,
        content: "Caught the most incredible sunrise from the rooftop of the engineering building this morning 🌅 Worth every minute of lost sleep.",
        category: "share", images: [], likes: 167, liked: false, collected: true,
        comments: [
          { id: "new_c23", author: "Jealous", authorId: "u_jeal1", text: "How did you get rooftop access?? I need this in my life", timestamp: Date.now() - 72000000, replyTo: null }
        ]
      },
      {
        id: "new_p17", author: "Thesis Warrior", authorId: "u_new17",
        avatarLetter: "T", timestamp: Date.now() - 3600000 * 18,
        content: "My thesis advisor just rejected my third draft. I've rewritten the introduction 7 times. Is this normal or am I just bad at this? 📝",
        category: "study", images: [], likes: 95, liked: false, collected: false,
        comments: [
          { id: "new_c24", author: "PhD Student", authorId: "u_phd1", text: "Completely normal. My advisor rejected my intro 11 times. You're doing fine!", timestamp: Date.now() - 64800000, replyTo: null }
        ]
      },
      {
        id: "new_p18", author: "Midnight Snacker", authorId: "u_new18",
        avatarLetter: "M", timestamp: Date.now() - 3600000 * 22,
        content: "The 24h convenience store near Gate 2 just started selling hot pot cups at midnight 🍲 My wallet and my waistline are both suffering.",
        category: "life", images: [], likes: 128, liked: false, collected: false,
        comments: [
          { id: "new_c25", author: "Night Eater", authorId: "u_ne1", text: "This is dangerous information. I'm going tonight.", timestamp: Date.now() - 79200000, replyTo: null },
          { id: "new_c26", author: "Dietitian", authorId: "u_diet1", text: "Please eat real meals 😭 Your body needs nutrients!", timestamp: Date.now() - 72000000, replyTo: null }
        ]
      },
      {
        id: "new_p19", author: "Volunteer Heart", authorId: "u_new19",
        avatarLetter: "V", timestamp: Date.now() - 86400000 * 3,
        content: "Spent the weekend volunteering at the local elderly care center. They taught us mahjong and shared stories from decades ago. Truly humbling 🙏",
        category: "share", images: [], likes: 183, liked: false, collected: true,
        comments: [
          { id: "new_c27", author: "Inspired", authorId: "u_ins1", text: "This is so wholesome. How do I sign up for next time?", timestamp: Date.now() - 259200000, replyTo: null }
        ]
      },
      {
        id: "new_p20", author: "Graduation Anxiety", authorId: "u_new20",
        avatarLetter: "G", timestamp: Date.now() - 3600000 * 30,
        content: "Graduating in 3 months and I still have no idea what I want to do with my life. Everyone around me seems to have a plan. Am I the only one lost? 🎓",
        category: "emotion", images: [], likes: 347, liked: false, collected: true,
        comments: [
          { id: "new_c28", author: "Class of 2025", authorId: "u_c25", text: "You're definitely not alone. Most of us are just pretending to have it together 😅", timestamp: Date.now() - 108000000, replyTo: null },
          { id: "new_c29", author: "Working Adult", authorId: "u_wa1", text: "Graduated 2 years ago with no plan. Figured it out. You will too 💪", timestamp: Date.now() - 90000000, replyTo: null },
          { id: "new_c30", author: "Career Counselor", authorId: "u_cc1", text: "Come visit the career center in Building B, we're here to help!", timestamp: Date.now() - 72000000, replyTo: null }
        ]
      }
    ];
  }

  // ===== Initialization =====
  const DATA_VERSION = "v2026_05_08"; // bump this to force-merge new mock posts
  const DATA_VERSION_KEY = "th_data_version";

  function init() {
    // Load posts — if data version changed, merge new mock posts into existing data
    try { posts = JSON.parse(localStorage.getItem(KEYS.posts)) || getMockPosts(); }
    catch (e) { posts = getMockPosts(); }

    // Merge new mock posts for returning users when data version bumps
    const storedVersion = localStorage.getItem(DATA_VERSION_KEY);
    if (storedVersion !== DATA_VERSION) {
      const mockPosts = getMockPosts();
      const existingIds = new Set(posts.map(p => p.id));
      const newPosts = mockPosts.filter(p => !existingIds.has(p.id));
      if (newPosts.length > 0) {
        posts = [...newPosts, ...posts];
      }
      localStorage.setItem(DATA_VERSION_KEY, DATA_VERSION);
      localStorage.setItem(KEYS.posts, JSON.stringify(posts));
    }

    // Load current user (default anonymous state, but will try to refresh via API)
    try { currentUser = JSON.parse(localStorage.getItem(KEYS.user)); }
    catch (e) { currentUser = null; }
    if (!currentUser) {
      currentUser = { id: null, nickname: "Not Logged In", avatarLetter: "N", avatarColor: "#555" };
    }

    // Load follows
    try { follows = new Set(JSON.parse(localStorage.getItem(KEYS.follows)) || []); }
    catch (e) { follows = new Set(); }

    // Load messages
    try { messages = JSON.parse(localStorage.getItem(KEYS.messages)) || {}; }
    catch (e) { messages = {}; }

    // Load notifications
    try { notifications = JSON.parse(localStorage.getItem(KEYS.notifications)) || []; }
    catch (e) { notifications = []; }
  }

  // ===== Persistence =====
  function save() {
    localStorage.setItem(KEYS.posts, JSON.stringify(posts));
    localStorage.setItem(KEYS.user, JSON.stringify(currentUser));
    localStorage.setItem(KEYS.follows, JSON.stringify([...follows]));
    localStorage.setItem(KEYS.messages, JSON.stringify(messages));
    localStorage.setItem(KEYS.notifications, JSON.stringify(notifications));
  }

  // ===== Post Operations =====

  /** Add new post */
  function addPost(content, category, images) {
    const post = {
      id: "post_" + Date.now(),
      author: currentUser.nickname,
      authorId: currentUser.id,
      avatarLetter: currentUser.avatarLetter,
      timestamp: Date.now(),
      content, category: category || "all",
      images: images || [],
      likes: 0, liked: false, collected: false, comments: []
    };
    posts.unshift(post);
    save();
    return post;
  }

  /** Toggle like */
  function toggleLike(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    post.liked = !post.liked;
    post.likes = (post.likes || 0) + (post.liked ? 1 : -1);
    save();
  }

  /** Toggle collect */
  function toggleCollect(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    post.collected = !post.collected;
    save();
  }

  /** Add comment (supports reply) */
  function addComment(postId, text, replyTo) {
    const post = posts.find(p => p.id === postId);
    if (!post) return null;
    const comment = {
      id: "cmt_" + Date.now(),
      author: currentUser.nickname,
      authorId: currentUser.id,
      text,
      timestamp: Date.now(),
      replyTo: replyTo || null  // { id, author, authorId }
    };
    post.comments.push(comment);
    // Generate reply notification
    if (replyTo && replyTo.authorId !== currentUser.id) {
      addNotification("reply", `${currentUser.nickname} replied to you: ${text.slice(0, 20)}`, postId);
    }
    save();
    return comment;
  }

  // ===== Follow Operations =====

  /** Fetch my following list from API */
  async function fetchFollowingFromApi() {
    try {
      const res = await fetch("https://api.szsummer.com/api/users/me", { credentials: "include" });
      if (!res.ok) return [];
      const user = await res.json();
      const userId = user.userId || user.id;
      if (!userId) return [];

      const followRes = await fetch(`https://api.szsummer.com/api/users/${userId}/following`, { credentials: "include" });
      if (!followRes.ok) return [];
      const followingList = await followRes.json();

      // Update local follow set
      follows = new Set(followingList.map(u => u.userId || u.id));
      save();
      return followingList;
    } catch (e) {
      console.warn("fetchFollowingFromApi failed:", e);
      return [...follows];
    }
  }

  /** Toggle follow status, return new status (calls backend API) */
  async function toggleFollow(authorId) {
    try {
      const res = await fetch(`https://api.szsummer.com/api/users/${authorId}/follow`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        follows.add(authorId);
        save();
        return true;
      } else if (res.status === 400) {
        // Already following, try to unfollow
        return await unfollowUser(authorId);
      }
    } catch (e) {
      console.warn("toggleFollow API failed, using local:", e);
    }
    // Fallback to local operation
    if (follows.has(authorId)) {
      follows.delete(authorId);
    } else {
      follows.add(authorId);
    }
    save();
    return follows.has(authorId);
  }

  /** Unfollow user */
  async function unfollowUser(authorId) {
    try {
      const res = await fetch(`https://api.szsummer.com/api/users/${authorId}/follow`, {
        method: "DELETE",
        credentials: "include"
      });
      if (res.ok) {
        follows.delete(authorId);
        save();
        return true;
      }
    } catch (e) {
      console.warn("unfollowUser API failed:", e);
    }
    follows.delete(authorId);
    save();
    return false;
  }

  /** Is following (prefer local cache) */
  function isFollowing(authorId) {
    return follows.has(authorId);
  }

  // ===== Message Operations =====

  /** Get or create message thread */
  function getOrCreateThread(withUser) {
    const threadId = "thread_" + withUser.id;
    if (!messages[threadId]) {
      messages[threadId] = { threadId, withUser, messages: [] };
    }
    return messages[threadId];
  }

  /** Send message */
  function sendMessage(toUserId, toNickname, toAvatarLetter, text, type) {
    const withUser = { id: toUserId, nickname: toNickname, avatarLetter: toAvatarLetter };
    const thread = getOrCreateThread(withUser);
    thread.messages.push({
      id: "msg_" + Date.now(),
      from: currentUser.id,
      text,
      timestamp: Date.now(),
      type: type || "text"
    });
    save();
    return thread;
  }

  /** Get message thread */
  function getThread(toUserId) {
    return messages["thread_" + toUserId] || null;
  }

  // ===== Notification Operations =====

  /** Add notification */
  function addNotification(type, content, postId) {
    notifications.unshift({
      id: "notif_" + Date.now(),
      type, content, postId,
      timestamp: Date.now(),
      read: false
    });
    save();
  }

  /** Mark all notifications as read */
  function markAllRead(type) {
    notifications.forEach(n => {
      if (!type || n.type === type) n.read = true;
    });
    save();
  }

  /** Unread notification count */
  function unreadCount(type) {
    return notifications.filter(n => !n.read && (!type || n.type === type)).length;
  }

  // ===== User Settings =====

  /** Update current user info */
  function updateUser(fields) {
    Object.assign(currentUser, fields);
    save();
  }

  // ===== Queries =====

  /** Filter posts by category + keyword */
  function getFilteredPosts(category, query) {
    let result = [...posts].sort((a, b) => b.timestamp - a.timestamp);
    if (category && category !== "all") {
      result = result.filter(p => p.category === category);
    }
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(p =>
          p.content.toLowerCase().includes(q) || p.author.toLowerCase().includes(q)
      );
    }
    return result;
  }

  /** Search posts using ES */
  async function searchPostsWithES(keyword, category) {
    try {
      // Call backend ES API
      const response = await fetch(`https://api.szsummer.com/api/treeholes/search?keyword=${encodeURIComponent(keyword)}&category=${encodeURIComponent(category || 'all')}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Convert to frontend format
        return data.map(item => ({
          id: item.id,
          author: item.author || 'Anonymous User',
          authorId: item.authorId || 'anonymous',
          avatarLetter: item.avatarLetter || 'A',
          timestamp: item.timestamp || Date.now(),
          content: item.content || '',
          category: item.category || 'all',
          images: item.images || [],
          likes: item.likes || 0,
          liked: item.liked || false,
          collected: item.collected || false,
          comments: item.comments || []
        }));
      } else {
        // API call failed, use local search
        console.warn('ES API call failed, using local search');
        return getFilteredPosts(category, keyword);
      }
    } catch (error) {
      // Network error, use local search
      console.warn('Network error, using local search:', error);
      return getFilteredPosts(category, keyword);
    }
  }

  /** Find post by id */
  function getPost(id) {
    return posts.find(p => p.id === id) || null;
  }

  /** Get followed user info (extracted from posts) */
  function getFollowedUsers() {
    const result = [];
    const seen = new Set();
    for (const id of follows) {
      if (seen.has(id)) continue;
      seen.add(id);
      const userPosts = posts.filter(p => p.authorId === id);
      if (userPosts.length > 0) {
        const p = userPosts[0];
        result.push({ id, nickname: p.author, avatarLetter: p.avatarLetter || "A", postCount: userPosts.length });
      } else {
        result.push({ id, nickname: "Anonymous User", avatarLetter: "A", postCount: 0 });
      }
    }
    return result;
  }

  /** Get collected posts */
  function getCollectedPosts() {
    return posts.filter(p => p.collected);
  }

  /** Fetch all posts from API */
  async function fetchPostsFromApi() {
    try {
      const res = await fetch("https://api.szsummer.com/api/treeholes/posts", { credentials: "include" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const apiPosts = await res.json();
      apiPosts.forEach(p => {
        p.id = p.id || p.postId || "post_" + p.id;
        p.author = p.author || "Anonymous User";
        p.authorId = p.authorId || p.userId || p.authorUuid || 'anonymous';
        p.avatarLetter = p.avatarLetter || (p.author ? p.author.substring(0, 1) : "A");
        p.avatarUrl = p.avatarUrl || null;
        p.images = p.imagesList || [];
        p.timestamp = p.createdAt ? new Date(p.createdAt).getTime() : Date.now();
        // Important: map API's likeCount to frontend's likes field
        p.likes = (p.likeCount !== undefined && p.likeCount !== null) ? p.likeCount : 0;
        p.liked = false;
        p.collected = false;
        p.comments = p.comments || [];
      });
      posts = apiPosts;
      save();
      return posts;
    } catch (e) {
      console.warn("fetchPostsFromApi failed, using local data:", e);
      // Use local data when API fails
      if (posts.length === 0) {
        posts = getMockPosts();
        save();
      }
      return posts;
    }
  }

  /** Fetch single post details from API */
  async function fetchPostFromApi(postId) {
    try {
      const res = await fetch("https://api.szsummer.com/api/treeholes/posts/" + postId, { credentials: "include" });
      if (!res.ok) return null;
      const p = await res.json();
      p.id = p.id || p.postId || "post_" + p.id;
      p.author = p.author || "";
      p.authorId = p.authorId || p.userId || p.authorUuid || 'anonymous';
      p.avatarLetter = p.avatarLetter || (p.author ? p.author.substring(0, 1) : "");
      p.avatarUrl = p.avatarUrl || null;
      p.images = p.imagesList || [];
      p.timestamp = p.createdAt ? new Date(p.createdAt).getTime() : Date.now();
      // Important: map API's likeCount to frontend's likes field
      p.likes = (p.likeCount !== undefined && p.likeCount !== null) ? p.likeCount : 0;
      p.liked = false;
      p.collected = false;
      const idx = posts.findIndex(x => String(x.id) === String(postId));
      if (idx >= 0) posts[idx] = p;
      else posts.unshift(p);
      save();
      return p;
    } catch (e) {
      console.warn("fetchPostFromApi failed:", e);
      return getPost(postId);
    }
  }

  /** Fetch post comments from API */
  async function fetchCommentsFromApi(postId) {
    try {
      const res = await fetch("https://api.szsummer.com/api/treeholes/posts/" + postId, { credentials: "include" });
      if (!res.ok) return [];
      const data = await res.json();
      return data.comments || [];
    } catch (e) {
      console.warn("fetchCommentsFromApi failed:", e);
      return [];
    }
  }

  /**
   * Enrich comment list with user info (recursively processes children)
   * @param {Array} comments comment array
   */
  async function enrichCommentsWithUserInfo(comments) {
    if (!comments || !comments.length) return [];
    
    // Recursive processing function
    const processComments = (list) => {
      list.forEach(c => {
        // Ensure id is a string
        c.id = String(c.id || c.commentId);
        
        // If userId exists but no author name, could supplement here (but backend buildCommentTreeWithUser should already do this)
        // Mainly ensure avatar (UUID) exists, if backend didn't return, we can map via c.userId or c.authorId
        
        if (c.children && c.children.length) {
          processComments(c.children);
        }
      });
    };

    processComments(comments);
    return comments;
  }

  // ===== Public API =====
  return {
    init, save,
    get posts() { return posts; },
    get currentUser() { return currentUser; },
    get notifications() { return notifications; },
    get messages() { return messages; },
    addPost, toggleLike, toggleCollect, addComment,
    toggleFollow, unfollowUser, isFollowing, fetchFollowingFromApi,
    sendMessage, getThread, getOrCreateThread,
    addNotification, markAllRead, unreadCount,
    updateUser,
    getFilteredPosts, getPost, searchPostsWithES,
    getFollowedUsers, getCollectedPosts,
    fetchPostsFromApi, fetchPostFromApi, fetchCommentsFromApi, enrichCommentsWithUserInfo
  };
})();
