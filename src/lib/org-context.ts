// Org context helper.
//
// BroadcastHub is multi-tenant, but for this self-hosted demo we operate on a
// single default organization. In production this would come from the
// authenticated session. All AI operations are still strictly org-scoped via
// this helper (spec #96).

import { db } from "@/lib/db";

const DEFAULT_ORG_SLUG = "broadcasthub";

export async function getDefaultOrgId(): Promise<string> {
  let org = await db.organization.findUnique({
    where: { slug: DEFAULT_ORG_SLUG },
  });
  if (!org) {
    org = await db.organization.create({
      data: { name: "BroadcastHub", slug: DEFAULT_ORG_SLUG },
    });
  }
  return org.id;
}

export async function getDefaultUserId(): Promise<string | null> {
  let user = await db.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) {
    user = await db.user.create({
      data: {
        email: "owner@broadcasthub.local",
        name: "Platform Owner",
        role: "admin",
      },
    });
  }
  return user.id;
}

/** Resolve the org + user for the current request (demo: defaults). */
export async function resolveContext() {
  const [organizationId, userId] = await Promise.all([
    getDefaultOrgId(),
    getDefaultUserId(),
  ]);
  return { organizationId, userId };
}
