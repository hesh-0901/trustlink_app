import { db } from "./firebase-init.js";

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ===============================
   SESSION CHECK
================================= */
const userId =
  localStorage.getItem("userId") ||
  sessionStorage.getItem("userId");

const role =
  localStorage.getItem("role") ||
  sessionStorage.getItem("role");

if (!userId) {
  window.location.href = "/trustlink_app/index.html";
}

/* ===============================
   DOM ELEMENTS
================================= */
const trustScoreEl = document.getElementById("trustScore");
const trustLevelEl = document.getElementById("trustLevel");
const totalVolumeEl = document.getElementById("totalVolume");
const totalTxEl = document.getElementById("totalTx");
const badgesContainer = document.getElementById("badgesContainer");
const adminSection = document.getElementById("adminSection");
const adminData = document.getElementById("adminData");
const profilePhoto = document.getElementById("profilePhoto");
const canvas = document.getElementById("predictionChart");

/* ===============================
   INIT
================================= */
init();

/* ===============================
   MAIN INIT FUNCTION
================================= */
async function init() {

  await loadUserProfile();
  await loadAlgoData();

}

/* ===============================
   LOAD USER PHOTO
================================= */
async function loadUserProfile() {

  try {

    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return;

    const userData = userSnap.data();

    if (profilePhoto && userData.avatarImage) {
      profilePhoto.src =
        "/trustlink_app/assets/avatars/" +
        userData.avatarImage;
    }

  } catch (err) {
    console.error("Profile load error:", err);
  }

}

/* ===============================
   LOAD & CALCULATE ALGO
================================= */
async function loadAlgoData() {

  try {

    const q = query(
      collection(db, "transactions"),
      where("participants", "array-contains", userId)
    );

    const snapshot = await getDocs(q);

    let totalVolume = 0;
    let completed = 0;
    let pending = 0;

    snapshot.forEach(docSnap => {
      const tx = docSnap.data();

      totalVolume += tx.amount;

      if (tx.status === "completed") completed++;
      if (tx.status === "pending") pending++;
    });

    const totalTx = snapshot.size;
    const successRate =
      totalTx > 0 ? completed / totalTx : 0;

    /* ===============================
       ADVANCED WEIGHTED ALGORITHM
    ================================= */

    const volumeWeight =
      Math.min(totalVolume / 5000, 1) * 30;

    const successWeight =
      successRate * 40;

    const activityWeight =
      Math.min(totalTx / 50, 1) * 20;

    const riskPenalty =
      pending * 2;

    let score = Math.round(
      volumeWeight +
      successWeight +
      activityWeight -
      riskPenalty
    );

    score = Math.max(0, Math.min(100, score));

    /* ===============================
       UI UPDATE
    ================================= */

    animateScore(score);
    updateStats(totalVolume, totalTx);
    generateBadges(score, totalVolume, totalTx);
    generatePredictionGraph(score);

    /* ===============================
       ADMIN SECRET LAYER
    ================================= */

    if (role === "admin" || role === "super_admin") {

      adminSection.classList.remove("hidden");

      adminData.innerHTML = `
        Risk Index : ${100 - score}% <br>
        Pending Transactions : ${pending} <br>
        Volume Total : ${totalVolume.toFixed(2)} <br>
        Success Rate : ${(successRate * 100).toFixed(1)}%
      `;

    }

  } catch (error) {

    console.error("Algo load error:", error);

  }

}

/* ===============================
   SCORE ANIMATION
================================= */
function animateScore(score) {

  let current = 0;

  const interval = setInterval(() => {

    current++;

    trustScoreEl.textContent = current;

    if (current >= score)
      clearInterval(interval);

  }, 15);

  trustLevelEl.textContent =
    score > 80 ? "Elite"
    : score > 60 ? "Gold"
    : score > 40 ? "Standard"
    : "Risk";

}

/* ===============================
   UPDATE MINI STATS
================================= */
function updateStats(volume, tx) {

  if (totalVolumeEl)
    totalVolumeEl.textContent =
      volume.toFixed(2);

  if (totalTxEl)
    totalTxEl.textContent =
      tx;

}

/* ===============================
   BADGES SYSTEM
================================= */
function generateBadges(score, volume, tx) {

  badgesContainer.innerHTML = "";

  if (score > 80)
    addBadge("Trusted Elite");

  if (volume > 2000)
    addBadge("High Volume");

  if (tx > 30)
    addBadge("Active User");

  if (score < 40)
    addBadge("Risk Watch");

}

function addBadge(text) {

  const span = document.createElement("span");
  span.className =
    "px-3 py-1 rounded-full text-xs bg-gradient-to-r from-indigo-500 to-purple-600 text-white";

  span.textContent = text;

  badgesContainer.appendChild(span);

}

/* ===============================
   PREDICTION GRAPH (30 DAYS)
================================= */
function generatePredictionGraph(score) {

  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  const days = 30;
  const data = [];

  let base = score;

  for (let i = 0; i < days; i++) {

    base += (Math.random() - 0.4) * 5;
    base = Math.max(0, Math.min(100, base));

    data.push(base);
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.beginPath();
  ctx.strokeStyle = "#3D4BFF";
  ctx.lineWidth = 2;

  data.forEach((val, i) => {

    const x =
      (canvas.width / days) * i;

    const y =
      canvas.height -
      (val / 100) * canvas.height;

    if (i === 0)
      ctx.moveTo(x, y);
    else
      ctx.lineTo(x, y);

  });

  ctx.stroke();

}
