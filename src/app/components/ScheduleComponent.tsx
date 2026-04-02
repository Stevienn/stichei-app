"use client";

import { useState, useMemo, useEffect } from "react";
import { BasicScheduler } from "@/app/components/scheduler";
import { CalendarEvent, ViewType } from "@/app/components/scheduler/types";
import { addDays, startOfWeek, addHours } from "date-fns";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { auth } from "@/config/firebase";
import { onAuthStateChanged } from "firebase/auth";

const ScheduleComponent = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [view, setView] = useState<ViewType>("week");
  const [date, setDate] = useState(new Date());

  const [calendars, setCalendars] = useState([
    { id: "date", label: "Our Dates", color: "#ff66e5", active: true },
    { id: "chei", label: "Chei Schedule", color: "#ff9500", active: true },
    { id: "stipy", label: "Stipy Schedule", color: "#2e93ff", active: true },
  ]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      console.log("UID:", user.uid);

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      console.log("EXISTS:", docSnap.exists());
      console.log("DATA:", docSnap.data());

      const snapshot = await getDocs(collection(db, "events"));

      const eventsData: CalendarEvent[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        start: doc.data().start.toDate(),
        end: doc.data().end.toDate(),
      })) as CalendarEvent[];

      setEvents(eventsData);
    });

    return () => unsubscribe();
  }, []);

  const handleCalendarToggle = (calendarId: string, active: boolean) => {
    setCalendars((prev) =>
      prev.map((cal) => (cal.id === calendarId ? { ...cal, active } : cal))
    );
  };

  const filteredEvents = useMemo(() => {
    const activeIds = calendars.filter((c) => c.active).map((c) => c.id);
    return events.filter(
      (e) => !e.calendarId || activeIds.includes(e.calendarId)
    );
  }, [events, calendars]);

  const handleEventCreate = async (newEvent: Partial<CalendarEvent>) => {
    const user = auth.currentUser;
    if (!user) alert("Login dulu yuk sebelum buat event");

    const event: CalendarEvent = {
      title: newEvent.title || "New Event",
      description: newEvent.description,
      start: newEvent.start as Date,
      end: newEvent.end as Date,
      calendarId: newEvent.calendarId,
      color:
        calendars.find((c) => c.id === newEvent.calendarId)?.color || "#ff66e5",
      createdAt: new Date(),
    };
    const docRef = await addDoc(collection(db, "events"), {
      ...event,
      userId: user?.uid,
    });

    setEvents((prev) => [
      ...prev,
      {
        id: docRef.id,
        ...event,
        start: event.start as Date,
        end: event.end as Date,
      } as CalendarEvent,
    ]);
  };

  const handleEventUpdate = async (updatedEvent: CalendarEvent) => {
    const user = auth.currentUser;
    if (!user) alert("Login dulu say");

    const eventRef = doc(db, "events", updatedEvent.id!);

    await updateDoc(eventRef, {
      title: updatedEvent.title,
      description: updatedEvent.description,
      start: updatedEvent.start,
      end: updatedEvent.end,
      calendarId: updatedEvent.calendarId,
      color: updatedEvent.color,
    });

    setEvents((prev) =>
      prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e))
    );
  };

  const handleEventDelete = async (eventId: string) => {
    const user = auth.currentUser;
    if (!user) alert("Login dulu sayy");

    const eventRef = doc(db, "events", eventId);

    await deleteDoc(eventRef);

    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  return (
    <main className="min-h-screen pt-[120px] bg-gradient-to-b from-blue-100 via-white to-blue-50">
      <div className="max-w-7xl mx-[50px]">
        <div>
          <h1 className="font-mukta font-bold text-[35px] ">
            The better way to schedule our dates
          </h1>
          <p className="mb-[20px] mt-[-5px] font-reemkufi text-gray-500 font-semibold">
            A fully customisable scheduling experience for our meetings and
            dates !
          </p>
        </div>

        <div className="h-[750px] w-[1500px] border border-gray-300 rounded-lg overflow-hidden">
          <BasicScheduler
            events={filteredEvents}
            view={view as "month" | "week" | "day"}
            onViewChange={(v) => {
              setView(v);
            }}
            date={date}
            onDateChange={setDate}
            calendars={calendars}
            onCalendarToggle={handleCalendarToggle}
            onEventCreate={handleEventCreate}
            onEventUpdate={handleEventUpdate}
            onEventDelete={handleEventDelete}
            className="h-full"
          />
        </div>
      </div>
    </main>
  );
};

export default ScheduleComponent;
