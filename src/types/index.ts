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
  required_skills?: string[];
  type?: "design" | "code" | "content" | "deploy" | "planning" | "shop";
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
  source_url?: string;        // URL to existing site being rebuilt
  deployed_url?: string;     // Live deployed URL
  // Design tokens
  color_primary?: string;
  color_secondary?: string;
  color_accent?: string;
  color_background?: string;
  font_heading?: string;
  font_body?: string;
  logo_url?: string;
  design_vibe?: string;
}

export interface Goal {
  id: string;
  name: string;
  description: string;
  status: string;
  progress: number;
  created: string;
  updated: string;
  target_date: string | null;
  project: string | null;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: "idle" | "working" | "error" | "offline";
  description: string;
  avatar: string;
  paused: boolean;
  last_heartbeat: string | null;
  skills?: string[];
  department?: string;
  current_task?: string;
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
