
export type UserRole = 'student' | 'employer';

export enum WorkType {
  Physical = 'Fysiskt',
  Online = 'Online',
  Hybrid = 'Båda'
}

export enum ShiftType {
  Morning = 'Morgon',
  Day = 'Dag',
  Evening = 'Kväll',
  Weekend = 'Helg'
}

export interface StudentProfile {
  id: string;
  name: string;
  age: number;
  city: string;
  education: string;
  availability: ShiftType[];
  blockedDates: string[]; // ISO strings
  experienceTags: string[];
  workPreference: WorkType;
  verified: boolean;
  rating: number;
  jobsCompleted: number;
  level: number;
  badges: string[];
  reliabilityScore: number; // 0-100
  totalEarned: number;
  responseTime: string;
  favoriteJobs: string[];
}

export interface Job {
  id: string;
  title: string;
  company: string;
  employerId: string;
  city: string;
  hourlyRate: number;
  startTime: string;
  duration: string;
  workType: WorkType;
  shiftType: ShiftType;
  requirements: string[];
  employerRequirements: string[]; // New field for specific employer requirements
  description: string;
  workingConditions?: string;
  isQuickShift: boolean;
  isRecurring: boolean;
  isGroupJob: boolean;
  travelReimbursement: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  isRead: boolean;
}

export interface ChatSession {
  id: string;
  participantId: string;
  participantName: string;
  lastMessage: string;
  unreadCount: number;
}
