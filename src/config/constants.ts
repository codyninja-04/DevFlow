// ─── Enums (must mirror Prisma schema) ────────────────────────────────────────

export const USER_ROLES = {
  ADMIN: "ADMIN",
  MEMBER: "MEMBER",
  VIEWER: "VIEWER",
} as const;
export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const PROJECT_STATUSES = {
  ACTIVE: "ACTIVE",
  ARCHIVED: "ARCHIVED",
  PAUSED: "PAUSED",
} as const;
export type ProjectStatus =
  (typeof PROJECT_STATUSES)[keyof typeof PROJECT_STATUSES];

export const ISSUE_STATUSES = {
  BACKLOG: "BACKLOG",
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  IN_REVIEW: "IN_REVIEW",
  DONE: "DONE",
  CANCELLED: "CANCELLED",
} as const;
export type IssueStatus = (typeof ISSUE_STATUSES)[keyof typeof ISSUE_STATUSES];

export const ISSUE_PRIORITIES = {
  NO_PRIORITY: "NO_PRIORITY",
  URGENT: "URGENT",
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
} as const;
export type IssuePriority =
  (typeof ISSUE_PRIORITIES)[keyof typeof ISSUE_PRIORITIES];

export const ISSUE_TYPES = {
  TASK: "TASK",
  BUG: "BUG",
  FEATURE: "FEATURE",
  IMPROVEMENT: "IMPROVEMENT",
  EPIC: "EPIC",
  STORY: "STORY",
} as const;
export type IssueType = (typeof ISSUE_TYPES)[keyof typeof ISSUE_TYPES];

export const SPRINT_STATUSES = {
  PLANNED: "PLANNED",
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
} as const;
export type SprintStatus =
  (typeof SPRINT_STATUSES)[keyof typeof SPRINT_STATUSES];

export const NOTIFICATION_TYPES = {
  ISSUE_ASSIGNED: "ISSUE_ASSIGNED",
  ISSUE_COMMENTED: "ISSUE_COMMENTED",
  ISSUE_STATUS_CHANGED: "ISSUE_STATUS_CHANGED",
  MENTION: "MENTION",
  PROJECT_INVITE: "PROJECT_INVITE",
  SPRINT_STARTED: "SPRINT_STARTED",
  SPRINT_COMPLETED: "SPRINT_COMPLETED",
} as const;
export type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export const ACTIVITY_TYPES = {
  ISSUE_CREATED: "ISSUE_CREATED",
  ISSUE_UPDATED: "ISSUE_UPDATED",
  ISSUE_DELETED: "ISSUE_DELETED",
  ISSUE_ASSIGNED: "ISSUE_ASSIGNED",
  ISSUE_UNASSIGNED: "ISSUE_UNASSIGNED",
  STATUS_CHANGED: "STATUS_CHANGED",
  PRIORITY_CHANGED: "PRIORITY_CHANGED",
  COMMENT_ADDED: "COMMENT_ADDED",
  COMMENT_EDITED: "COMMENT_EDITED",
  COMMENT_DELETED: "COMMENT_DELETED",
  SPRINT_STARTED: "SPRINT_STARTED",
  SPRINT_COMPLETED: "SPRINT_COMPLETED",
  MEMBER_ADDED: "MEMBER_ADDED",
  MEMBER_REMOVED: "MEMBER_REMOVED",
} as const;
export type ActivityType =
  (typeof ACTIVITY_TYPES)[keyof typeof ACTIVITY_TYPES];

// ─── UI Label Maps ────────────────────────────────────────────────────────────

export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  BACKLOG: "Backlog",
  TODO: "Todo",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
  CANCELLED: "Cancelled",
};

export const ISSUE_PRIORITY_LABELS: Record<IssuePriority, string> = {
  NO_PRIORITY: "No Priority",
  URGENT: "Urgent",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

export const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  TASK: "Task",
  BUG: "Bug",
  FEATURE: "Feature",
  IMPROVEMENT: "Improvement",
  EPIC: "Epic",
  STORY: "Story",
};

// ─── Pagination ────────────────────────────────────────────────────────────────

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ─── Misc ─────────────────────────────────────────────────────────────────────

export const AVATAR_FALLBACK_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#0ea5e9",
] as const;
