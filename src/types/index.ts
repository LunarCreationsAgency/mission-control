export interface Task {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high" | "critical";
  project?: string;
  goal?: string;
  due_date?: string;
  assignee?: string;
  created: string;
  updated: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  progress: number;
  icon: string;
  budget: number;
}

export interface Goal {
  id: string;
  name: string;
  description: string;
  status: string;
  progress: number;
  target_date: string | null;
  project: string | null;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: string;
  description: string;
  avatar: string;
  paused: boolean;
  last_heartbeat: string | null;
}

export interface ActivityLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  entity_name: string;
  details: string;
  created: string;
}

export interface CompanySettings {
  id: string;
  company_name: string;
  currency: string;
  timezone: string;
  logo_url: string | null;
}
