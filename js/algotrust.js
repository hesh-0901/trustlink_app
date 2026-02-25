import { db } from "./firebase-init.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const engineCtx = document.getElementById("engineChart");
const activityCtx = document.getElementById("activityChart");

let total = 0;
let pending = 0;
let usdVolume = 0;
let cdfVolume = 0;
let dailyData = {};

async function loadData() {

  const snapshot = await getDocs(collection(db, "transactions"));

  snapshot.forEach(doc => {

    const tx = doc.data();

    total++;

    if (tx.status === "pending") pending++;

    if (tx.currency === "USD")
      usdVolume += tx.amount;

    if (tx.currency === "CDF")
      cdfVolume += tx.amount;

    if (tx.createdAt?.seconds) {
      const date =
        new Date(tx.createdAt.seconds * 1000)
        .toLocaleDateString();

      dailyData[date] =
        (dailyData[date] || 0) + 1;
    }

  });

  renderCharts();
  updateStats();
}

function renderCharts() {

  const integrity =
    total === 0
      ? 100
      : ((total - pending) / total) * 100;

  new Chart(engineCtx, {
    type: "doughnut",
    data: {
      datasets: [{
        data: [integrity, 100 - integrity],
        backgroundColor: [
          "#1E2BE0",
          "#E5E7EB"
        ],
        borderWidth:0
      }]
    },
    options:{
      cutout:"75%",
      plugins:{legend:{display:false}}
    }
  });

  new Chart(activityCtx, {
    type:"line",
    data:{
      labels:Object.keys(dailyData),
      datasets:[{
        data:Object.values(dailyData),
        borderColor:"#1E2BE0",
        tension:0.4,
        fill:true,
        backgroundColor:"rgba(30,43,224,0.08)"
      }]
    },
    options:{
      plugins:{legend:{display:false}},
      scales:{
        x:{display:false},
        y:{display:false}
      }
    }
  });

}

function updateStats() {

  document.getElementById("totalTx")
    .textContent = total;

  document.getElementById("pendingTx")
    .textContent = pending;

  document.getElementById("volumeUSD")
    .textContent =
      "$" + usdVolume.toLocaleString();

  document.getElementById("volumeCDF")
    .textContent =
      cdfVolume.toLocaleString() + " CDF";
}

loadData();
