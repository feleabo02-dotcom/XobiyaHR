export enum WorkerType {
  EMPLOYEE = 'employee',
  CONTRACTOR = 'contractor',
  INTERN = 'intern',
  CONTINGENT = 'contingent',
}

export enum WorkerStatus {
  ACTIVE = 'active',
  ONBOARDING = 'onboarding',
  OFFBOARDING = 'offboarding',
  TERMINATED = 'terminated',
}

export interface Worker {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  workerType: WorkerType;
  hireDate: string;
  status: WorkerStatus;
  department: string;
  jobTitle: string;
  photoUrl?: string;
}

export enum PositionStatus {
  FILLED = 'filled',
  VACANT = 'vacant',
  FROZEN = 'frozen',
}

export interface Position {
  id: string;
  title: string;
  gradeCode: string;
  costCenterId: string;
  fte: number;
  status: PositionStatus;
}

export interface Assignment {
  id: string;
  workerId: string;
  positionId: string;
  startDate: string;
  endDate?: string;
  managerId?: string;
}

export enum RequisitionStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
}

export interface Requisition {
  id: string;
  positionId: string;
  budgetedSalary: number;
  status: RequisitionStatus;
}

export enum AbsenceType {
  VACATION = 'vacation',
  SICK = 'sick',
  PERSONAL = 'personal',
  MATERNITY = 'maternity',
  OTHER = 'other',
}

export enum AbsenceStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface AbsenceEntry {
  id: string;
  workerId: string;
  type: AbsenceType;
  startDate: string;
  endDate: string;
  status: AbsenceStatus;
  reason?: string;
}

export interface Timesheet {
  id: string;
  workerId: string;
  projectId: string;
  date: string;
  hours: number;
  billable: boolean;
}
