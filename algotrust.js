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
const scoreRing = document.getElementById("scoreRing");
const aiText = document.getElementById("aiText");

const totalVolumeEl = document.getElementById("totalVolume");
const totalTxEl = document.getElementById("totalTx");
const successRateEl = document.getElementById("successRate");

const adminSection = document.getElementById("adminSection");

async function loadAlgo() {

  const q = query(
    collection(db, "transactions"),
    where("participants", "array-contains", userId)
  );

  const snapshot = await getDocs(q);

  let totalVolume = 0;
  let success = 0;
  let pending = 0;

  snapshot.forEach(doc => {
    const tx = doc.data();
    totalVolume += tx.amount;

    if (tx.status === "completed")
      success++;
    if (tx.status === "pending")
      pending++;
  });

  const totalTx = snapshot.size;
  const successRate =
    totalTx > 0 ? Math.round((success / totalTx) * 100) : 0;

  let score =
    Math.min(
      100,
      Math.round(
        successRate * 0.6 +
        Math.min(totalVolume / 1000, 1) * 40
      )
    );

  animateScore(score);

  totalVolumeEl.textContent = totalVolume.toFixed(2);
  totalTxEl.textContent = totalTx;
  successRateEl.textContent = successRate + "%";

  generateAIText(score, successRate, totalTx);

  if (role === "admin" || role === "super_admin") {
    adminSection.classList.remove("hidden");

    document.getElementById("riskFlag").textContent =
      score < 40 ? "HIGH" : "LOW";

    document.getElementById("suspiciousScore").textContent =
      (100 - score) + "%";

    document.getElementById("multiDetect").textContent =
      totalTx > 50 ? "Potential" : "None";
  }
}

function animateScore(score) {

  trustScoreEl.textContent = score;

  if (score > 80)
    trustLevelEl.textContent = "Elite";
  else if (score > 60)
    trustLevelEl.textContent = "Gold";
  else if (score > 40)
    trustLevelEl.textContent = "Standard";
  else
    trustLevelEl.textContent = "Risk";

  const circumference = 440;
  const offset =
    circumference - (score / 100) * circumference;

  setTimeout(() => {
    scoreRing.style.strokeDashoffset = offset;
  }, 300);
}

function generateAIText(score, rate, tx) {

  let message;

  if (score > 80)
    message = "Profil stable détecté. Activité fiable.";
  else if (score > 60)
    message = "Comportement cohérent. Risque modéré.";
  else
    message = "Activité irrégulière détectée.";

  typeEffect(message);
}

function typeEffect(text) {

  let i = 0;
  aiText.textContent = "";

  const interval = setInterval(() => {
    aiText.textContent += text.charAt(i);
    i++;
    if (i >= text.length)
      clearInterval(interval);
  }, 30);
}

loadAlgo();
