"use client";

import { useState, useMemo, useEffect } from "react";
import { BasicScheduler } from "@/app/components/scheduler";
import { CalendarEvent, ViewType } from "@/app/components/scheduler/types";
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
import { onAuthStateChanged, updateEmail } from "firebase/auth";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { styled } from "@mui/material/styles";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
  // hide last border
  "&:last-child td, &:last-child th": {
    border: 0,
  },
}));

const ScheduleComponent = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [view, setView] = useState<ViewType>("week");
  const [date, setDate] = useState(new Date());

  const now = new Date();

  const [calendars, setCalendars] = useState([
    { id: "Date", label: "Our Dates", color: "#ff66e5", active: true },
    { id: "Chei", label: "Chei Schedule", color: "#ff9500", active: true },
    { id: "Stipy", label: "Stipy Schedule", color: "#2e93ff", active: true },
  ]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

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
      isImportant: newEvent.isImportant ?? false,
      reminderSent: false,
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
      isImportant: updatedEvent.isImportant ?? false,
      reminderSent: updatedEvent.reminderSent,
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

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const importantEvents = events.filter((e) => e.isImportant).slice(0, 5);

  const upcomingEvents = events
    .filter((e) => e.start > new Date())
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, 5);

  const finishedEvents = events
    .filter((e) => e.end < now)
    .sort((a, b) => b.end.getTime() - a.end.getTime()) // terbaru selesai dulu
    .slice(0, 5); // optional: ambil 5 aja

  console.log(events);

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

        <div className="h-[750px] w-[1500px] border border-gray-300 rounded-lg overflow-hidden mb-[30px]">
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
        <div>
          <h1 className="font-mukta font-bold text-[35px] ">
            Important Schedule !
          </h1>
          <p className="mb-[20px] mt-[-5px] font-reemkufi text-gray-500 font-semibold">
            An important schedule on our meeting/date
          </p>
        </div>
        <div className="pb-[80px]">
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 750 }} aria-label="customized table">
              <TableHead>
                <TableRow>
                  <StyledTableCell
                    sx={{
                      fontWeight: "bold",
                      fontFamily: "var(--font-inter)",
                      fontSize: "15px",
                    }}
                  >
                    Title
                  </StyledTableCell>
                  <StyledTableCell
                    align="right"
                    sx={{
                      fontWeight: "bold",
                      fontFamily: "var(--font-inter)",
                      fontSize: "15px",
                    }}
                  >
                    Date
                  </StyledTableCell>
                  <StyledTableCell
                    align="right"
                    sx={{
                      fontWeight: "bold",
                      fontFamily: "var(--font-inter)",
                      fontSize: "15px",
                    }}
                  >
                    Hours
                  </StyledTableCell>
                  <StyledTableCell
                    align="right"
                    sx={{
                      fontWeight: "bold",
                      fontFamily: "var(--font-inter)",
                      fontSize: "15px",
                    }}
                  >
                    Calendar
                  </StyledTableCell>
                  <StyledTableCell
                    align="right"
                    sx={{
                      fontWeight: "bold",
                      fontFamily: "var(--font-inter)",
                      fontSize: "15px",
                    }}
                  >
                    Desc
                  </StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {importantEvents.map((event) => (
                  <TableRow
                    key={event.id}
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <StyledTableCell
                      component="th"
                      scope="row"
                      sx={{
                        fontFamily: "var(--font-inter)",
                        fontWeight: "bold",
                      }}
                    >
                      {event.title}
                    </StyledTableCell>
                    <StyledTableCell
                      align="right"
                      sx={{
                        fontFamily: "var(--font-inter)",
                      }}
                    >
                      {formatDate(event.start)}
                    </StyledTableCell>
                    <StyledTableCell
                      align="right"
                      sx={{
                        fontFamily: "var(--font-inter)",
                      }}
                    >
                      {formatTime(event.start)} - {formatTime(event.end)}
                    </StyledTableCell>
                    <StyledTableCell
                      align="right"
                      sx={{
                        fontFamily: "var(--font-inter)",
                      }}
                    >
                      {event.calendarId} Schedule
                    </StyledTableCell>
                    <StyledTableCell
                      align="right"
                      sx={{
                        fontFamily: "var(--font-inter)",
                      }}
                    >
                      {event.description}
                    </StyledTableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
        <div>
          <h1 className="font-mukta font-bold text-[35px] ">
            Upcoming Schedule
          </h1>
          <p className="mb-[20px] mt-[-5px] font-reemkufi text-gray-500 font-semibold">
            An upcoming schedule for our date/meeting
          </p>
        </div>
        <div className="pb-[50px]">
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 750 }} aria-label="customized table">
              <TableHead>
                <TableRow>
                  <StyledTableCell
                    sx={{
                      fontWeight: "bold",
                      fontFamily: "var(--font-inter)",
                      fontSize: "15px",
                    }}
                  >
                    Title
                  </StyledTableCell>
                  <StyledTableCell
                    align="right"
                    sx={{
                      fontWeight: "bold",
                      fontFamily: "var(--font-inter)",
                      fontSize: "15px",
                    }}
                  >
                    Date
                  </StyledTableCell>
                  <StyledTableCell
                    align="right"
                    sx={{
                      fontWeight: "bold",
                      fontFamily: "var(--font-inter)",
                      fontSize: "15px",
                    }}
                  >
                    Hours
                  </StyledTableCell>
                  <StyledTableCell
                    align="right"
                    sx={{
                      fontWeight: "bold",
                      fontFamily: "var(--font-inter)",
                      fontSize: "15px",
                    }}
                  >
                    Calendar
                  </StyledTableCell>
                  <StyledTableCell
                    align="right"
                    sx={{
                      fontWeight: "bold",
                      fontFamily: "var(--font-inter)",
                      fontSize: "15px",
                    }}
                  >
                    Desc
                  </StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {upcomingEvents.map((event) => (
                  <TableRow
                    key={event.id}
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <StyledTableCell
                      component="th"
                      scope="row"
                      sx={{
                        fontFamily: "var(--font-inter)",
                        fontWeight: "bold",
                      }}
                    >
                      {event.title}
                    </StyledTableCell>
                    <StyledTableCell
                      align="right"
                      sx={{
                        fontFamily: "var(--font-inter)",
                      }}
                    >
                      {formatDate(event.start)}
                    </StyledTableCell>
                    <StyledTableCell
                      align="right"
                      sx={{
                        fontFamily: "var(--font-inter)",
                      }}
                    >
                      {formatTime(event.start)} - {formatTime(event.end)}
                    </StyledTableCell>
                    <StyledTableCell
                      align="right"
                      sx={{
                        fontFamily: "var(--font-inter)",
                      }}
                    >
                      {event.calendarId} Schedule
                    </StyledTableCell>
                    <StyledTableCell
                      align="right"
                      sx={{
                        fontFamily: "var(--font-inter)",
                      }}
                    >
                      {event.description}
                    </StyledTableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
        <div>
          <h1 className="font-mukta font-bold text-[35px] ">
            Finished Schedule
          </h1>
          <p className="mb-[20px] mt-[-5px] font-reemkufi text-gray-500 font-semibold">
            A finished schedule on our meeting/date
          </p>
        </div>
        <div className="pb-[80px]">
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 750 }} aria-label="customized table">
              <TableHead>
                <TableRow>
                  <StyledTableCell
                    sx={{
                      fontWeight: "bold",
                      fontFamily: "var(--font-inter)",
                      fontSize: "15px",
                    }}
                  >
                    Title
                  </StyledTableCell>
                  <StyledTableCell
                    align="right"
                    sx={{
                      fontWeight: "bold",
                      fontFamily: "var(--font-inter)",
                      fontSize: "15px",
                    }}
                  >
                    Date
                  </StyledTableCell>
                  <StyledTableCell
                    align="right"
                    sx={{
                      fontWeight: "bold",
                      fontFamily: "var(--font-inter)",
                      fontSize: "15px",
                    }}
                  >
                    Hours
                  </StyledTableCell>
                  <StyledTableCell
                    align="right"
                    sx={{
                      fontWeight: "bold",
                      fontFamily: "var(--font-inter)",
                      fontSize: "15px",
                    }}
                  >
                    Calendar
                  </StyledTableCell>
                  <StyledTableCell
                    align="right"
                    sx={{
                      fontWeight: "bold",
                      fontFamily: "var(--font-inter)",
                      fontSize: "15px",
                    }}
                  >
                    Desc
                  </StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {finishedEvents.map((event) => (
                  <TableRow
                    key={event.id}
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <StyledTableCell
                      component="th"
                      scope="row"
                      sx={{
                        fontFamily: "var(--font-inter)",
                        fontWeight: "bold",
                      }}
                    >
                      {event.title}
                    </StyledTableCell>
                    <StyledTableCell
                      align="right"
                      sx={{
                        fontFamily: "var(--font-inter)",
                      }}
                    >
                      {formatDate(event.start)}
                    </StyledTableCell>
                    <StyledTableCell
                      align="right"
                      sx={{
                        fontFamily: "var(--font-inter)",
                      }}
                    >
                      {formatTime(event.start)} - {formatTime(event.end)}
                    </StyledTableCell>
                    <StyledTableCell
                      align="right"
                      sx={{
                        fontFamily: "var(--font-inter)",
                      }}
                    >
                      {event.calendarId} Schedule
                    </StyledTableCell>
                    <StyledTableCell
                      align="right"
                      sx={{
                        fontFamily: "var(--font-inter)",
                      }}
                    >
                      {event.description}
                    </StyledTableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </div>
    </main>
  );
};

export default ScheduleComponent;
