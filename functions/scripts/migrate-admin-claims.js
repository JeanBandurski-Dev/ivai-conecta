const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");

initializeApp({ credential: applicationDefault() });

async function migrateAdminClaims() {
  const db = getFirestore();
  const auth = getAuth();
  const snapshot = await db.collection("users").where("role", "==", "admin").get();

  let migrated = 0;
  let alreadyGranted = 0;
  const failures = [];

  for (const document of snapshot.docs) {
    const profile = document.data();
    if (profile.blocked === true || profile.status === "blocked") {
      continue;
    }
    const uid = document.id;
    try {
      const user = await auth.getUser(uid);
      if (user.customClaims?.admin === true) {
        alreadyGranted++;
        continue;
      }
      await auth.setCustomUserClaims(uid, {
        ...(user.customClaims || {}),
        admin: true
      });
      migrated++;
      console.log(`Claim administrativa concedida: ${uid}`);
    } catch (error) {
      failures.push({ uid, error: error.message });
      console.error(`Falha ao migrar ${uid}:`, error);
    }
  }

  console.log(JSON.stringify({
    adminProfilesFound: snapshot.size,
    migrated,
    alreadyGranted,
    failures
  }, null, 2));

  if (failures.length > 0) process.exitCode = 1;
}

migrateAdminClaims().catch((error) => {
  console.error("Falha na migração de claims administrativas:", error);
  process.exitCode = 1;
});
