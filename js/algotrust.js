import { db } from "./firebase-init.js";
import {
  collection,
  getDocs,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ===============================
   SESSION CHECK
================================ */

const userId =
  localStorage.getItem("userId") ||
  sessionStorage.getItem("userId");

if (!userId)
  window.location.href = "/trustlink_app/index.html";

/* ===============================
   ADMIN ACCESS CONTROL
================================ */

async function checkAdminAccess() {

  try {

    const userSnap =
      await getDoc(doc(db, "users", userId));

    if (!userSnap.exists()) return;

    const user = userSnap.data();

    if (user.role === "admin" ||
        user.role === "super_admin") {

      const adminBtn =
        document.getElementById("adminTrigger");

      if (adminBtn) {

        adminBtn.classList.remove("text-gray-400");
        adminBtn.classList.add("text-[#1E2BE0]");

        adminBtn.addEventListener("click", () => {
          window.location.href =
            "/trustlink_app/admin/dashboard-admin.html";
        });

      }

    }

  } catch (err) {
    console.error("Admin check error:", err);
  }
}

/* ===============================
   PERIOD FILTER
================================ */

let engineChart;
let activityChart;

document.addEventListener("DOMContentLoaded", () => {
  const periodFilter =
    document.getElementById("periodFilter");

  if (periodFilter)
    periodFilter.addEventListener("change", loadData);
});

/* ===============================
   LOAD DATA
================================ */

async function loadData() {

  const period =
    document.getElementById("periodFilter")?.value || "week";

  const snapshot =
    await getDocs(collection(db, "transactions"));

  const now = new Date();

  let total = 0;
  let pending = 0;
  let usd = 0;
  let cdf = 0;
  let dailyData = {};

  snapshot.forEach(docSnap => {

    const tx = docSnap.data();
    if (!tx.createdAt?.seconds) return;

    const date =
      new Date(tx.createdAt.seconds * 1000);

    const diff =
      (now - date) / (1000 * 60 * 60 * 24);

    if (
      (period === "day" && diff > 1) ||
      (period === "week" && diff > 7) ||
      (period === "month" && diff > 30)
    ) return;

    total++;

    if (tx.status === "pending")
      pending++;

    if (tx.currency === "USD")
      usd += tx.amount;

    if (tx.currency === "CDF")
      cdf += tx.amount;

    const label =
      date.toLocaleDateString("fr-FR");

    dailyData[label] =
      (dailyData[label] || 0) + 1;

  });

  updateStats(total, pending, usd, cdf);
  renderCharts(total, pending, dailyData);
}

/* ===============================
   UPDATE STATS
================================ */

function updateStats(total, pending, usd, cdf) {

  document.getElementById("totalTx").textContent = total;
  document.getElementById("pendingTx").textContent = pending;
  document.getElementById("volumeUSD").textContent =
    "$" + usd.toLocaleString();
  document.getElementById("volumeCDF").textContent =
    cdf.toLocaleString() + " CDF";

  const integrity =
    total === 0
      ? 100
      : ((total - pending) / total) * 100;

  document.getElementById("engineScore")
    .textContent = Math.round(integrity) + "%";
}

/* ===============================
   RENDER CHARTS
================================ */

function renderCharts(total, pending, data) {

  if (engineChart) engineChart.destroy();
  if (activityChart) activityChart.destroy();

  const integrity =
    total === 0
      ? 100
      : ((total - pending) / total) * 100;

  engineChart = new Chart(
    document.getElementById("engineChart"),
    {
      type: "doughnut",
      data: {
        datasets: [{
          data: [integrity, 100 - integrity],
          backgroundColor: ["#FFFFFF", "#ffffff33"],
          borderWidth: 0
        }]
      },
      options: {
        cutout: "75%",
        plugins: { legend: { display: false } }
      }
    }
  );

  activityChart = new Chart(
    document.getElementById("activityChart"),
    {
      type: "line",
      data: {
        labels: Object.keys(data),
        datasets: [{
          data: Object.values(data),
          borderColor: "#1E2BE0",
          backgroundColor: "rgba(30,43,224,0.08)",
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          x: { display: false },
          y: { display: false }
        }
      }
    }
  );
}

/* ===============================
   INIT
================================ */

async function init() {
  await checkAdminAccess();
  await loadData();
}

init();
