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

  const friendPhone =
    document.getElementById("friend-phone");

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

      const friendSnap =
        await getDoc(
          doc(db, "users", data.beneficiaryId)
        );

      if (!friendSnap.exists()) continue;

      const friend = friendSnap.data();

      const friendAvatar =
        friend.avatarImage || "avatar1.PNG";

      const div = document.createElement("div");

      div.className =
        "flex items-center gap-3 bg-gray-50 hover:bg-gray-100 p-3 rounded-2xl cursor-pointer transition";

      div.innerHTML = `
        <img 
          src="${getAvatar(friendAvatar)}"
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

        friendPhone.textContent =
          friend.phoneNumber;

        friendModal.classList.remove("hidden");
      });

      friendsList.appendChild(div);
    }
  }

  document.querySelectorAll(".copy-btn")
    .forEach(btn => {

      btn.addEventListener("click", () => {

        const target =
          document.getElementById(
            btn.dataset.copy
          );

        navigator.clipboard.writeText(
          target.textContent
        );
      });

    });

  loadFriends();

})();
