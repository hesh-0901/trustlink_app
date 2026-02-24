import { db } from "./firebase-init.js";
import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const userId =
  localStorage.getItem("userId") ||
  sessionStorage.getItem("userId");

const role =
  localStorage.getItem("role") ||
  sessionStorage.getItem("role");

if (!userId)
  window.location.href = "/trustlink_app/index.html";

const trustScoreEl = document.getElementById("trustScore");
const trustLevelEl = document.getElementById("trustLevel");
const badgesContainer = document.getElementById("badgesContainer");
const adminSection = document.getElementById("adminSection");
const adminData = document.getElementById("adminData");

initTheme();
loadAlgo();

/* ==============================
   THEME AUTO
================================ */
function initTheme() {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.body.className = prefersDark ? "dark min-h-screen p-6" : "light min-h-screen p-6";

  document.getElementById("themeToggle")
    .addEventListener("click", () => {
      document.body.classList.toggle("dark");
      document.body.classList.toggle("light");
    });
}

/* ==============================
   LOAD + ADVANCED ALGO
================================ */
async function loadAlgo() {

  const q = query(
    collection(db, "transactions"),
    where("participants", "array-contains", userId)
  );

  const snapshot = await getDocs(q);

  let totalVolume = 0;
  let completed = 0;
  let pending = 0;

  snapshot.forEach(doc => {
    const tx = doc.data();
    totalVolume += tx.amount;
    if (tx.status === "completed") completed++;
    if (tx.status === "pending") pending++;
  });

  const totalTx = snapshot.size;
  const successRate = totalTx > 0 ? completed / totalTx : 0;

  /* ==============================
     ADVANCED WEIGHTED ALGORITHM
  ================================= */

  const volumeWeight = Math.min(totalVolume / 5000, 1) * 30;
  const successWeight = successRate * 40;
  const activityWeight = Math.min(totalTx / 50, 1) * 20;
  const riskPenalty = pending * 2;

  let score = Math.round(
    volumeWeight +
    successWeight +
    activityWeight -
    riskPenalty
  );

  score = Math.max(0, Math.min(100, score));

  animateScore(score);
  generateBadges(score, totalVolume, totalTx);
  generatePredictionGraph(score);

  if (role === "admin" || role === "super_admin") {
    adminSection.classList.remove("hidden");
    adminData.innerHTML = `
      Risk Index : ${100 - score}%<br>
      Pending Transactions : ${pending}<br>
      Volume : ${totalVolume}
    `;
  }
}

/* ==============================
   SCORE ANIMATION
================================ */
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

/* ==============================
   BADGES
================================ */
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
  span.className = "badge";
  span.textContent = text;
  badgesContainer.appendChild(span);
}

/* ==============================
   PREDICTION GRAPH
================================ */
function generatePredictionGraph(score) {

  const canvas = document.getElementById("predictionChart");
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
    const x = (canvas.width / days) * i;
    const y = canvas.height - (val / 100) * canvas.height;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();
}
