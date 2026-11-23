const { applicationDefault, initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

initializeApp({
  credential: applicationDefault(),
  projectId: "ivai-conecta-4a366"
});

const db = getFirestore();

function cleanString(value, maxLength) {
  return String(value || "").slice(0, maxLength);
}

function cleanList(value, maxLength = 100) {
  return Array.isArray(value) ? value.slice(0, maxLength) : [];
}

async function migratePublicProfiles() {
  const usersSnapshot = await db.collection("users").get();
  let migrated = 0;
  let skipped = 0;

  const batch = db.batch();
  let operations = 0;

  for (const userDoc of usersSnapshot.docs) {
    const data = userDoc.data();
    let role = String(data.role || data.activeRole || data.selectedRole || "").toLowerCase().trim();

    if (["company", "recrutador", "recruiter"].includes(role)) {
      role = "empresa";
    }

    if (!role || role === "admin" || role === "administrador") {
      skipped += 1;
      continue;
    }

    const publicProfile = {
      uid: userDoc.id,
      name: cleanString(data.name || data.displayName, 120),
      city: cleanString(data.city, 100),
      institution: cleanString(data.institution, 160),
      course: cleanString(data.course, 160),
      period: cleanString(data.period, 80),
      avatar: cleanString(data.avatar || data.photoURL, 2048),
      photoURL: cleanString(data.photoURL || data.avatar, 2048),
      skills: cleanList(data.skills),
      experiences: cleanList(data.experiences),
      projects: cleanList(data.projects),
      education: cleanList(data.education),
      bio: cleanString(data.bio, 1000),
      endorsements: cleanList(data.endorsements),
      endorsementCount: Math.max(0, Math.min(100, Number(data.endorsementCount || 0) || 0)),
      isVerifiedStudent: Boolean(data.isVerifiedStudent),
      razaoSocial: cleanString(data.razaoSocial, 120),
      nomeFantasia: cleanString(data.nomeFantasia, 120),
      sector: cleanString(data.sector, 160),
      about: cleanString(data.about, 1000),
      cnpj: FieldValue.delete(),
      isVerifiedCompany: Boolean(data.isVerifiedCompany),
      companyVerificationStatus: cleanString(data.companyVerificationStatus, 30),
      role,
      updatedAt: new Date().toISOString()
    };

    batch.set(db.doc(`public_profiles/${userDoc.id}`), publicProfile, { merge: true });
    operations += 1;
    migrated += 1;

    if (operations === 400) {
      await batch.commit();
      operations = 0;
    }
  }

  if (operations > 0) {
    await batch.commit();
  }

  console.log(JSON.stringify({ users: usersSnapshot.size, migrated, skipped }));
}

migratePublicProfiles().catch(error => {
  console.error(error);
  process.exit(1);
});
