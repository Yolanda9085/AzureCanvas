// pet.js — Treehole Pet 3D Module (Three.js r128)
(function () {
  'use strict';

  // ===== State =====
  const STATE_KEY = 'th_pet_state';
  function loadState() {
    try { return JSON.parse(localStorage.getItem(STATE_KEY) || 'null'); } catch { return null; }
  }
  function saveState() {
    localStorage.setItem(STATE_KEY, JSON.stringify(petState));
  }

  const DEFAULT_STATE = { type: 'cat', name: 'Little Orange', hunger: 80, mood: 80, sleeping: false, lastSave: Date.now() };
  let petState = Object.assign({}, DEFAULT_STATE, loadState() || {});

  // decay since last visit
  const elapsed = Math.min((Date.now() - (petState.lastSave || Date.now())) / 1000, 3600);
  petState.hunger = Math.max(0, petState.hunger - elapsed * 0.005);
  petState.mood   = Math.max(0, petState.mood   - elapsed * 0.003);
  petState.lastSave = Date.now();
  saveState();

  // ===== DOM refs =====
  const canvas      = document.getElementById('petCanvas');
  const speechEl    = document.getElementById('petSpeech');
  const petNameEl   = document.getElementById('petName');
  const moodIconEl  = document.getElementById('petMoodIcon');
  const hungerIconEl= document.getElementById('petHungerIcon');
  const chatLog     = document.getElementById('petChatLog');
  const chatInput   = document.getElementById('petChatInput');
  const chatSend    = document.getElementById('petChatSend');
  const feedBtn     = document.getElementById('petFeedBtn');
  const playBtn     = document.getElementById('petPlayBtn');
  const sleepBtn    = document.getElementById('petSleepBtn');
  const catBtn      = document.getElementById('petCatBtn');
  const dogBtn      = document.getElementById('petDogBtn');

  if (!canvas) return;

  // ===== Three.js setup =====
  const W = 260, H = 200;
  canvas.width  = W;
  canvas.height = H;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.shadowMap.enabled = true;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
  camera.position.set(0, 1.2, 4.5);
  camera.lookAt(0, 0.5, 0);

  // lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
  dirLight.position.set(3, 5, 3);
  dirLight.castShadow = true;
  scene.add(dirLight);

  // ground
  const groundGeo  = new THREE.PlaneGeometry(6, 6);
  const groundMat  = new THREE.MeshLambertMaterial({ color: 0xf0f0f0 });
  const ground     = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // ===== Pet builder =====
  let petGroup = null;
  let tailBone = null;
  let earL = null, earR = null;

  function buildCat() {
    const g = new THREE.Group();
    const bodyColor = 0xf4a460;
    const bellyColor = 0xfff8f0;
    const mat  = (c) => new THREE.MeshLambertMaterial({ color: c });

    // body
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 12), mat(bodyColor));
    body.scale.set(1, 0.85, 0.9);
    body.position.y = 0.55;
    body.castShadow = true;
    g.add(body);

    // belly patch
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), mat(bellyColor));
    belly.scale.set(1, 0.7, 0.5);
    belly.position.set(0, 0.52, 0.42);
    g.add(belly);

    // head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), mat(bodyColor));
    head.position.set(0, 1.22, 0.1);
    head.castShadow = true;
    g.add(head);

    // ears
    const earGeo = new THREE.ConeGeometry(0.14, 0.28, 4);
    earL = new THREE.Mesh(earGeo, mat(bodyColor));
    earL.position.set(-0.25, 1.56, 0.1);
    earL.rotation.z = 0.2;
    g.add(earL);
    earR = new THREE.Mesh(earGeo, mat(bodyColor));
    earR.position.set(0.25, 1.56, 0.1);
    earR.rotation.z = -0.2;
    g.add(earR);

    // inner ears
    const innerEarGeo = new THREE.ConeGeometry(0.07, 0.16, 4);
    const innerMat = mat(0xffb6c1);
    const ieL = new THREE.Mesh(innerEarGeo, innerMat);
    ieL.position.set(-0.25, 1.56, 0.12);
    ieL.rotation.z = 0.2;
    g.add(ieL);
    const ieR = new THREE.Mesh(innerEarGeo, innerMat);
    ieR.position.set(0.25, 1.56, 0.12);
    ieR.rotation.z = -0.2;
    g.add(ieR);

    // eyes
    const eyeGeo = new THREE.SphereGeometry(0.07, 8, 8);
    const eyeMat = mat(0x222222);
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.15, 1.26, 0.38);
    g.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.15, 1.26, 0.38);
    g.add(eyeR);

    // eye shine
    const shineMat = mat(0xffffff);
    const shineGeo = new THREE.SphereGeometry(0.025, 6, 6);
    [eyeL, eyeR].forEach(eye => {
      const s = new THREE.Mesh(shineGeo, shineMat);
      s.position.copy(eye.position).addScalar(0.04);
      s.position.z += 0.04;
      g.add(s);
    });

    // nose
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), mat(0xff9999));
    nose.position.set(0, 1.18, 0.42);
    g.add(nose);

    // legs
    const legGeo = new THREE.CylinderGeometry(0.1, 0.09, 0.4, 8);
    [[-0.28, 0.2, 0.25], [0.28, 0.2, 0.25], [-0.28, 0.2, -0.2], [0.28, 0.2, -0.2]].forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(legGeo, mat(bodyColor));
      leg.position.set(x, y, z);
      leg.castShadow = true;
      g.add(leg);
    });

    // tail
    const tailPivot = new THREE.Group();
    tailPivot.position.set(0, 0.55, -0.5);
    const tailGeo = new THREE.CylinderGeometry(0.06, 0.03, 0.7, 8);
    const tail = new THREE.Mesh(tailGeo, mat(bodyColor));
    tail.position.set(0, 0.35, 0);
    tail.rotation.x = -0.6;
    tailPivot.add(tail);
    g.add(tailPivot);
    tailBone = tailPivot;

    return g;
  }

  function buildDog() {
    const g = new THREE.Group();
    const bodyColor = 0xc8a46e;
    const bellyColor = 0xf5e6d0;
    const mat = (c) => new THREE.MeshLambertMaterial({ color: c });

    // body — bigger/rounder than cat
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.62, 16, 12), mat(bodyColor));
    body.scale.set(1, 0.9, 1);
    body.position.y = 0.62;
    body.castShadow = true;
    g.add(body);

    // belly
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.36, 12, 10), mat(bellyColor));
    belly.scale.set(1, 0.7, 0.5);
    belly.position.set(0, 0.58, 0.48);
    g.add(belly);

    // head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.46, 16, 12), mat(bodyColor));
    head.position.set(0, 1.3, 0.12);
    head.castShadow = true;
    g.add(head);

    // snout
    const snout = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), mat(bellyColor));
    snout.scale.set(1, 0.7, 0.8);
    snout.position.set(0, 1.2, 0.5);
    g.add(snout);

    // floppy ears
    const earGeo = new THREE.SphereGeometry(0.22, 10, 8);
    earL = new THREE.Mesh(earGeo, mat(0xb8864e));
    earL.scale.set(0.6, 1.1, 0.3);
    earL.position.set(-0.42, 1.22, 0.0);
    g.add(earL);
    earR = new THREE.Mesh(earGeo, mat(0xb8864e));
    earR.scale.set(0.6, 1.1, 0.3);
    earR.position.set(0.42, 1.22, 0.0);
    g.add(earR);

    // eyes
    const eyeGeo = new THREE.SphereGeometry(0.075, 8, 8);
    const eyeMat = mat(0x1a1a1a);
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.16, 1.34, 0.42);
    g.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.16, 1.34, 0.42);
    g.add(eyeR);

    // shine
    const shineMat = mat(0xffffff);
    const shineGeo = new THREE.SphereGeometry(0.025, 6, 6);
    [eyeL, eyeR].forEach(eye => {
      const s = new THREE.Mesh(shineGeo, shineMat);
      s.position.copy(eye.position);
      s.position.z += 0.05;
      s.position.y += 0.03;
      g.add(s);
    });

    // nose
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), mat(0x222222));
    nose.position.set(0, 1.22, 0.62);
    g.add(nose);

    // legs
    const legGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.45, 8);
    [[-0.32, 0.22, 0.28], [0.32, 0.22, 0.28], [-0.32, 0.22, -0.22], [0.32, 0.22, -0.22]].forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(legGeo, mat(bodyColor));
      leg.position.set(x, y, z);
      leg.castShadow = true;
      g.add(leg);
    });

    // tail — short stubby
    const tailPivot = new THREE.Group();
    tailPivot.position.set(0, 0.7, -0.58);
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.04, 0.4, 8), mat(bodyColor));
    tail.position.set(0, 0.2, 0);
    tail.rotation.x = -0.8;
    tailPivot.add(tail);
    g.add(tailPivot);
    tailBone = tailPivot;

    return g;
  }

  function spawnPet() {
    if (petGroup) scene.remove(petGroup);
    tailBone = null; earL = null; earR = null;
    petGroup = petState.type === 'cat' ? buildCat() : buildDog();
    scene.add(petGroup);
  }
  spawnPet();

  // ===== Animation =====
  let clock = 0;
  let bobDir = 1;
  let petAnim = 'idle'; // idle | happy | sleep | eat
  let animTimer = 0;

  function animate() {
    requestAnimationFrame(animate);
    clock += 0.016;
    animTimer = Math.max(0, animTimer - 0.016);

    if (!petGroup) { renderer.render(scene, camera); return; }

    if (petState.sleeping) {
      petGroup.rotation.y = 0;
      petGroup.position.y = Math.sin(clock * 0.5) * 0.02;
      if (tailBone) tailBone.rotation.z = 0;
    } else if (petAnim === 'happy') {
      petGroup.rotation.y = Math.sin(clock * 6) * 0.4;
      petGroup.position.y = Math.abs(Math.sin(clock * 8)) * 0.15;
      if (tailBone) tailBone.rotation.z = Math.sin(clock * 10) * 0.6;
      if (animTimer <= 0) petAnim = 'idle';
    } else if (petAnim === 'eat') {
      petGroup.position.y = Math.sin(clock * 4) * 0.05;
      petGroup.rotation.y = Math.sin(clock * 2) * 0.1;
      if (tailBone) tailBone.rotation.z = Math.sin(clock * 5) * 0.3;
      if (animTimer <= 0) petAnim = 'idle';
    } else {
      // idle: gentle bob + slow look-around
      petGroup.position.y = Math.sin(clock * 1.2) * 0.04;
      petGroup.rotation.y = Math.sin(clock * 0.4) * 0.25;
      if (tailBone) tailBone.rotation.z = Math.sin(clock * 2) * 0.25;
      if (earL) earL.rotation.z = 0.2 + Math.sin(clock * 1.5) * 0.05;
      if (earR) earR.rotation.z = -0.2 - Math.sin(clock * 1.5) * 0.05;
    }

    renderer.render(scene, camera);
  }
  animate();

  // ===== UI helpers =====
  function moodEmoji(v) {
    if (v > 70) return '😊';
    if (v > 40) return '😐';
    return '😢';
  }
  function hungerEmoji(v) {
    if (v > 70) return '🍖';
    if (v > 40) return '🍗';
    return '😿';
  }

  function updateUI() {
    petNameEl.textContent = petState.name;
    moodIconEl.textContent  = moodEmoji(petState.mood);
    hungerIconEl.textContent = hungerEmoji(petState.hunger);
    sleepBtn.innerHTML = petState.sleeping
      ? '<i class="fas fa-sun"></i> Wake Up'
      : '<i class="fas fa-moon"></i> Rest';
  }
  updateUI();

  function showSpeech(text, duration = 2800) {
    speechEl.textContent = text;
    speechEl.classList.add('visible');
    clearTimeout(speechEl._timer);
    speechEl._timer = setTimeout(() => speechEl.classList.remove('visible'), duration);
  }

  function addChatMsg(from, text) {
    const div = document.createElement('div');
    div.className = 'pet-chat-msg pet-chat-msg-' + from;
    div.textContent = text;
    chatLog.appendChild(div);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  // ===== Pet responses =====
  const CAT_REPLIES = [
    'Meow~ How was your day?', 'Meow meow! I was sunbathing~', 'Purr purr… so comfortable',
    'Meow? What are you saying?', 'I want dried fish!', 'Play with me~', 'Meow! The weather is so nice today',
    'I just dreamed about a butterfly', 'Pet me~', 'Meow~ I\'m a bit sleepy'
  ];
  const DOG_REPLIES = [
    'Woof! You\'re back!', 'Woof woof! I\'m so happy!', 'I want to go out and play!', 'Woof~ How was your day?',
    'I just chased a squirrel!', 'Woof woof woof! Play with me!', 'I want bones!',
    'You\'re the best owner!', 'Woof! I love you!', 'I just took a nap, so comfortable~'
  ];

  function petReply(userMsg) {
    const replies = petState.type === 'cat' ? CAT_REPLIES : DOG_REPLIES;
    const lower = userMsg.toLowerCase();
    if (lower.includes('hungry') || lower.includes('eat') || lower.includes('饿') || lower.includes('吃') || lower.includes('food') || lower.includes('feed')) {
      return petState.type === 'cat' ? 'Meow! I\'m hungry too, feed me!' : 'Woof! I want to eat too!';
    }
    if (lower.includes('play') || lower.includes('game') || lower.includes('玩') || lower.includes('游戏') || lower.includes('fun')) {
      return petState.type === 'cat' ? 'Meow~ Let\'s play with yarn!' : 'Woof woof! I love playing!';
    }
    if (lower.includes('sleep') || lower.includes('tired') || lower.includes('睡') || lower.includes('困') || lower.includes('rest')) {
      return petState.type === 'cat' ? 'Purr purr… I want to sleep too~' : 'Woof~ I\'m a bit sleepy too';
    }
    if (lower.includes('love') || lower.includes('like') || lower.includes('爱') || lower.includes('喜欢') || lower.includes('cute')) {
      return petState.type === 'cat' ? 'Meow~ I like you too!' : 'Woof woof! I love you the most!';
    }
    if (lower.includes('sad') || lower.includes('upset') || lower.includes('难过') || lower.includes('伤心') || lower.includes('烦') || lower.includes('cry')) {
      return petState.type === 'cat' ? 'Meow~ Don\'t be sad, I\'m here with you' : 'Woof! I\'m here to keep you company! Don\'t be sad!';
    }
    return replies[Math.floor(Math.random() * replies.length)];
  }

  // ===== Action buttons =====
  feedBtn.addEventListener('click', () => {
    if (petState.sleeping) { showSpeech('Zzz… Sleeping, don\'t disturb~'); return; }
    petState.hunger = Math.min(100, petState.hunger + 25);
    petState.mood   = Math.min(100, petState.mood + 5);
    petAnim = 'eat'; animTimer = 2.5;
    const msg = petState.type === 'cat' ? 'Meow! So delicious! Thank you~' : 'Woof! Bones! My favorite!';
    showSpeech(msg);
    addChatMsg('pet', msg);
    updateUI(); saveState();
  });

  playBtn.addEventListener('click', () => {
    if (petState.sleeping) { showSpeech('Zzz… Sleeping, don\'t disturb~'); return; }
    petState.mood   = Math.min(100, petState.mood + 20);
    petState.hunger = Math.max(0, petState.hunger - 8);
    petAnim = 'happy'; animTimer = 3;
    const msg = petState.type === 'cat' ? 'Meow! So happy! Let\'s play more~' : 'Woof woof! So much fun!';
    showSpeech(msg);
    addChatMsg('pet', msg);
    updateUI(); saveState();
  });

  sleepBtn.addEventListener('click', () => {
    petState.sleeping = !petState.sleeping;
    if (petState.sleeping) {
      petAnim = 'idle';
      showSpeech('Zzz… Good night~');
      addChatMsg('pet', 'Zzz… Good night~');
    } else {
      petAnim = 'happy'; animTimer = 2;
      const msg = petState.type === 'cat' ? 'Meow! Woke up, feeling great~' : 'Woof! Slept well! Let\'s go play!';
      showSpeech(msg);
      addChatMsg('pet', msg);
    }
    updateUI(); saveState();
  });

  // ===== Type toggle =====
  catBtn.addEventListener('click', () => {
    if (petState.type === 'cat') return;
    petState.type = 'cat';
    petState.name = 'Little Orange';
    catBtn.classList.add('active');
    dogBtn.classList.remove('active');
    spawnPet();
    showSpeech('Meow! I\'m Little Orange, nice to meet you~');
    addChatMsg('pet', 'Meow! I\'m Little Orange, nice to meet you~');
    updateUI(); saveState();
  });

  dogBtn.addEventListener('click', () => {
    if (petState.type === 'dog') return;
    petState.type = 'dog';
    petState.name = 'Little Yellow';
    dogBtn.classList.add('active');
    catBtn.classList.remove('active');
    spawnPet();
    showSpeech('Woof! I\'m Little Yellow, let\'s be friends!');
    addChatMsg('pet', 'Woof! I\'m Little Yellow, let\'s be friends!');
    updateUI(); saveState();
  });

  // sync toggle buttons with saved state
  if (petState.type === 'dog') {
    dogBtn.classList.add('active');
    catBtn.classList.remove('active');
  }

  // ===== Chat =====
  function sendChat() {
    const text = chatInput.value.trim();
    if (!text) return;
    addChatMsg('user', text);
    chatInput.value = '';
    setTimeout(() => {
      const reply = petReply(text);
      addChatMsg('pet', reply);
      showSpeech(reply);
      petAnim = 'happy'; animTimer = 1.5;
      petState.mood = Math.min(100, petState.mood + 3);
      updateUI(); saveState();
    }, 600);
  }

  chatSend.addEventListener('click', sendChat);
  chatInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendChat(); });

  // ===== Periodic mood decay =====
  setInterval(() => {
    if (!petState.sleeping) {
      petState.hunger = Math.max(0, petState.hunger - 0.5);
      petState.mood   = Math.max(0, petState.mood   - 0.3);
    }
    updateUI(); saveState();
    // random idle speech
    if (!petState.sleeping && Math.random() < 0.15) {
      const idle = petState.type === 'cat'
        ? ['Meow~', 'Purr purr…', 'Meow?', 'I want to sunbathe~']
        : ['Woof!', 'Woof woof~', 'Woof?', 'I want to go out and play!'];
      showSpeech(idle[Math.floor(Math.random() * idle.length)]);
    }
  }, 30000);

  // initial greeting
  setTimeout(() => {
    const greet = petState.type === 'cat' ? `Meow! ${petState.name} is here~` : `Woof! ${petState.name} is here!`;
    showSpeech(greet);
    addChatMsg('pet', greet);
  }, 800);

})();
