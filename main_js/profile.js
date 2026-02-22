import { db } from "../js/firebase-init.js";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const userId =
  localStorage.getItem("userId") ||
  sessionStorage.getItem("userId");

if (!userId)
  window.location.href = "/trustlink_app/index.html";

(async function initProfile() {

  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;

  const user = userSnap.data();

  /* ===============================
     USER INFO
  ================================= */

  document.getElementById("profile-name")
    .textContent = `${user.firstName} ${user.lastName}`;

  document.getElementById("profile-username")
    .textContent = `@${user.username}`;

  document.getElementById("profile-phone")
    .textContent = user.phoneNumber;

  document.getElementById("profile-gender")
    .textContent = user.gender;

  document.getElementById("profile-birth")
    .textContent = user.birthDate;

  document.getElementById("profile-wallet")
    .textContent = user.walletBase;

  /* ===============================
     AVATAR SECTION
  ================================= */

  const avatarStyles = [
    "micah","personas","avataaars-neutral",
    "initials","identicon","multiavatar"
  ];

  let selectedStyle = user.avatarStyle || "micah";

  function generateAvatar(style) {
    if (style === "multiavatar")
      return `https://api.multiavatar.com/${user.username}.svg`;

    return `https://api.dicebear.com/7.x/${style}/svg?seed=${user.username}&radius=50`;
  }

  document.getElementById("profile-avatar")
    .src = generateAvatar(selectedStyle);

  const container =
    document.getElementById("avatar-options");

  avatarStyles.forEach(style => {

    const img = document.createElement("img");
    img.src = generateAvatar(style);
    img.className =
      "w-16 h-16 rounded-full cursor-pointer border-2";

    if (style === selectedStyle)
      img.classList.add("border-[#1E2BE0]");
    else
      img.classList.add("border-transparent");

    img.onclick = () => {
      selectedStyle = style;
      document.getElementById("profile-avatar")
        .src = generateAvatar(style);
      location.reload();
    };

    container.appendChild(img);

  });

  document.getElementById("save-avatar")
    .addEventListener("click", async () => {

      await updateDoc(userRef, {
        avatarStyle: selectedStyle,
        updatedAt: serverTimestamp()
      });

      alert("Avatar mis à jour ✔️");
    });

  /* ===============================
     FRIENDS (BENEFICIARIES)
  ================================= */

  async function loadFriends() {

    const q = query(
      collection(db, "beneficiaries"),
      where("userId", "==", userId)
    );

    const snapshot = await getDocs(q);
    const list =
      document.getElementById("friendsList");

    list.innerHTML = "";

    for (const docSnap of snapshot.docs) {

      const data = docSnap.data();

      const friendSnap =
        await getDoc(doc(db, "users", data.beneficiaryId));

      if (!friendSnap.exists()) continue;

      const friend = friendSnap.data();

      const div = document.createElement("div");
      div.className =
        "flex items-center justify-between bg-gray-50 p-3 rounded-xl";

      div.innerHTML = `
        <div class="flex items-center gap-3">
          <img src="https://api.dicebear.com/7.x/micah/svg?seed=${friend.username}"
               class="w-10 h-10 rounded-full bg-white">
          <div>
            <p class="text-sm font-medium">${friend.firstName} ${friend.lastName}</p>
            <p class="text-xs text-gray-500">@${friend.username}</p>
          </div>
        </div>
        <button class="text-red-500 text-xs">Supprimer</button>
      `;

      div.querySelector("button")
        .addEventListener("click", async () => {
          await deleteDoc(doc(db, "beneficiaries", docSnap.id));
          loadFriends();
        });

      list.appendChild(div);
    }
  }

  loadFriends();

})();
