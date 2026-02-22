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
   INIT
================================ */

(async function initProfile() {

  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) return;

  const user = userSnap.data();

  /* ===============================
     USER INFO
  ================================= */

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
     AVATAR SECTION
  ================================= */

  const avatarStyles = [
    "micah",
    "personas",
    "avataaars-neutral",
    "initials",
    "identicon"
  ];

  let selectedStyle = user.avatarStyle || "micah";

  function generateAvatar(style, username) {
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${username}&radius=50`;
  }

  const profileAvatar = document.getElementById("profile-avatar");

  if (profileAvatar) {
    profileAvatar.src =
      generateAvatar(selectedStyle, user.username);
  }

  const container =
    document.getElementById("avatar-options");

  if (container) {

    container.innerHTML = "";

    avatarStyles.forEach(style => {

      const img = document.createElement("img");

      img.src =
        generateAvatar(style, user.username);

      img.className =
        "w-16 h-16 rounded-full cursor-pointer border-2 transition";

      if (style === selectedStyle)
        img.classList.add("border-[#1E2BE0]");
      else
        img.classList.add("border-transparent");

      img.addEventListener("click", () => {

        selectedStyle = style;

        if (profileAvatar)
          profileAvatar.src =
            generateAvatar(style, user.username);

        document
          .querySelectorAll("#avatar-options img")
          .forEach(i =>
            i.classList.remove("border-[#1E2BE0]")
          );

        img.classList.add("border-[#1E2BE0]");
      });

      container.appendChild(img);
    });
  }

  const saveBtn =
    document.getElementById("save-avatar");

  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {

      await updateDoc(userRef, {
        avatarStyle: selectedStyle,
        updatedAt: serverTimestamp()
      });

      alert("Avatar mis à jour ✔️");
    });
  }

  /* ===============================
     FRIENDS SECTION (SAFE)
  ================================= */

  const friendsList =
    document.getElementById("friendsList");

  if (!friendsList) return; // si la section n'existe pas, on stop

  async function loadFriends() {

    const q = query(
      collection(db, "beneficiaries"),
      where("userId", "==", userId)
    );

    const snapshot = await getDocs(q);

    friendsList.innerHTML = "";

    for (const docSnap of snapshot.docs) {

      const data = docSnap.data();

      const friendSnap =
        await getDoc(
          doc(db, "users", data.beneficiaryId)
        );

      if (!friendSnap.exists()) continue;

      const friend = friendSnap.data();

      const friendStyle =
        friend.avatarStyle || "micah";

      const friendDiv =
        document.createElement("div");

      friendDiv.className =
        "flex items-center justify-between bg-gray-50 p-3 rounded-xl";

      friendDiv.innerHTML = `
        <div class="flex items-center gap-3">
          <img 
            src="${generateAvatar(friendStyle, friend.username)}"
            class="w-10 h-10 rounded-full bg-white"
          />
          <div>
            <p class="text-sm font-medium">
              ${friend.firstName} ${friend.lastName}
            </p>
            <p class="text-xs text-gray-500">
              @${friend.username}
            </p>
          </div>
        </div>
        <button class="text-red-500 text-xs font-medium">
          Supprimer
        </button>
      `;

      friendDiv
        .querySelector("button")
        .addEventListener("click", async () => {

          await deleteDoc(
            doc(db, "beneficiaries", docSnap.id)
          );

          loadFriends();
        });

      friendsList.appendChild(friendDiv);
    }
  }

  loadFriends();

})();
