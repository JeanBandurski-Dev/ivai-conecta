const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const crypto = require("crypto");

initializeApp();
const db = getFirestore();

const AUTHORIZED_DOMAINS = new Set([
  "ifpr.edu.br",
  "estudante.ifpr.edu.br",
  "estudantes.ifpr.edu.br",
  "univale.edu.br",
  "faive.edu.br",
  "univale.com.br",
  "feati.edu.br",
  "faculdadeivaipora.com.br",
  "faculdadeivaipora.edu.br",
  "fatec.edu.br",
  "fatecivaipora.edu.br"
]);

function normalizeRole(role) {
  const value = String(role || "").toLowerCase().trim();
  return value === "student" || value === "estudante" ? "aluno" : value;
}

function domainFromEmail(email) {
  if (typeof email !== "string") return null;
  const clean = email.toLowerCase().trim();
  const at = clean.lastIndexOf("@");
  return at > 0 && at < clean.length - 1 ? clean.slice(at + 1) : null;
}

function hashCode(code) {
  return crypto.createHash("sha256").update(String(code)).digest("hex");
}

function randomCode() {
  return String(crypto.randomInt(100000, 1000000));
}

async function requireStudent(request) {
  if (!request.auth) throw new HttpsError("unauthenticated", "É necessário entrar na conta.");
  const uid = request.auth.uid;
  const userSnap = await db.doc(`users/${uid}`).get();
  if (!userSnap.exists) throw new HttpsError("not-found", "Perfil não encontrado.");
  const profile = userSnap.data();
  if (normalizeRole(profile.role) !== "aluno") {
    throw new HttpsError("failed-precondition", "Esta validação é exclusiva para contas de estudante.");
  }
  return { uid, profile };
}

exports.adminDeleteUser = onCall({ region: "us-central1" }, async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "É necessário entrar na conta.");
    const adminUid = request.auth.uid;
    const adminSnap = await db.doc(`users/${adminUid}`).get();
    const adminProfile = adminSnap.exists ? adminSnap.data() : null;
    const isAdmin =
      (adminProfile && adminProfile.role === "admin") ||
      request.auth.token.email === "admin@ivaiconecta.com.br";
    if (!isAdmin) throw new HttpsError("permission-denied", "Apenas administradores podem excluir usuários.");

    let targetUid = String(request.data?.uid || "").trim();
    const targetEmail = String(request.data?.email || "").toLowerCase().trim();
    if (!targetUid && targetEmail) {
      try {
        const authUser = await getAuth().getUserByEmail(targetEmail);
        targetUid = authUser.uid;
      } catch (emailError) {
        if (emailError.code === "auth/user-not-found") {
          return { success: true, alreadyRemoved: true };
        }
        throw emailError;
      }
    }
    if (!targetUid) throw new HttpsError("invalid-argument", "UID ou e-mail do usuário inválido.");
    if (targetUid === adminUid) throw new HttpsError("failed-precondition", "Use o fluxo próprio para excluir a própria conta.");

    await db.doc(`users/${targetUid}`).delete().catch(() => {});
    try {
      await getAuth().deleteUser(targetUid);
    } catch (authError) {
      if (authError.code !== "auth/user-not-found") throw authError;
    }

    const collections = [
      ["applications", "candidateUid"],
      ["favorites", "userUid"],
      ["chats", "participantUids"]
    ];
    for (const [collectionName, field] of collections) {
      try {
        const snapshot = await db.collection(collectionName).get();
        const batch = db.batch();
        let changed = false;
        for (const document of snapshot.docs) {
          const data = document.data();
          const matches = Array.isArray(data[field])
            ? data[field].includes(targetUid)
            : data[field] === targetUid;
          if (matches) {
            if (collectionName === "applications" || collectionName === "chats") {
              batch.delete(document.ref);
            } else {
              batch.delete(document.ref);
            }
            changed = true;
          }
        }
        if (changed) await batch.commit();
      } catch (cleanupError) {
        console.warn(`Falha ao limpar ${collectionName}:`, cleanupError);
      }
    }

    return { success: true };
  });

exports.syncGoogleStudentVerification = onCall({ region: "us-central1" }, async (request) => {
  const { uid, profile } = await requireStudent(request);
  const firebaseUser = await getAuth().getUser(uid);
  const googleProvider = (firebaseUser.providerData || []).some((provider) => provider.providerId === "google.com");
  const email = String(firebaseUser.email || "").toLowerCase().trim();
  const domain = domainFromEmail(email);

  if (!googleProvider || !firebaseUser.emailVerified || !AUTHORIZED_DOMAINS.has(domain)) {
    return { success: true, validated: false };
  }

  await db.doc(`users/${uid}`).set({
    isVerifiedStudent: true,
    institutionalValidationStatus: "VALIDADO",
    studentEmail: email,
    studentEmailDomain: domain,
    studentEmailVerifiedAt: FieldValue.serverTimestamp(),
    institution: profile.institution || "Instituição de Ensino",
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });

  return { success: true, validated: true };
});

exports.requestStudentVerificationCode = onCall({ region: "us-central1" }, async (request) => {
  const { uid, profile } = await requireStudent(request);
  const email = String(profile.studentEmail || profile.email || "").toLowerCase().trim();
  const domain = domainFromEmail(email);
  if (!AUTHORIZED_DOMAINS.has(domain)) {
    throw new HttpsError("failed-precondition", "O e-mail cadastrado não pertence a uma instituição autorizada.");
  }
  if (profile.isVerifiedStudent === true) {
    return { success: true, alreadyValidated: true };
  }

  const verificationRef = db.doc(`student_verifications/${uid}`);
  const verificationSnap = await verificationRef.get();
  const verification = verificationSnap.exists ? verificationSnap.data() : {};
  const now = Date.now();
  const lastSentAt = verification.lastSentAt?.toMillis ? verification.lastSentAt.toMillis() : 0;
  if (lastSentAt && now - lastSentAt < 60 * 1000) {
    throw new HttpsError("resource-exhausted", "Aguarde antes de solicitar um novo código.");
  }

  const code = randomCode();
  const expiresAt = new Date(now + 10 * 60 * 1000);
  await verificationRef.set({
    uid,
    email,
    codeHash: hashCode(code),
    expiresAt,
    used: false,
    attempts: 0,
    lastSentAt: FieldValue.serverTimestamp(),
    resendCount: Number(verification.resendCount || 0) + 1
  }, { merge: true });

  await db.collection("mail").add({
    to: [email],
    message: {
      subject: "Código de validação estudantil - Ivaí Conecta",
      text: `Seu código de validação é ${code}. Ele expira em 10 minutos.`,
      html: `<p>Seu código de validação é <strong>${code}</strong>.</p><p>Ele expira em 10 minutos.</p>`
    }
  });

  await db.doc(`users/${uid}`).set({
    institutionalValidationStatus: "PENDENTE",
    studentEmail: email,
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });

  return { success: true, expiresInSeconds: 600 };
});

exports.validateStudentVerificationCode = onCall({ region: "us-central1" }, async (request) => {
  const { uid } = await requireStudent(request);
  const code = String(request.data?.code || "").trim();
  if (!/^\d{6}$/.test(code)) {
    throw new HttpsError("invalid-argument", "Informe o código de 6 dígitos.");
  }

  const verificationRef = db.doc(`student_verifications/${uid}`);
  const verificationSnap = await verificationRef.get();
  if (!verificationSnap.exists) {
    throw new HttpsError("failed-precondition", "Solicite um código de validação.");
  }
  const verification = verificationSnap.data();
  if (verification.used) {
    throw new HttpsError("failed-precondition", "Este código já foi utilizado.");
  }
  const expiresAt = verification.expiresAt?.toMillis ? verification.expiresAt.toMillis() : new Date(verification.expiresAt).getTime();
  if (!expiresAt || expiresAt < Date.now()) {
    throw new HttpsError("failed-precondition", "O código expirou. Solicite um novo.");
  }
  if (Number(verification.attempts || 0) >= 5) {
    throw new HttpsError("resource-exhausted", "Limite de tentativas excedido. Solicite um novo código.");
  }

  if (hashCode(code) !== verification.codeHash) {
    await verificationRef.update({ attempts: FieldValue.increment(1) });
    throw new HttpsError("invalid-argument", "Código incorreto.");
  }

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(verificationRef);
    const current = snapshot.data();
    if (!snapshot.exists || current.used) {
      throw new HttpsError("failed-precondition", "Este código já foi utilizado.");
    }
    transaction.update(verificationRef, { used: true, usedAt: FieldValue.serverTimestamp() });
    transaction.set(db.doc(`users/${uid}`), {
      isVerifiedStudent: true,
      institutionalValidationStatus: "VALIDADO",
      studentEmailVerifiedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
  });

  return { success: true, validated: true };
});
