import type {
  ActivityType,
  IssuePriority,
  IssueStatus,
  IssueType,
  NotificationType,
  ProjectStatus,
  SprintStatus,
  UserRole,
} from "@/config/constants";

// ─── Base ─────────────────────────────────────────────────────────────────────

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

// ─── Workspace ────────────────────────────────────────────────────────────────

export interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  memberCount: number;
  projectCount: number;
}

export interface WorkspaceMemberWithUser {
  id: string;
  role: UserRole;
  joinedAt: Date;
  user: UserProfile;
}

// ─── Project ──────────────────────────────────────────────────────────────────

export interface ProjectSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: ProjectStatus;
  color: string;
  icon: string | null;
  issueCount: number;
  openIssueCount: number;
}

// ─── Issue ────────────────────────────────────────────────────────────────────

export interface IssueSummary {
  id: string;
  title: string;
  status: IssueStatus;
  priority: IssuePriority;
  type: IssueType;
  orderIndex: number;
  storyPoints: number | null;
  dueDate: Date | null;
  assignee: UserProfile | null;
  labels: LabelSummary[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IssueDetail extends IssueSummary {
  description: string | null;
  creator: UserProfile;
  sprint: SprintSummary | null;
  subIssues: IssueSummary[];
  commentCount: number;
  completedAt: Date | null;
}

// ─── Label ────────────────────────────────────────────────────────────────────

export interface LabelSummary {
  id: string;
  name: string;
  color: string;
}

// ─── Sprint ───────────────────────────────────────────────────────────────────

export interface SprintSummary {
  id: string;
  name: string;
  status: SprintStatus;
  startDate: Date;
  endDate: Date;
  issueCount: number;
  completedIssueCount: number;
}

// ─── Comment ──────────────────────────────────────────────────────────────────

export interface CommentWithAuthor {
  id: string;
  body: string;
  editedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  author: UserProfile;
}

// ─── Activity ─────────────────────────────────────────────────────────────────

export interface ActivityWithActor {
  id: string;
  type: ActivityType;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  actor: UserProfile;
}

// ─── Notification ────────────────────────────────────────────────────────────

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  resourceId: string | null;
  isRead: boolean;
  createdAt: Date;
}
