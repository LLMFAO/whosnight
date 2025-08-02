import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { User, X, Plus, MapPin, Clock, Edit, History, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/auth-provider";
import ChangeHistoryModal from "./change-history-modal";

interface DateAssignmentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  events: any[];
  onAssignment: (assignedTo: string | null) => void;
  isLoading: boolean;
  currentAssignment?: any;
}

export default function DateAssignmentSheet({
  open,
  onOpenChange,
  selectedDate,
  events,
  onAssignment,
  isLoading,
  currentAssignment,
}: DateAssignmentSheetProps) {
  const [showEventForm, setShowEventForm] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancellingEvent, setCancellingEvent] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [eventForm, setEventForm] = useState({
    name: "",
    time: "",
    location: "",
    description: "",
    children: [] as string[],
  });
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const eventMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!user?.id) throw new Error("User not authenticated");

      if (editingEvent) {
        // Update existing event
        const { error } = await supabase
          .from("events")
          .update({
            name: data.name,
            time: data.time || null,
            location: data.location || null,
            description: data.description || null,
            children: data.children || [],
            date: data.date,
          })
          .eq("id", editingEvent.id);

        if (error) throw error;
        return { id: editingEvent.id, ...data };
      } else {
        // Create new event
        const { data: newEvent, error } = await supabase
          .from("events")
          .insert({
            name: data.name,
            time: data.time || null,
            location: data.location || null,
            description: data.description || null,
            children: data.children || [],
            date: data.date,
            createdBy: user.id,
            status: "pending",
          })
          .select()
          .single();

        if (error) throw error;
        return newEvent;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["pending"] });
      setShowEventForm(false);
      setEditingEvent(null);
      setEventForm({ name: "", time: "", location: "", description: "", children: [] });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (data: { eventId: number; reason: string }) => {
      if (!user?.id) throw new Error("User not authenticated");

      // Update event status to cancelled instead of deleting
      const { error } = await supabase
        .from("events")
        .update({ status: "cancelled" })
        .eq("id", data.eventId);

      if (error) throw error;

      // Log the cancellation action
      const { error: logError } = await supabase
        .from("action_logs")
        .insert({
          userId: user.id,
          action: "cancel_event",
          entityType: "event",
          entityId: data.eventId,
          details: `Cancelled event with reason: ${data.reason}`,
        });

      if (logError) console.warn("Failed to log cancellation:", logError);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["pending"] });
      setShowCancelForm(false);
      setCancellingEvent(null);
      setCancelReason("");
    },
  });

  const handleDeleteEvent = (event: any) => {
    setCancellingEvent(event);
    setShowCancelForm(true);
  };

  const handleCancelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingEvent || !cancelReason.trim()) return;
    
    deleteEventMutation.mutate({
      eventId: cancellingEvent.id,
      reason: cancelReason.trim()
    });
  };

  const handleEditEvent = (event: any) => {
    setEditingEvent(event);
    setEventForm({
      name: event.name || "",
      time: event.time || "",
      location: event.location || "",
      description: event.description || "",
      children: event.children || [],
    });
    setShowEventForm(true);
  };

  const handleEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !eventForm.name.trim()) return;

    eventMutation.mutate({
      ...eventForm,
      date: formatDate(selectedDate),
    });
  };

  if (!selectedDate) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
          <SheetHeader className="text-center pb-4">
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-center gap-2">
              <SheetTitle className="text-lg font-semibold">
                {format(selectedDate, "MMMM d, yyyy")}
              </SheetTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistoryModal(true)}
                className="p-1 h-6 w-6"
              >
                <History className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-500">Assign night or add event</p>
          </SheetHeader>

          <div className="space-y-3 mb-6">
            <Button
              className="w-full h-12 text-white font-medium"
              style={{ backgroundColor: "var(--mom-primary)" }}
              onClick={() => onAssignment("mom")}
              disabled={isLoading}
            >
              <User className="w-4 h-4 mr-2" />
              Assign to Mom
            </Button>
            <Button
              className="w-full h-12 text-white font-medium"
              style={{ backgroundColor: "var(--dad-primary)" }}
              onClick={() => onAssignment("dad")}
              disabled={isLoading}
            >
              <User className="w-4 h-4 mr-2" />
              Assign to Dad
            </Button>
            <Button
              variant="outline"
              className="w-full h-12 font-medium"
              onClick={() => onAssignment(null)}
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-2" />
              Clear Assignment
            </Button>
            <Button
              variant="secondary"
              className="w-full h-12 font-medium"
              onClick={() => setShowEventForm(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
          </div>

          {/* Events for selected date */}
          {events && events.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Events on this date</h4>
              <div className="space-y-2">
                {events.map((event: any) => (
                  <div
                    key={event.id}
                    className={`border rounded-lg p-3 ${
                      event.status === "pending" 
                        ? "bg-blue-50 border-blue-200 border-dashed" 
                        : event.status === "cancelled"
                        ? "bg-red-50 border-red-200 border-dashed"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-sm font-medium text-blue-900">
                          {event.name}
                          {event.status === "pending" && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                              PENDING
                            </span>
                          )}
                          {event.status === "cancelled" && (
                            <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                              CANCELLED
                            </span>
                          )}
                        </h5>
                        <div className="flex items-center space-x-2 text-xs text-blue-700 mt-1">
                          {event.time && (
                            <div className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {event.time}
                            </div>
                          )}
                          {event.location && (
                            <div className="flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {event.location}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleEditEvent(event)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleDeleteEvent(event)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Event Creation Modal */}
      <Dialog open={showEventForm} onOpenChange={setShowEventForm}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle>{editingEvent ? "Edit Event" : "Add Event"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEventSubmit} className="space-y-4">
            <div>
              <Label htmlFor="event-name">Event Name *</Label>
              <Input
                id="event-name"
                value={eventForm.name}
                onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                placeholder="e.g., Soccer practice"
                required
              />
            </div>
            <div>
              <Label htmlFor="event-time">Time</Label>
              <Input
                id="event-time"
                type="time"
                value={eventForm.time}
                onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="event-location">Location</Label>
              <Input
                id="event-location"
                value={eventForm.location}
                onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                placeholder="e.g., Riverside Park"
              />
            </div>
            <div>
              <Label htmlFor="event-description">Description</Label>
              <Textarea
                id="event-description"
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                placeholder="Additional details..."
                rows={3}
              />
            </div>
            <div className="flex space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEventForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={eventMutation.isPending || !eventForm.name.trim()}
                className="flex-1"
              >
                {eventMutation.isPending ? "Adding..." : "Add Event"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Event Cancellation Modal */}
      <Dialog open={showCancelForm} onOpenChange={setShowCancelForm}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle>Cancel Event</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCancelSubmit} className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-3">
                You are requesting to cancel "{cancellingEvent?.name}". 
                Please provide a reason for the cancellation.
              </p>
              <Label htmlFor="cancel-reason">Reason for Cancellation *</Label>
              <Textarea
                id="cancel-reason"
                placeholder="Why are you canceling this event?"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                required
                className="mt-1"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCancelForm(false);
                  setCancellingEvent(null);
                  setCancelReason("");
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={deleteEventMutation.isPending || !cancelReason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {deleteEventMutation.isPending ? "Cancelling..." : "Request Cancellation"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change History Modal */}
      <ChangeHistoryModal
        open={showHistoryModal}
        onOpenChange={setShowHistoryModal}
        entityType="calendar_assignment"
        entityId={currentAssignment?.id || 0}
        entityName={format(selectedDate, "MMMM d, yyyy")}
      />
    </>
  );
}
