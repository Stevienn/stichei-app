"use client";
import { useEffect, useState } from "react";
import Header from "./components/Header";
import ScheduleComponent from "./components/ScheduleComponent";
import LoginModal from "./modals/LoginModal";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "@/config/firebase";
import { useAuthStore } from "@/store/auth";

export default function Home() {
  const [openLoginModal, setOpenLoginModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const setUser = useAuthStore.getState().setUser;

      if (user) {
        // 🔥 ambil data dari Firestore
        const q = query(
          collection(db, "users"), //ambil collection users
          where("email", "==", user.email)
        );

        const querySnapshot = await getDocs(q); //ambil semua documents sesuai query

        let fullname = "";

        querySnapshot.forEach((doc) => {
          fullname = doc.data().fullname;
        });

        setUser({
          uid: user.uid,
          email: user?.email,
          fullname: fullname,
        });
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  return (
    <>
      {openLoginModal && (
        <LoginModal isLogin={() => setOpenLoginModal(false)} />
      )}

      <Header isLogin={() => setOpenLoginModal(true)} />
      <ScheduleComponent />
    </>
  );
}
