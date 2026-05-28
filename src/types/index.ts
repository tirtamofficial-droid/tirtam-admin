export type Department =
  | 'Packaging & Product'
  | 'Technology'
  | 'Marketing & Branding'
  | 'Legal & Finance'
  | 'Operations & Logistics'
  | 'Vendor & Procurement'
  | 'Website';

export type TaskStatus = 'Not started' | 'In Progress' | 'Blocked' | 'Review' | 'Completed';

export type Priority = 'Critical' | 'High' | 'Medium' | 'Low';

export type ViewMode = 'table' | 'pending' | 'high-priority' | 'completed';

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  department: Department;
}

export interface Task {
  id: string;
  name: string;
  description: string;
  owner: string;
  department: Department;
  priority: Priority;
  status: TaskStatus;
  deadline: string;
  notes: string;
  dependencies: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ActivityEntry {
  id: string;
  userId: string;
  userName: string;
  action: 'created' | 'updated' | 'completed' | 'moved' | 'assigned' | 'commented';
  taskId: string;
  taskName: string;
  details: string;
  timestamp: string;
  department: Department;
}

export interface WhatsAppConfig {
  enabled: boolean;
  sendTime: string;
  phoneNumber: string;
  groupName: string;
  lastSent: string | null;
}
