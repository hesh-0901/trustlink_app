// userService.js

import { db } from "./firebase-init.js";

import {
  doc,
  getDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const userCache = {};
let currentUserUnsubscribe = null;

const AVATAR_PATH =
  "/trustlink_app/assets/avatars/";

/* ===============================
   GET USER WITH CACHE
================================ */
export async function getUser(userId) {

  if (userCache[userId]) {
    return userCache[userId];
  }

  const snap =
    await getDoc(doc(db, "users", userId));

  if (!snap.exists()) return null;

  const data = snap.data();

  userCache[userId] = data;

  return data;
}

/* ===============================
   REALTIME CURRENT USER
================================ */
export function listenCurrentUser(
  userId,
  callback
) {

  if (currentUserUnsubscribe)
    currentUserUnsubscribe();

  const userRef =
    doc(db, "users", userId);

  currentUserUnsubscribe =
    onSnapshot(userRef, (snap) => {

      if (!snap.exists()) return;

      const data = snap.data();

      userCache[userId] = data;

      callback({
        ...data,
        avatarUrl: data.avatarImage
          ? AVATAR_PATH + data.avatarImage
          : null
      });

    });
}

/* ===============================
   CLEAR CACHE
================================ */
export function clearUserCache() {

  Object.keys(userCache)
    .forEach(k => delete userCache[k]);

  if (currentUserUnsubscribe)
    currentUserUnsubscribe();
}
