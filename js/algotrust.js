import { db } from "./firebase-init.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const periodFilter = document.getElementById("periodFilter");

let engineChart;
let activityChart;

periodFilter.addEventListener("change", loadData);

async function loadData() {

  const period = periodFilter.value;

  const snapshot =
    await getDocs(collection(db,"transactions"));

  const now = new Date();

  let total=0, pending=0, usd=0, cdf=0;
  let dailyData={};

  snapshot.forEach(doc=>{

    const tx = doc.data();
    if(!tx.createdAt?.seconds) return;

    const date =
      new Date(tx.createdAt.seconds*1000);

    const diff =
      (now - date)/(1000*60*60*24);

    if(
      (period==="day" && diff>1) ||
      (period==="week" && diff>7) ||
      (period==="month" && diff>30)
    ) return;

    total++;

    if(tx.status==="pending") pending++;

    if(tx.currency==="USD") usd+=tx.amount;
    if(tx.currency==="CDF") cdf+=tx.amount;

    const label =
      date.toLocaleDateString();

    dailyData[label]=(dailyData[label]||0)+1;

  });

  updateStats(total,pending,usd,cdf);
  renderCharts(total,pending,dailyData);
}

function updateStats(total,pending,usd,cdf){

  document.getElementById("totalTx").textContent=total;
  document.getElementById("pendingTx").textContent=pending;
  document.getElementById("volumeUSD").textContent="$"+usd.toLocaleString();
  document.getElementById("volumeCDF").textContent=cdf.toLocaleString()+" CDF";

  const integrity = total===0?100:((total-pending)/total)*100;

  document.getElementById("engineScore")
    .textContent=Math.round(integrity)+"%";
}

function renderCharts(total,pending,data){

  if(engineChart) engineChart.destroy();
  if(activityChart) activityChart.destroy();

  const integrity = total===0?100:((total-pending)/total)*100;

  engineChart = new Chart(
    document.getElementById("engineChart"),
    {
      type:"doughnut",
      data:{
        datasets:[{
          data:[integrity,100-integrity],
          backgroundColor:["#FFFFFF","#ffffff33"],
          borderWidth:0
        }]
      },
      options:{
        cutout:"75%",
        plugins:{legend:{display:false}}
      }
    }
  );

  activityChart = new Chart(
    document.getElementById("activityChart"),
    {
      type:"line",
      data:{
        labels:Object.keys(data),
        datasets:[{
          data:Object.values(data),
          borderColor:"#1E2BE0",
          backgroundColor:"rgba(30,43,224,0.08)",
          fill:true,
          tension:0.4
        }]
      },
      options:{
        plugins:{legend:{display:false}},
        scales:{x:{display:false},y:{display:false}}
      }
    }
  );
}

loadData();
