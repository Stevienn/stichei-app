import { db } from "@/config/firebase";
import {
  collection,
  getDocs,
  query,
  updateDoc,
  where,
  doc as docRef,
} from "firebase/firestore";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function GET() {
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

  const eventsRef = collection(db, "events");

  const q = query(
    eventsRef,
    where("start", ">=", now),
    where("start", "<=", oneHourLater),
    where("reminderSent", "==", false)
  );

  const snapshot = await getDocs(q);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  for (const d of snapshot.docs) {
    const event = d.data();

    const emails = [process.env.EMAIL_TO_1, process.env.EMAIL_TO_2].filter(
      Boolean
    ) as string[];

    await transporter.sendMail({
      from: `"Stichei Website 💖" <${process.env.EMAIL_USER}>`,
      to: emails,
      subject: "Reminder Event from Stichei Scheduling APP 💌",
      text: `Haloo !!! Jangan lupa yachhhh, satu jam lagi, ada jadwal "${
        event.calendarId
      } yaitu "${
        event.title
      }" yang dimulai jam ${event.start.toDate()}. Ini hanya reminder dan pengingat setia kaliann 💖`,
    });

    await updateDoc(docRef(db, "events", d.id), {
      reminderSent: true,
    });
  }

  return NextResponse.json({ success: true });
}
