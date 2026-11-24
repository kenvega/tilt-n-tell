"use strict";

/* =====================================================================
   Settings (tweak these to change how the game feels)
   ===================================================================== */

const DURATION_OPTIONS = [
  { seconds: 60, label: "1 min" },
  { seconds: 90, label: "1:30" },
  { seconds: 120, label: "2 min" },
];
const DEFAULT_DURATION = 60;

// Tilt is measured as how much the screen faces up (+1) or down (-1).
// 0 = screen vertical (phone on the forehead). sin(37°) ≈ 0.6.
const TILT_TRIGGER = 0.6;      // how far to tilt to count as correct / pass (~37°)
const TILT_NEUTRAL = 0.3;      // must come back within this (~17°) before the next tilt
const SMOOTHING = 0.35;        // 0..1, lower = smoother but slower sensor readings

const POSITION_HOLD_MS = 700;  // how long the phone must stay on the forehead before countdown
const COUNTDOWN_SECONDS = 3;
const FEEDBACK_MIN_MS = 700;   // minimum time the green/orange screen is shown
const TIMEUP_SCREEN_MS = 1800; // how long "¡Tiempo!" is shown before the results
const LAST_SECONDS_TICK = 5;   // soft tick sound during the last N seconds
const SENSOR_TIMEOUT_MS = 2000;
const LOOP_MS = 50;

/* =====================================================================
   DOM
   ===================================================================== */

const $ = (sel) => document.querySelector(sel);

const els = {
  screens: document.querySelectorAll(".screen"),
  soundToggle: $("#sound-toggle"),
  durationOptions: $("#duration-options"),
  categoryGrid: $("#category-grid"),
  howtoOk: $("#howto-ok"),
  permissionOk: $("#permission-ok"),
  blockedTitle: $("#blocked-title"),
  blockedMessage: $("#blocked-message"),
  blockedHint: $("#blocked-hint"),
  blockedRetry: $("#blocked-retry"),
  stage: $("#game-stage"),
  timer: $("#game-timer"),
  score: $("#game-score"),
  word: $("#game-word"),
  sub: $("#game-sub"),
  quit: $("#game-quit"),
  resultsCategory: $("#results-category"),
  resultsScore: $("#results-score"),
  correctCount: $("#correct-count"),
  correctList: $("#correct-list"),
  passedCount: $("#passed-count"),
  passedList: $("#passed-list"),
  playAgain: $("#play-again"),
};

function showScreen(name) {
  els.screens.forEach((s) => s.classList.toggle("active", s.id === `screen-${name}`));
  window.scrollTo(0, 0);
}

/* =====================================================================
   Saved preferences (only sound on/off and round duration)
   ===================================================================== */

function storageGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function storageSet(key, value) {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
}

const settings = {
  sound: storageGet("tnt.sound") !== "off",
  duration: Number(storageGet("tnt.duration")) || DEFAULT_DURATION,
};
if (!DURATION_OPTIONS.some((o) => o.seconds === settings.duration)) {
  settings.duration = DEFAULT_DURATION;
}

/* =====================================================================
   Sound (Web Audio beeps, no audio files needed)
   ===================================================================== */

let audioCtx = null;

// Must be called from a tap so iPhone allows audio.
function unlockAudio() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  if (!audioCtx) audioCtx = new Ctx();
  if (audioCtx.state === "suspended") audioCtx.resume();
}

function tone(freq, durMs, { type = "sine", volume = 0.25, delayMs = 0, slideTo = null } = {}) {
  if (!settings.sound || !audioCtx) return;
  const start = audioCtx.currentTime + delayMs / 1000;
  const end = start + durMs / 1000;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, end);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(start);
  osc.stop(end + 0.05);
}

const sounds = {
  correct() { tone(880, 110); tone(1320, 180, { delayMs: 100 }); },
  pass() { tone(440, 260, { type: "triangle", slideTo: 260 }); },
  count() { tone(660, 120); },
  go() { tone(990, 260); },
  tick() { tone(1200, 50, { volume: 0.1 }); },
  timeUp() { tone(220, 700, { type: "sawtooth", volume: 0.15 }); },
};

function renderSoundToggle() {
  els.soundToggle.textContent = settings.sound ? "🔊" : "🔇";
  els.soundToggle.setAttribute("aria-label", settings.sound ? "Sonido activado" : "Sonido desactivado");
  els.soundToggle.setAttribute("aria-pressed", String(settings.sound));
}

els.soundToggle.addEventListener("click", () => {
  settings.sound = !settings.sound;
  storageSet("tnt.sound", settings.sound ? "on" : "off");
  renderSoundToggle();
  if (settings.sound) { unlockAudio(); sounds.correct(); }
});

/* =====================================================================
   Motion sensor
   ===================================================================== */

const DEG = Math.PI / 180;

const motion = {
  ready: false,      // permission granted and data confirmed
  listening: false,
  hasData: false,
  z: 0,              // screen facing: +1 up (ceiling), -1 down (floor), 0 vertical
  x: 0,              // phone's right edge: +1 pointing up, -1 pointing down
  waiters: [],
};

// iPhone (iOS 13+) requires asking permission from a tap.
const needsIOSPermission =
  typeof DeviceOrientationEvent !== "undefined" &&
  typeof DeviceOrientationEvent.requestPermission === "function";

function onDeviceOrientation(e) {
  if (e.beta == null || e.gamma == null) return;
  const b = e.beta * DEG;
  const g = e.gamma * DEG;
  // Vertical (world "up") component of the screen normal and of the
  // phone's x axis, derived from the rotation matrix. This avoids the
  // jumps that raw beta/gamma have when the phone is held vertically.
  const z = Math.cos(b) * Math.cos(g);
  const x = -Math.cos(b) * Math.sin(g);
  if (!motion.hasData) {
    motion.z = z;
    motion.x = x;
    motion.hasData = true;
    motion.waiters.splice(0).forEach((resolve) => resolve(true));
  } else {
    motion.z += (z - motion.z) * SMOOTHING;
    motion.x += (x - motion.x) * SMOOTHING;
  }
}

function listenToMotion() {
  if (motion.listening) return;
  window.addEventListener("deviceorientation", onDeviceOrientation);
  motion.listening = true;
}

function waitForSensorData(timeoutMs) {
  return new Promise((resolve) => {
    if (motion.hasData) return resolve(true);
    motion.waiters.push(resolve);
    setTimeout(() => resolve(false), timeoutMs);
  });
}

/* =====================================================================
   Start flow: how-to -> (iPhone permission) -> sensor check -> game
   ===================================================================== */

let selectedCategory = null;
let howtoSeen = false;
let blockedReason = null;

const BLOCKED_TEXTS = {
  denied: {
    title: "Sin permiso no podemos jugar",
    message: "El juego necesita acceso al movimiento del teléfono para saber cuándo lo inclinas. Toca «Intentar de nuevo» y elige «Permitir».",
    hint: "Si la ventana del permiso no aparece, cierra esta pestaña y vuelve a abrir el juego.",
  },
  nosensor: {
    title: "No detectamos el movimiento",
    message: "Este dispositivo no está enviando datos de movimiento. Para jugar necesitas un teléfono con giroscopio.",
    hint: "",
  },
  insecure: {
    title: "Conexión no segura",
    message: "El navegador solo permite usar el movimiento del teléfono en páginas seguras.",
    hint: "Abre el juego desde una dirección que empiece con https://",
  },
};

function showBlocked(reason) {
  blockedReason = reason;
  const t = BLOCKED_TEXTS[reason];
  els.blockedTitle.textContent = t.title;
  els.blockedMessage.textContent = t.message;
  els.blockedHint.textContent = t.hint;
  showScreen("blocked");
}

function onCategoryChosen(category) {
  unlockAudio();
  selectedCategory = category;
  if (!howtoSeen) {
    showScreen("howto");
  } else {
    proceedToMotion();
  }
}

function proceedToMotion() {
  if (motion.ready) return startGame();
  if (!window.isSecureContext) return showBlocked("insecure");
  if (typeof DeviceOrientationEvent === "undefined") return showBlocked("nosensor");
  if (needsIOSPermission) return showScreen("permission");
  checkSensorAndStart();
}

// Must run directly inside a tap handler (iPhone requirement).
function requestIOSPermission() {
  let request;
  try {
    request = DeviceOrientationEvent.requestPermission();
  } catch {
    showBlocked("denied");
    return;
  }
  Promise.resolve(request)
    .then((state) => (state === "granted" ? checkSensorAndStart() : showBlocked("denied")))
    .catch(() => showBlocked("denied"));
}

async function checkSensorAndStart() {
  listenToMotion();
  const ok = await waitForSensorData(SENSOR_TIMEOUT_MS);
  if (!ok) return showBlocked("nosensor");
  motion.ready = true;
  startGame();
}

els.howtoOk.addEventListener("click", () => {
  howtoSeen = true;
  proceedToMotion();
});

els.permissionOk.addEventListener("click", requestIOSPermission);

els.blockedRetry.addEventListener("click", () => {
  if (blockedReason !== "insecure" && needsIOSPermission) return requestIOSPermission();
  proceedToMotion();
});

document.querySelectorAll(".js-back-home").forEach((btn) =>
  btn.addEventListener("click", () => showScreen("home"))
);

/* =====================================================================
   Screen wake lock (keeps the screen on during a round)
   ===================================================================== */

let wakeLock = null;

async function requestWakeLock() {
  try {
    if ("wakeLock" in navigator) wakeLock = await navigator.wakeLock.request("screen");
  } catch { /* not critical */ }
}

function releaseWakeLock() {
  if (wakeLock) wakeLock.release().catch(() => {});
  wakeLock = null;
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && game) requestWakeLock();
});

/* =====================================================================
   Game
   ===================================================================== */

// Phases: "position" -> "countdown" -> "playing" <-> "feedback" -> "timeup"
let game = null;

function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTime(totalSeconds) {
  const s = Math.max(0, Math.ceil(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function startGame() {
  stopGame();
  game = {
    category: selectedCategory,
    deck: shuffle(selectedCategory.words),
    deckIndex: 0,
    phase: "position",
    phaseStartedAt: performance.now(),
    positionSince: 0,
    baselineSamples: [],
    baseline: 0,
    rotation: 0,
    endsAt: 0,
    currentWord: null,
    armed: false,
    lastCountNumber: null,
    lastTickSecond: null,
    correct: [],
    passed: [],
    loop: null,
  };
  showScreen("game");
  setStageState(null);
  setStageRotation(0);
  els.timer.textContent = formatTime(settings.duration);
  els.score.textContent = "★ 0";
  setMain("Ponlo en tu frente", "De lado, con la pantalla hacia tus amigos");
  requestWakeLock();
  game.loop = setInterval(gameLoop, LOOP_MS);
}

function stopGame() {
  if (game && game.loop) clearInterval(game.loop);
  game = null;
  releaseWakeLock();
}

function setMain(word, sub = "") {
  els.word.textContent = word;
  els.sub.textContent = sub;
  fitWord();
}

function setStageState(state) {
  els.stage.classList.toggle("is-correct", state === "correct");
  els.stage.classList.toggle("is-pass", state === "pass");
  els.stage.classList.toggle("is-timeup", state === "timeup");
}

// 1 = rotate clockwise, -1 = counter-clockwise, 0 = none
function setStageRotation(dir) {
  if (game) game.rotation = dir;
  els.stage.classList.toggle("rot-cw", dir === 1);
  els.stage.classList.toggle("rot-ccw", dir === -1);
  fitWord();
}

// Shrink the word until it fits its box.
function fitWord() {
  const el = els.word;
  const box = el.parentElement;
  if (!el.textContent || !box.clientWidth) return;
  let size = Math.max(32, Math.min(box.clientHeight * 0.6, box.clientWidth * 0.2));
  el.style.fontSize = `${size}px`;
  while (size > 20 && (el.scrollWidth > box.clientWidth || el.scrollHeight > box.clientHeight)) {
    size -= 4;
    el.style.fontSize = `${size}px`;
  }
}

window.addEventListener("resize", fitWord);

function isOnForehead() {
  return Math.abs(motion.x) > 0.75 && Math.abs(motion.z) < 0.45;
}

function leftForehead() {
  return Math.abs(motion.x) < 0.5 || Math.abs(motion.z) > 0.6;
}

function setPhase(phase) {
  game.phase = phase;
  game.phaseStartedAt = performance.now();
}

function gameLoop() {
  if (!game) return;
  const now = performance.now();

  switch (game.phase) {
    case "position": {
      // Follow the phone so the text reads correctly for the friends.
      const dir = motion.x > 0.6 ? 1 : motion.x < -0.6 ? -1 : 0;
      if (dir !== game.rotation) setStageRotation(dir);

      if (isOnForehead()) {
        if (!game.positionSince) game.positionSince = now;
        if (now - game.positionSince >= POSITION_HOLD_MS) beginCountdown();
      } else {
        game.positionSince = 0;
      }
      break;
    }

    case "countdown": {
      if (leftForehead()) {
        setPhase("position");
        game.positionSince = 0;
        setMain("Ponlo en tu frente", "De lado, con la pantalla hacia tus amigos");
        break;
      }
      game.baselineSamples.push(motion.z);
      const elapsed = (now - game.phaseStartedAt) / 1000;
      const number = COUNTDOWN_SECONDS - Math.floor(elapsed);
      if (number <= 0) {
        beginPlaying();
      } else if (number !== game.lastCountNumber) {
        game.lastCountNumber = number;
        sounds.count();
        setMain(String(number), "¡Prepárate!");
      }
      break;
    }

    case "playing":
    case "feedback": {
      const remaining = (game.endsAt - now) / 1000;
      els.timer.textContent = formatTime(remaining);

      if (remaining <= 0) {
        timeUp();
        break;
      }

      const sec = Math.ceil(remaining);
      if (sec <= LAST_SECONDS_TICK && sec !== game.lastTickSecond) {
        game.lastTickSecond = sec;
        sounds.tick();
      }

      const rel = motion.z - game.baseline;

      if (game.phase === "playing") {
        if (!game.armed) {
          if (Math.abs(rel) < TILT_NEUTRAL) game.armed = true;
        } else if (rel < -TILT_TRIGGER) {
          answer("correct");
        } else if (rel > TILT_TRIGGER) {
          answer("pass");
        }
      } else if (now - game.phaseStartedAt >= FEEDBACK_MIN_MS && Math.abs(rel) < TILT_NEUTRAL) {
        // Back to neutral after the feedback: show the next word.
        setStageState(null);
        setPhase("playing");
        game.armed = true;
        nextWord();
      }
      break;
    }
  }
}

function beginCountdown() {
  setPhase("countdown");
  game.baselineSamples = [];
  game.lastCountNumber = null;
}

function beginPlaying() {
  const samples = game.baselineSamples;
  const avg = samples.length ? samples.reduce((a, b) => a + b, 0) / samples.length : 0;
  game.baseline = Math.max(-0.35, Math.min(0.35, avg));
  game.endsAt = performance.now() + settings.duration * 1000;
  game.armed = false;
  sounds.go();
  setPhase("playing");
  nextWord();
}

function nextWord() {
  if (game.deckIndex >= game.deck.length) {
    game.deck = shuffle(game.category.words);
    game.deckIndex = 0;
  }
  game.currentWord = game.deck[game.deckIndex++];
  setMain(game.currentWord, "");
}

function answer(result) {
  if (result === "correct") {
    game.correct.push(game.currentWord);
    els.score.textContent = `★ ${game.correct.length}`;
    sounds.correct();
    setStageState("correct");
    setMain("¡Correcto!", game.currentWord);
  } else {
    game.passed.push(game.currentWord);
    sounds.pass();
    setStageState("pass");
    setMain("Paso", game.currentWord);
  }
  game.currentWord = null;
  setPhase("feedback");
}

function timeUp() {
  if (game.currentWord) game.passed.push(game.currentWord);
  game.currentWord = null;
  els.timer.textContent = "0:00";
  setPhase("timeup");
  sounds.timeUp();
  setStageState("timeup");
  setMain("¡Tiempo!", "");
  const finished = game;
  setTimeout(() => {
    if (game === finished) showResults(finished);
  }, TIMEUP_SCREEN_MS);
}

function showResults(finished) {
  stopGame();
  const n = finished.correct.length;
  els.resultsCategory.textContent = `${finished.category.emoji} ${finished.category.name}`;
  els.resultsScore.textContent = n === 1 ? "1 punto" : `${n} puntos`;
  els.correctCount.textContent = `(${finished.correct.length})`;
  els.passedCount.textContent = `(${finished.passed.length})`;
  fillList(els.correctList, finished.correct);
  fillList(els.passedList, finished.passed);
  showScreen("results");
}

function fillList(ul, words) {
  ul.replaceChildren();
  if (!words.length) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "Ninguna";
    ul.append(li);
    return;
  }
  for (const w of words) {
    const li = document.createElement("li");
    li.textContent = w;
    ul.append(li);
  }
}

els.quit.addEventListener("click", () => {
  stopGame();
  showScreen("home");
});

els.playAgain.addEventListener("click", () => {
  unlockAudio();
  proceedToMotion();
});

/* =====================================================================
   Home screen
   ===================================================================== */

function renderDurations() {
  els.durationOptions.replaceChildren();
  for (const opt of DURATION_OPTIONS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = opt.label;
    btn.setAttribute("aria-pressed", String(opt.seconds === settings.duration));
    btn.addEventListener("click", () => {
      settings.duration = opt.seconds;
      storageSet("tnt.duration", String(opt.seconds));
      renderDurations();
    });
    els.durationOptions.append(btn);
  }
}

function renderCategories() {
  els.categoryGrid.replaceChildren();
  for (const cat of CATEGORIES) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "category-card";
    const emoji = document.createElement("span");
    emoji.className = "emoji";
    emoji.textContent = cat.emoji;
    const name = document.createElement("span");
    name.className = "name";
    name.textContent = cat.name;
    const count = document.createElement("span");
    count.className = "count";
    count.textContent = `${cat.words.length} palabras`;
    btn.append(emoji, name, count);
    btn.addEventListener("click", () => onCategoryChosen(cat));
    els.categoryGrid.append(btn);
  }
}

renderSoundToggle();
renderDurations();
renderCategories();
