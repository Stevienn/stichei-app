import React from "react";
import {
  format,
  isSameDay,
  differenceInMinutes,
  isToday,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
} from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { CalendarEvent, ViewType } from "../types";
import { cn } from "../utils";
import { useVirtualizer } from "@tanstack/react-virtual";
import { calculateEventPositions, getEventStyle } from "../lib/eventCollision";

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onTimeSlotClick?: (date: Date) => void;
  timezone?: string;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  renderEvent?: (props: {
    event: CalendarEvent;
    view: ViewType;
    onClick?: () => void;
  }) => React.ReactNode;
}

export const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  events,
  onEventClick,
  onTimeSlotClick,
  timezone,
  weekStartsOn = 0,
  renderEvent,
}) => {
  // Generate days for the week
  const start = startOfWeek(currentDate, { weekStartsOn });
  const end = endOfWeek(currentDate, { weekStartsOn });
  const weekDays = eachDayOfInterval({ start, end });

  const parentRef = React.useRef<HTMLDivElement>(null);
  const hourHeight = 60; // px

  // Virtualizer for 24 hours
  const rowVirtualizer = useVirtualizer({
    count: 24,
    getScrollElement: () => parentRef.current,
    estimateSize: () => hourHeight,
    overscan: 5,
  });

  const [now, setNow] = React.useState(new Date());

  React.useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to 8am on mount
  React.useEffect(() => {
    if (parentRef.current) {
      const scrollTo8am = 8 * hourHeight;
      parentRef.current.scrollTop = scrollTo8am;
    }
  }, []);

  // Timezone adjustment helper
  const getZonedDate = (date: Date) => {
    return timezone ? toZonedTime(date, timezone) : date;
  };

  const zonedNow = getZonedDate(now);

  return (
    <div className="flex flex-col font-inter h-full border border-gray-300 rounded-2xl overflow-hidden min-w-[800px] md:min-w-0 shadow-sm ring-1 ring-black/5 ">
      {/* Scrollable Container - includes header for proper alignment */}
      <div
        ref={parentRef}
        className="flex-1 overflow-y-auto relative scroll-smooth"
        style={{ contain: "strict", scrollbarGutter: "stable" }}
      >
        {/* Header - sticky inside scroll container with glass effect and gradient */}
        <div className="flex border-b border-gray-300 border-border/50 z-20 sticky top-0 glass backdrop-blur-[3px] bg-white/30">
          <div className="flex-none w-16 p-3 text-center text-xs font-semibold text-gray-500 flex items-center justify-center border-r border-gray-300 border-border/50">
            {timezone ? timezone.split("/")[1] : "GMT"}
          </div>
          <div className="flex-1 grid grid-cols-7">
            {weekDays.map((day, index) => (
              <div
                key={day.toISOString()}
                className={cn(
                  "py-3 px-2 text-center",
                  index > 0 && "border-l border-border/50 border-gray-300"
                )}
              >
                <div className="text-[11px] font-medium text-gray-600 uppercase tracking-wider mb-1">
                  {format(day, "EEE")}
                </div>
                <div
                  className={cn(
                    "w-8 h-8 flex items-center justify-center rounded-[10px] mx-auto text-sm font-semibold transition-all duration-200",
                    isToday(day)
                      ? "bg-blue-700 text-white shadow-lg shadow-primary/30 scale-110"
                      : "text-foreground hover:bg-accent"
                  )}
                >
                  {format(day, "d")}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Grid Content */}
        <div
          className="flex min-w-full relative"
          style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
        >
          {/* Time Labels Column */}
          <div className="flex-none w-16 border-r border-gray-300 border-border relative bg-background/50">
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const hour = virtualRow.index;
              return (
                <div
                  key={hour}
                  className="absolute top-0 left-0 w-full text-xs text-gray-500 text-right pr-3 font-medium tabular-nums"
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {/* -translate-y-1/2 centers it vertically on the line */}
                  <span className="block -translate-y-1/2">
                    {hour !== 0 &&
                      format(new Date().setHours(hour, 0, 0, 0), "h a")}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Days Columns */}
          <div className="flex-1 grid grid-cols-7 relative">
            {weekDays.map((day, dayIndex) => {
              // Filter events for this day
              const dayEvents = events.filter((e) => {
                const zonedStart = getZonedDate(e.start);
                return isSameDay(zonedStart, day);
              });

              // Calculate positions for overlapping events
              const positionedEvents = calculateEventPositions(dayEvents);

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "relative h-full",
                    dayIndex > 0 && "border-l border-border border-gray-300"
                  )}
                >
                  {/* Virtualized Grid Rows (Background) */}
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const hour = virtualRow.index;
                    const cellDate = new Date(day);
                    cellDate.setHours(hour, 0, 0, 0);
                    const cellId = cellDate.toISOString();

                    return (
                      <div
                        key={hour}
                        id={cellId}
                        className="absolute top-0 left-0 w-full border-b border-dashed border-gray-300 border-border/50 hover:bg-accent/30 transition-colors"
                        style={{
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        <div
                          className="w-full h-full"
                          onClick={() => onTimeSlotClick?.(cellDate)}
                        />
                      </div>
                    );
                  })}

                  {/* Events Overlay with collision detection */}
                  {positionedEvents.map(({ event, column, totalColumns }) => {
                    const zonedEventStart = getZonedDate(event.start);
                    const zonedEventEnd = getZonedDate(event.end);

                    const startMinutes =
                      zonedEventStart.getHours() * 60 +
                      zonedEventStart.getMinutes();
                    const durationMinutes = differenceInMinutes(
                      zonedEventEnd,
                      zonedEventStart
                    );

                    const top = (startMinutes / 60) * hourHeight;
                    const height = (durationMinutes / 60) * hourHeight;

                    const isSmall = height < 35;

                    // Calculate horizontal position for overlapping events
                    const eventStyle = getEventStyle({
                      event,
                      column,
                      totalColumns,
                    });

                    return (
                      <div
                        key={`${event.id}-${day.toISOString()}`}
                        className="absolute z-10 px-0.5"
                        style={{
                          top: `${top}px`,
                          left: eventStyle.left,
                          width: eventStyle.width,
                          height: `${Math.max(height, 22)}px`,
                        }}
                      >
                        {renderEvent ? (
                          <div
                            className="h-full cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEventClick?.(event);
                            }}
                          >
                            {renderEvent({
                              event,
                              view: "week",
                              onClick: () => onEventClick?.(event),
                            })}
                          </div>
                        ) : (
                          <div
                            className={cn(
                              "h-full rounded-lg shadow-sm transition-all duration-150 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] cursor-pointer group overflow-hidden backdrop-blur-sm",
                              !event.color && "bg-primary text-gray-500",
                              isSmall ? "px-2 flex items-center" : "p-2"
                            )}
                            style={{
                              backgroundColor: event.color
                                ? `${event.color}ee`
                                : undefined,
                              borderLeft: `3px solid ${
                                event.color
                                  ? "rgba(255,255,255,0.4)"
                                  : "rgba(255,255,255,0.5)"
                              }`,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEventClick?.(event);
                            }}
                          >
                            <div className="flex flex-col h-full">
                              <div
                                className={cn(
                                  "text-xs font-semibold truncate",
                                  event.color ? "text-white" : "text-gray-500",
                                  isSmall && "text-[10px]"
                                )}
                              >
                                {event.title}
                              </div>
                              {!isSmall && (
                                <div
                                  className={cn(
                                    "text-[10px] truncate mt-0.5 font-medium",
                                    event.color
                                      ? "text-white/80"
                                      : "text-primary-foreground/80"
                                  )}
                                >
                                  {format(zonedEventStart, "h:mm a")} -{" "}
                                  {format(zonedEventEnd, "h:mm a")}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Current Time Indicator */}
                  {isToday(day) && (
                    <div
                      className="absolute left-0 right-0 z-20 pointer-events-none flex items-center group"
                      style={{
                        top: `${
                          ((zonedNow.getHours() * 60 + zonedNow.getMinutes()) /
                            60) *
                          hourHeight
                        }px`,
                      }}
                    >
                      <div className="h-[2px] w-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
                      <div className="absolute -left-1.5 w-3 h-3 bg-primary rounded-full shadow-lg ring-2 ring-background pulse-dot" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Time Label (Left Axis) */}
        <div
          className="absolute left-0 w-16 pointer-events-none z-30 flex justify-end pr-2"
          style={{
            top: `${
              ((zonedNow.getHours() * 60 + zonedNow.getMinutes()) / 60) *
              hourHeight
            }px`,
          }}
        >
          <span className="text-[10px] font-bold text-gray-5000 bg-primary px-1.5 py-0.5 rounded-md shadow-md -translate-y-1/2 backdrop-blur-none">
            {format(zonedNow, "h:mm")}
          </span>
        </div>
      </div>
    </div>
  );
};
