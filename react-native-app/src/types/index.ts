export interface User {
  id: number;
  username: string;
  role: 'mom' | 'dad' | 'teen';
  createdAt: string;
}

export interface CalendarAssignment {
  id: number;
  date: string;
  assignedTo: string | null;
  status: 'pending' | 'confirmed';
  assignedBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: number;
  date: string;
  name: string;
  location: string | null;
  assignedTo: string | null;
  status: 'pending' | 'confirmed';
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  assignedTo: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  dueDate: string | null;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface TeenPermissions {
  id: number;
  teenUserId: number;
  canModifyAssignments: boolean;
  canAddEvents: boolean;
  canAddTasks: boolean;
  isReadOnly: boolean;
  modifiedBy: number;
  modifiedAt: string;
}