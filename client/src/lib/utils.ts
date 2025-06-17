import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  return format(date, "yyyy-MM-dd")
}

export function formatDisplayDate(date: Date): string {
  return format(date, "MMMM d, yyyy")
}

export function formatMonth(date: Date): string {
  return format(date, "yyyy-MM")
}

export function getCalendarDays(date: Date) {
  const start = startOfMonth(date)
  const end = endOfMonth(date)
  const days = eachDayOfInterval({ start, end })
  
  // Add padding days for previous month
  const startPadding = getDay(start) // 0 = Sunday
  const paddingDays = []
  
  for (let i = startPadding - 1; i >= 0; i--) {
    const paddingDate = new Date(start)
    paddingDate.setDate(paddingDate.getDate() - (i + 1))
    paddingDays.push({ date: paddingDate, isCurrentMonth: false })
  }
  
  // Add current month days
  const currentMonthDays = days.map(day => ({ date: day, isCurrentMonth: true }))
  
  // Add padding days for next month
  const totalCells = paddingDays.length + currentMonthDays.length
  const remainingCells = Math.ceil(totalCells / 7) * 7 - totalCells
  const endPaddingDays = []
  
  for (let i = 0; i < remainingCells; i++) {
    const paddingDate = new Date(end)
    paddingDate.setDate(paddingDate.getDate() + (i + 1))
    endPaddingDays.push({ date: paddingDate, isCurrentMonth: false })
  }
  
  return [...paddingDays, ...currentMonthDays, ...endPaddingDays]
}

export function generateShareableLink(linkId: string): string {
  // In production, this would use the actual domain
  const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'
  return `https://${domain}/share/${linkId}`
}

export function getAssignmentStyle(assignedTo: string | null, status: string) {
  if (!assignedTo) return "unassigned-day"
  
  const isPending = status === "pending"
  
  if (assignedTo === "mom") {
    return isPending ? "mom-day-pending" : "mom-day"
  } else if (assignedTo === "dad") {
    return isPending ? "dad-day-pending" : "dad-day"
  }
  
  return "unassigned-day"
}

export function getPendingItemsCount(pendingItems: any) {
  return (
    (pendingItems?.assignments?.length || 0) +
    (pendingItems?.events?.length || 0) +
    (pendingItems?.tasks?.length || 0) +
    (pendingItems?.expenses?.length || 0)
  )
}


