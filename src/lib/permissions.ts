import type { Lead, SessionUser } from "./types";

export function canViewLead(user: SessionUser, lead: Lead): boolean {
  if (user.role === "admin") return true;
  if (user.role === "viewer") return true;
  return lead.ownerId === user.id;
}

export function canEditLead(user: SessionUser, lead: Lead): boolean {
  if (user.role === "viewer") return false;
  if (user.role === "admin") return true;
  return lead.ownerId === user.id;
}

export function canListAllLeads(user: SessionUser): boolean {
  return user.role === "admin" || user.role === "viewer";
}
