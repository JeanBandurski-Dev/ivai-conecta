/**
 * Auto-seeding disabled in production and test environments
 * All records in Firestore are now real dynamic data created by users.
 */
export async function forceSeedAllCollections() {
  return [];
}

export async function seedFirestoreIfEmpty() {
  // No-op: do not seed fake mock data
  return;
}

