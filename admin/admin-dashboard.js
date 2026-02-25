import { db } from "../js/firebase-init.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ===========================
   SESSION CHECK
=========================== */

const userId =
  localStorage.getItem("userId") ||
  sessionStorage.getItem("userId");

if (!userId) {
  window.location.href = "/trustlink_app/index.html";
}

/* ===========================
   SAFE ERROR DISPLAY
=========================== */

function showError(message) {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.bottom = "20px";
  container.style.left = "50%";
  container.style.transform = "translateX(-50%)";
  container.style.background = "#EF4444";
  container.style.color = "white";
  container.style.padding = "10px 20px";
  container.style.borderRadius = "12px";
  container.style.zIndex = "9999";
  container.style.fontSize = "13px";
  container.textContent = message;
  document.body.appendChild(container);

  setTimeout(() => {
    container.remove();
  }, 4000);
}

/* ===========================
   ROLE CHECK
=========================== */

async function checkAdminAccess() {
  try {
    const snap = await getDoc(doc(db, "users", userId));

    if (!snap.exists()) {
      window.location.href = "/trustlink_app/index.html";
      return;
    }

    const user = snap.data();

    if (user.role !== "admin" && user.role !== "super_admin") {
      window.location.href = "/trustlink_app/public/dashboard.html";
      return;
    }

    const badge = document.getElementById("adminRoleBadge");

    if (badge) {
      badge.textContent = user.role;

      if (user.role === "super_admin") {
        badge.classList.remove("badge-admin");
        badge.classList.add("badge-super");
      }
    }

  } catch (err) {
    showError("Erreur accès admin");
  }
}

/* ===========================
   LOAD OVERVIEW
=========================== */

async function loadOverview() {
  try {

    const usersSnap = await getDocs(collection(db, "users"));
    const walletsSnap = await getDocs(collection(db, "wallets"));
    const txSnap = await getDocs(collection(db, "transactions"));

    document.getElementById("totalUsers").textContent = usersSnap.size;
    document.getElementById("totalWallets").textContent = walletsSnap.size;
    document.getElementById("totalTransactions").textContent = txSnap.size;

    let pending = 0;

    txSnap.forEach(doc => {
      if (doc.data().status === "pending") pending++;
    });

    document.getElementById("pendingTransactions").textContent = pending;

  } catch (err) {
    showError("Erreur chargement statistiques");
  }
}

/* ===========================
   LOAD USERS
=========================== */

async function loadUsers() {
  try {

    const snapshot = await getDocs(collection(db, "users"));
    const table = document.getElementById("usersTable");

    if (!table) return;

    table.innerHTML = "";

    snapshot.forEach(docSnap => {

      const user = docSnap.data();
      const id = docSnap.id;

      const tr = document.createElement("tr");
      tr.className = "border-t";

      tr.innerHTML = `
        <td class="py-3">${user.firstName} ${user.lastName}</td>
        <td>${user.phoneNumber || "-"}</td>
        <td>
          <span class="badge ${
            user.role === "super_admin"
              ? "badge-super"
              : user.role === "admin"
              ? "badge-admin"
              : "badge-user"
          }">
            ${user.role}
          </span>
        </td>
        <td>
          ${
            user.isActive
              ? "<span class='text-green-600'>Actif</span>"
              : "<span class='text-red-500'>Suspendu</span>"
          }
        </td>
        <td>
          <button
            data-id="${id}"
            data-status="${user.isActive}"
            class="toggleBtn text-amber-600">
            <i class="bi bi-pause-circle text-lg"></i>
          </button>
        </td>
      `;

      table.appendChild(tr);
    });

    attachToggleEvents();

  } catch (err) {
    showError("Erreur chargement utilisateurs");
  }
}

/* ===========================
   TOGGLE USER
=========================== */

function attachToggleEvents() {

  document.querySelectorAll(".toggleBtn")
    .forEach(btn => {

      btn.addEventListener("click", async () => {

        const id = btn.getAttribute("data-id");
        const currentStatus =
          btn.getAttribute("data-status") === "true";

        try {
          await updateDoc(doc(db, "users", id), {
            isActive: !currentStatus
          });

          loadUsers();

        } catch (err) {
          showError("Erreur modification utilisateur");
        }

      });

    });
}

/* ===========================
   INIT
=========================== */

async function init() {
  await checkAdminAccess();
  await loadOverview();
  await loadUsers();
}

init();
