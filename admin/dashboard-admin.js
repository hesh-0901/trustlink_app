import { db } from "../js/firebase-init.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const userId =
  localStorage.getItem("userId") ||
  sessionStorage.getItem("userId");

if (!userId)
  window.location.href = "/trustlink_app/index.html";

/* ===========================
   ROLE CHECK
=========================== */

async function checkAdminAccess(){

  const snap = await getDoc(doc(db,"users",userId));

  if(!snap.exists())
    return window.location.href="/trustlink_app/index.html";

  const user = snap.data();

  if(user.role!=="admin" && user.role!=="super_admin")
    return window.location.href="/trustlink_app/dashboard.html";

  const badge =
    document.getElementById("adminRoleBadge");

  badge.textContent=user.role;

  if(user.role==="super_admin"){
    badge.classList.remove("badge-admin");
    badge.classList.add("badge-super");
  }
}

/* ===========================
   LOAD OVERVIEW
=========================== */

async function loadOverview(){

  const users =
    await getDocs(collection(db,"users"));
  const wallets =
    await getDocs(collection(db,"wallets"));
  const transactions =
    await getDocs(collection(db,"transactions"));

  document.getElementById("totalUsers")
    .textContent=users.size;

  document.getElementById("totalWallets")
    .textContent=wallets.size;

  document.getElementById("totalTransactions")
    .textContent=transactions.size;

  let pending=0;
  transactions.forEach(doc=>{
    if(doc.data().status==="pending")
      pending++;
  });

  document.getElementById("pendingTransactions")
    .textContent=pending;
}

/* ===========================
   LOAD USERS
=========================== */

async function loadUsers(){

  const snapshot =
    await getDocs(collection(db,"users"));

  const table =
    document.getElementById("usersTable");

  table.innerHTML="";

  snapshot.forEach(docSnap=>{

    const user=docSnap.data();
    const id=docSnap.id;

    const tr=document.createElement("tr");
    tr.className="border-t";

    tr.innerHTML=`
      <td class="py-3">
        ${user.firstName} ${user.lastName}
      </td>
      <td>${user.phoneNumber}</td>
      <td>
        <span class="badge ${
          user.role==="super_admin"
          ? "badge-super"
          : user.role==="admin"
          ? "badge-admin"
          : "badge-user"
        }">
          ${user.role}
        </span>
      </td>
      <td>
        ${user.isActive
          ? "<span class='text-green-600'>Actif</span>"
          : "<span class='text-red-500'>Suspendu</span>"}
      </td>
      <td class="space-x-2">

        <button onclick="toggleUser('${id}',${user.isActive})"
          class="text-amber-600">
          <i class="bi bi-pause-circle"></i>
        </button>

      </td>
    `;

    table.appendChild(tr);

  });

}

window.toggleUser = async (id,status)=>{
  await updateDoc(doc(db,"users",id),{
    isActive:!status
  });
  loadUsers();
};

/* ===========================
   INIT
=========================== */

async function init(){
  await checkAdminAccess();
  await loadOverview();
  await loadUsers();
}

init();
