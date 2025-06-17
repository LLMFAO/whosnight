import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getCalendarDays, formatDate, formatMonth, getAssignmentStyle, formatDisplayDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import DateAssignmentSheet from "./date-assignment-sheet";

export default function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAssignmentSheet, setShowAssignmentSheet] = useState(false);
  const queryClient = useQueryClient();

  const monthString = formatMonth(currentMonth);

  const { data: assignments = [] } = useQuery({
    queryKey: ["/api/calendar/assignments", monthString],
    queryFn: () => fetch(`/api/calendar/assignments/${monthString}`, {
      credentials: "include"
    }).then(res => res.json()),
  });
  
  // Ensure assignments is always an array
  const assignmentsArray = Array.isArray(assignments) ? assignments : [];
  


  // Fetch events for the current month to show indicators
  const { data: monthEvents = [] } = useQuery({
    queryKey: ["/api/events", monthString],
    queryFn: async () => {
      const calendarDays = getCalendarDays(currentMonth);
      const allEvents: any[] = [];
      
      // Fetch events for all days in the current month
      for (const { date, isCurrentMonth } of calendarDays) {
        if (isCurrentMonth) {
          const dateStr = formatDate(date);
          try {
            const response = await fetch(`/api/events/${dateStr}`);
            if (response.ok) {
              const events = await response.json();
              allEvents.push(...events);
            }
          } catch (error) {
            console.error(`Failed to fetch events for ${dateStr}:`, error);
          }
        }
      }
      return allEvents;
    },
  });

  const { data: eventsForSelectedDate = [] } = useQuery({
    queryKey: ["/api/events", selectedDate ? formatDate(selectedDate) : ""],
    enabled: !!selectedDate,
  });

  const assignmentMutation = useMutation({
    mutationFn: async (data: { date: string; assignedTo: string | null }) => {
      return await apiRequest("POST", "/api/calendar/assignments", data);
    },
    onMutate: async (newAssignment) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/calendar/assignments", monthString] });
      
      // Snapshot the previous value
      const previousAssignments = queryClient.getQueryData(["/api/calendar/assignments", monthString]);
      
      // Optimistically update to the new value
      queryClient.setQueryData(["/api/calendar/assignments", monthString], (old: any[]) => {
        const existingAssignments = old || [];
        const filteredAssignments = existingAssignments.filter((a: any) => a.date !== newAssignment.date);
        
        if (newAssignment.assignedTo) {
          return [...filteredAssignments, {
            date: newAssignment.date,
            assignedTo: newAssignment.assignedTo,
            status: "pending",
            id: Date.now(), // temporary ID
            createdBy: 1,
            createdAt: new Date().toISOString()
          }];
        }
        return filteredAssignments;
      });
      
      return { previousAssignments };
    },
    onError: (err, newAssignment, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(["/api/calendar/assignments", monthString], context?.previousAssignments);
    },
    onSuccess: () => {
      // Invalidate queries to get the real data from server
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/assignments", monthString] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pending"] });
      setShowAssignmentSheet(false);
    },
  });

  const calendarDays = getCalendarDays(currentMonth);
  const assignmentMap = new Map(assignmentsArray.map((a: any) => [a.date, a]));

  const momDaysCount = assignmentsArray.filter((a: any) => a.assignedTo === "mom").length;
  const dadDaysCount = assignmentsArray.filter((a: any) => a.assignedTo === "dad").length;

  const handleDateSelect = (date: Date, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return;
    setSelectedDate(date);
    setShowAssignmentSheet(true);
  };

  const handleAssignment = (assignedTo: string | null) => {
    if (!selectedDate) return;
    assignmentMutation.mutate({
      date: formatDate(selectedDate),
      assignedTo,
    });
  };

  const getDayStyle = (date: Date, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) {
      return "calendar-day touch-target h-12 bg-gray-50 rounded-lg flex items-center justify-center text-sm text-gray-400";
    }

    const assignment = assignmentMap.get(formatDate(date));
    const baseClasses = "calendar-day touch-target h-12 rounded-lg flex items-center justify-center text-sm font-medium relative";
    
    if (assignment) {
      const styleClass = getAssignmentStyle(assignment.assignedTo, assignment.status);
      return `${baseClasses} ${styleClass}`;
    }
    
    return `${baseClasses} unassigned-day`;
  };

  const hasEvents = (date: Date) => {
    const dateStr = formatDate(date);
    return monthEvents.some((event: any) => event.date === dateStr);
  };

  return (
    <div>
      {/* Calendar Header */}
      <div className="sticky top-0 bg-white border-b border-gray-100 z-10">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            className="touch-target"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-gray-900">
            {format(currentMonth, "MMMM yyyy")}
          </h1>
          <Button
            variant="ghost"
            size="icon"
            className="touch-target"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Parent Days Summary */}
        <div className="px-4 pb-4">
          <div className="bg-gray-50 rounded-xl p-3 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "var(--mom-primary)" }}></div>
              <span className="text-sm font-medium">Mom: {momDaysCount} days</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "var(--dad-primary)" }}></div>
              <span className="text-sm font-medium">Dad: {dadDaysCount} days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map(({ date, isCurrentMonth }, index) => (
            <button
              key={index}
              className={getDayStyle(date, isCurrentMonth)}
              onClick={() => handleDateSelect(date, isCurrentMonth)}
              disabled={!isCurrentMonth}
            >
              {format(date, "d")}
              {hasEvents(date) && isCurrentMonth && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-blue-400 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Date Assignment Sheet */}
      <DateAssignmentSheet
        open={showAssignmentSheet}
        onOpenChange={setShowAssignmentSheet}
        selectedDate={selectedDate}
        events={Array.isArray(eventsForSelectedDate) ? eventsForSelectedDate : []}
        onAssignment={handleAssignment}
        isLoading={assignmentMutation.isPending}
        currentAssignment={selectedDate ? assignmentMap.get(formatDate(selectedDate)) : undefined}
      />
    </div>
  );
}
