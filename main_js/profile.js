import { db } from "../js/firebase-init.js";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ===============================
   SESSION
================================ */

const userId =
  localStorage.getItem("userId") ||
  sessionStorage.getItem("userId");

if (!userId) {
  window.location.href = "/trustlink_app/index.html";
}

/* ===============================
   AVATAR CONFIG
================================ */

const TOTAL_AVATARS = 30;
const AVATAR_PATH = "/trustlink_app/assets/avatars/";

/* ===============================
   PRELOAD AVATARS (CACHE)
================================ */

function preloadAvatars() {
  for (let i = 1; i <= TOTAL_AVATARS; i++) {
    const img = new Image();
    img.src = `${AVATAR_PATH}avatar${i}.PNG`;
  }
}

if ("requestIdleCallback" in window) {
  requestIdleCallback(preloadAvatars);
} else {
  setTimeout(preloadAvatars, 1500);
}

/* ===============================
   INIT
================================ */

(async function initProfile() {

  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;

  const user = userSnap.data();

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  setText("profile-name", `${user.firstName} ${user.lastName}`);
  setText("profile-username", `@${user.username}`);
  setText("profile-phone", user.phoneNumber);
  setText("profile-gender", user.gender);
  setText("profile-birth", user.birthDate);
  setText("profile-wallet", user.walletBase);

  /* ===============================
     AVATAR LOCAL SYSTEM
  ================================= */

  let selectedAvatar =
    user.avatarImage || "avatar1.PNG";

  const profileAvatar =
    document.getElementById("profile-avatar");

  function getAvatar(file) {
    return `${AVATAR_PATH}${file}`;
  }

  profileAvatar.src = getAvatar(selectedAvatar);

  const container =
    document.getElementById("avatar-options");

  const modal =
    document.getElementById("avatar-modal");

  document.getElementById("edit-avatar-btn")
    ?.addEventListener("click", () =>
      modal.classList.remove("hidden")
    );

  document.getElementById("close-avatar-modal")
    ?.addEventListener("click", () =>
      modal.classList.add("hidden")
    );

  container.innerHTML = "";

  for (let i = 1; i <= TOTAL_AVATARS; i++) {

    const file = `avatar${i}.PNG`;

    const img = document.createElement("img");
    img.src = getAvatar(file);
    img.className =
      "w-16 h-16 rounded-full cursor-pointer border-2 transition object-cover";

    if (file === selectedAvatar)
      img.classList.add("border-[#1E2BE0]");
    else
      img.classList.add("border-transparent");

    img.addEventListener("click", () => {

      selectedAvatar = file;
      profileAvatar.src = getAvatar(file);

      document
        .querySelectorAll("#avatar-options img")
        .forEach(i =>
          i.classList.remove("border-[#1E2BE0]")
        );

      img.classList.add("border-[#1E2BE0]");
    });

    container.appendChild(img);
  }

  document.getElementById("save-avatar")
    ?.addEventListener("click", async () => {

      await updateDoc(userRef, {
        avatarImage: selectedAvatar,
        updatedAt: serverTimestamp()
      });

      modal.classList.add("hidden");
    });

  /* ===============================
     FRIENDS
  ================================= */
    const friendsList =
    document.getElementById("friendsList");

  const friendsCount =
    document.getElementById("friends-count");

  const friendModal =
    document.getElementById("friend-modal");

  const closeFriendModal =
    document.getElementById("close-friend-modal");

  const friendName =
    document.getElementById("friend-name");

  const friendUsername =
    document.getElementById("friend-username");

  const friendAvatar =
    document.getElementById("friend-avatar");

  const friendWallet =
    document.getElementById("friend-wallet");

  const friendCdf =
    document.getElementById("friend-cdf");

  const friendUsd =
    document.getElementById("friend-usd");

  const deleteFriendBtn =
    document.getElementById("delete-friend");

  const writeFriendBtn =
    document.getElementById("write-friend");

  closeFriendModal?.addEventListener("click", () =>
    friendModal.classList.add("hidden")
  );

  async function loadFriends() {

    const q = query(
      collection(db, "beneficiaries"),
      where("userId", "==", userId)
    );

    const snapshot = await getDocs(q);

    friendsList.innerHTML = "";

    friendsCount.textContent =
      `${snapshot.size} ami${snapshot.size > 1 ? "s" : ""}`;

    for (const docSnap of snapshot.docs) {

      const data = docSnap.data();

      const friendRef =
        doc(db, "users", data.beneficiaryId);

      const friendSnap =
        await getDoc(friendRef);

      if (!friendSnap.exists()) continue;

      const friend = friendSnap.data();

      const avatarFile =
        friend.avatarImage || "avatar1.PNG";

      const div = document.createElement("div");

      div.className =
        "flex items-center gap-3 bg-gray-50 hover:bg-gray-100 p-3 rounded-2xl cursor-pointer transition";

      div.innerHTML = `
        <img 
          src="${getAvatar(avatarFile)}"
          class="w-12 h-12 rounded-full object-cover"
        />
        <div>
          <p class="text-sm font-medium">
            ${friend.firstName} ${friend.lastName}
          </p>
          <p class="text-xs text-gray-500">
            @${friend.username}
          </p>
        </div>
      `;

      div.addEventListener("click", () => {

        friendName.textContent =
          `${friend.firstName} ${friend.lastName}`;

        friendUsername.textContent =
          `@${friend.username}`;

        friendAvatar.src =
          getAvatar(avatarFile);

        friendWallet.textContent =
          friend.walletBase || "-";

        friendCdf.textContent =
          friend.balanceCDF
            ? `${friend.balanceCDF} CDF`
            : "0 CDF";

        friendUsd.textContent =
          friend.balanceUSD
            ? `${friend.balanceUSD} USD`
            : "0 USD";

        deleteFriendBtn.onclick = async () => {

          await deleteDoc(
            doc(db, "beneficiaries", docSnap.id)
          );

          friendModal.classList.add("hidden");
          loadFriends();
        };

        writeFriendBtn.onclick = () => {

          window.location.href =
            `/trustlink_app/chat.html?user=${data.beneficiaryId}`;
        };

        friendModal.classList.remove("hidden");
      });

      friendsList.appendChild(div);
    }
  }

  document.addEventListener("click", (e) => {

    const btn = e.target.closest(".copy-btn");
    if (!btn) return;

    const target =
      document.getElementById(
        btn.dataset.copy
      );

    if (!target) return;

    navigator.clipboard.writeText(
      target.textContent.trim()
    );

    btn.innerHTML =
      '<i class="bi bi-check text-xs text-green-500"></i>';

    setTimeout(() => {
      btn.innerHTML =
        '<i class="bi bi-copy text-xs"></i>';
    }, 1200);
  });

  loadFriends();

})();
