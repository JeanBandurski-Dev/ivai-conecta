const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");
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

const CLEANUP_PAGE_SIZE = 400;
const CLEANUP_BATCH_SIZE = 400;

function matchesTargetUid(data, fields, targetUid) {
  for (const field of fields) {
    const value = data?.[field];
    if (Array.isArray(value) && value.some((item) => String(item) === targetUid)) return true;
    if (value != null && String(value) === targetUid) return true;
  }
  return false;
}

async function commitDeleteRefs(refs) {
  for (let index = 0; index < refs.length; index += CLEANUP_BATCH_SIZE) {
    const batch = db.batch();
    for (const ref of refs.slice(index, index + CLEANUP_BATCH_SIZE)) {
      batch.delete(ref);
    }
    await batch.commit();
  }
}

async function deleteSubcollection(collectionRef, subcollectionName) {
  let lastDoc = null;
  while (true) {
    let query = collectionRef.collection(subcollectionName)
      .orderBy("__name__")
      .limit(CLEANUP_PAGE_SIZE);
    if (lastDoc) query = query.startAfter(lastDoc);

    const snapshot = await query.get();
    if (snapshot.empty) break;

    await commitDeleteRefs(snapshot.docs.map((document) => document.ref));
    lastDoc = snapshot.docs[snapshot.docs.length - 1];
    if (snapshot.size < CLEANUP_PAGE_SIZE) break;
  }
}

function chatMatchesTarget(chatData, targetUid, targetEmail) {
  const participants = Array.isArray(chatData?.participants) ? chatData.participants : [];
  const uidFields = ["participantUids", "participantIds", "userUid", "targetUid"];
  if (uidFields.some((field) => matchesTargetUid(chatData, [field], targetUid))) return true;
  if (!targetEmail) return false;
  return participants.some((participant) =>
    String(participant).toLowerCase().trim() === targetEmail
  );
}

function isChatParticipant(chatData, uid, email) {
  const participantUids = Array.isArray(chatData?.participantUids) ? chatData.participantUids : [];
  const participantIds = Array.isArray(chatData?.participantIds) ? chatData.participantIds : [];
  if (participantUids.includes(uid) || participantIds.includes(uid)) return true;
  const participants = Array.isArray(chatData?.participants) ? chatData.participants : [];
  return Boolean(email) && participants.some((participant) =>
    String(participant).toLowerCase().trim() === email
  );
}

async function isAdminRequest(request) {
  if (!request.auth) return false;
  if (request.auth.token.admin === true || normalizeRole(request.auth.token.role) === "admin") {
    return true;
  }
  const profileSnap = await db.doc(`users/${request.auth.uid}`).get();
  return profileSnap.exists && normalizeRole(profileSnap.data().role) === "admin";
}

function applicationIdFor(uid, jobId) {
  return `application_${crypto.createHash("sha256").update(`${uid}:${jobId}`).digest("hex").slice(0, 32)}`;
}

exports.createJobApplication = onCall({ region: "us-central1" }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "É necessário entrar na conta.");

  const data = request.data?.application;
  if (!data || typeof data !== "object") {
    throw new HttpsError("invalid-argument", "Dados da candidatura inválidos.");
  }

  const uid = request.auth.uid;
  const email = String(request.auth.token.email || "").toLowerCase().trim();
  const jobId = String(data.jobId || data.firestoreJobId || "").trim();
  if (!jobId || String(data.candidateUid || "") !== uid) {
    throw new HttpsError("invalid-argument", "A candidatura deve pertencer ao candidato autenticado.");
  }
  if (String(data.candidateEmail || "").toLowerCase().trim() !== email) {
    throw new HttpsError("invalid-argument", "O e-mail da candidatura não corresponde à conta autenticada.");
  }

  const applicationId = applicationIdFor(uid, jobId);
  const applicationRef = db.doc(`applications/${applicationId}`);
  const jobRef = db.doc(`jobs/${jobId}`);

  const result = await db.runTransaction(async (transaction) => {
    const [applicationSnap, jobSnap] = await Promise.all([
      transaction.get(applicationRef),
      transaction.get(jobRef),
    ]);

    if (applicationSnap.exists) {
      throw new HttpsError("already-exists", "Você já se candidatou a esta vaga.");
    }
    if (!jobSnap.exists) {
      throw new HttpsError("failed-precondition", "A vaga não existe mais.");
    }

    const job = jobSnap.data();
    if (String(job.status || "Ativa") !== "Ativa") {
      throw new HttpsError("failed-precondition", "A vaga não está ativa.");
    }
    if (String(data.recruiterUid || "") !== String(job.createdBy || "")) {
      throw new HttpsError("failed-precondition", "O recrutador informado não pertence à vaga.");
    }
    if (String(data.companyUid || "") !== String(job.createdBy || "")) {
      throw new HttpsError("failed-precondition", "A empresa informada não pertence à vaga.");
    }
    if (String(data.company || "") !== String(job.company || "")) {
      throw new HttpsError("failed-precondition", "Os dados da empresa não correspondem à vaga.");
    }
    if (String(data.title || "") !== String(job.title || "")) {
      throw new HttpsError("failed-precondition", "Os dados da vaga não correspondem à candidatura.");
    }
    if (job.recruiterEmail && String(data.recruiterEmail || "").toLowerCase().trim() !== String(job.recruiterEmail).toLowerCase().trim()) {
      throw new HttpsError("failed-precondition", "O recrutador informado não corresponde à vaga.");
    }

    const payload = {
      ...data,
      id: applicationId,
      firestoreId: applicationId,
      firestoreJobId: jobId,
      jobId,
      candidateUid: uid,
      candidateEmail: email,
      recruiterUid: String(job.createdBy || ""),
      companyUid: String(job.createdBy || ""),
      company: String(job.company || ""),
      title: String(job.title || ""),
      recruiterEmail: job.recruiterEmail
        ? String(job.recruiterEmail).toLowerCase().trim()
        : String(data.recruiterEmail || "").toLowerCase().trim(),
      status: String(data.status || "Candidatura Enviada"),
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _timestamp: FieldValue.serverTimestamp(),
    };

    transaction.set(applicationRef, payload);
    transaction.update(jobRef, {
      applicantsCount: FieldValue.increment(1),
      updatedAt: new Date().toISOString(),
    });
    return payload;
  });

  return { success: true, id: applicationId, application: result };
});

exports.withdrawJobApplication = onCall({ region: "us-central1" }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "É necessário entrar na conta.");

  const applicationId = String(request.data?.applicationId || "").trim();
  const jobId = String(request.data?.jobId || "").trim();
  if (!applicationId && !jobId) {
    throw new HttpsError("invalid-argument", "Candidatura inválida.");
  }

  const resolvedId = applicationId || applicationIdFor(request.auth.uid, jobId);
  const applicationRef = db.doc(`applications/${resolvedId}`);

  await db.runTransaction(async (transaction) => {
    const applicationSnap = await transaction.get(applicationRef);
    if (!applicationSnap.exists) return { alreadyWithdrawn: true };

    const application = applicationSnap.data();
    if (String(application.candidateUid || "") !== request.auth.uid) {
      throw new HttpsError("permission-denied", "Esta candidatura pertence a outro candidato.");
    }

    const withdrawn = ["Cancelada", "Desistente"].includes(String(application.status || ""));
    if (withdrawn) return { alreadyWithdrawn: true };

    const sourceJobId = String(application.jobId || jobId || "");
    if (!sourceJobId) {
      throw new HttpsError("failed-precondition", "A vaga da candidatura não foi identificada.");
    }

    const jobRef = db.doc(`jobs/${sourceJobId}`);
    const jobSnap = await transaction.get(jobRef);
    transaction.update(applicationRef, {
      status: "Cancelada",
      candidateWithdrawn: true,
      withdrawnAt: FieldValue.serverTimestamp(),
      updatedAt: new Date().toISOString(),
    });

    if (jobSnap.exists) {
      const currentCount = Number(jobSnap.data().applicantsCount || 0);
      transaction.update(jobRef, {
        applicantsCount: currentCount > 0 ? currentCount - 1 : 0,
        updatedAt: new Date().toISOString(),
      });
    }
    return { alreadyWithdrawn: false };
  });

  return { success: true };
});

exports.deleteChatThread = onCall({ region: "us-central1" }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "É necessário entrar na conta.");
  const threadId = String(request.data?.threadId || "").trim();
  if (!threadId) throw new HttpsError("invalid-argument", "Conversa inválida.");

  const threadRef = db.doc(`chats/${threadId}`);
  const threadSnap = await threadRef.get();
  if (!threadSnap.exists) return { success: true, alreadyRemoved: true, deletedMessages: 0 };

  const uid = request.auth.uid;
  const email = String(request.auth.token.email || "").toLowerCase().trim();
  const admin = await isAdminRequest(request);
  if (!admin && !isChatParticipant(threadSnap.data(), uid, email)) {
    throw new HttpsError("permission-denied", "Você não participa desta conversa.");
  }

  let deletedMessages = 0;
  let lastDoc = null;
  while (true) {
    let messagesQuery = threadRef.collection("messages")
      .orderBy("__name__")
      .limit(CLEANUP_PAGE_SIZE);
    if (lastDoc) messagesQuery = messagesQuery.startAfter(lastDoc);
    const snapshot = await messagesQuery.get();
    if (snapshot.empty) break;
    await commitDeleteRefs(snapshot.docs.map((document) => document.ref));
    deletedMessages += snapshot.size;
    lastDoc = snapshot.docs[snapshot.docs.length - 1];
    if (snapshot.size < CLEANUP_PAGE_SIZE) break;
  }
  await threadRef.delete();
  return { success: true, alreadyRemoved: false, deletedMessages };
});

exports.deleteUserChatThreads = onCall({ region: "us-central1" }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "É necessário entrar na conta.");
  const targetUid = String(request.data?.uid || request.auth.uid).trim();
  if (targetUid !== request.auth.uid && !(await isAdminRequest(request))) {
    throw new HttpsError("permission-denied", "Você não pode excluir conversas de outra conta.");
  }
  const targetEmail = String(request.auth.uid === targetUid
    ? request.auth.token.email || ""
    : "").toLowerCase().trim();

  let deletedThreads = 0;
  let deletedMessages = 0;
  let lastDoc = null;
  while (true) {
    let chatsQuery = db.collection("chats")
      .orderBy("__name__")
      .limit(CLEANUP_PAGE_SIZE);
    if (lastDoc) chatsQuery = chatsQuery.startAfter(lastDoc);
    const snapshot = await chatsQuery.get();
    if (snapshot.empty) break;

    for (const chatDoc of snapshot.docs) {
      if (!chatMatchesTarget(chatDoc.data(), targetUid, targetEmail)) continue;
      let messageLastDoc = null;
      while (true) {
        let messageQuery = chatDoc.ref.collection("messages")
          .orderBy("__name__")
          .limit(CLEANUP_PAGE_SIZE);
        if (messageLastDoc) messageQuery = messageQuery.startAfter(messageLastDoc);
        const messageSnapshot = await messageQuery.get();
        if (messageSnapshot.empty) break;
        await commitDeleteRefs(messageSnapshot.docs.map((document) => document.ref));
        deletedMessages += messageSnapshot.size;
        messageLastDoc = messageSnapshot.docs[messageSnapshot.docs.length - 1];
        if (messageSnapshot.size < CLEANUP_PAGE_SIZE) break;
      }
      await chatDoc.ref.delete();
      deletedThreads += 1;
    }
    lastDoc = snapshot.docs[snapshot.docs.length - 1];
    if (snapshot.size < CLEANUP_PAGE_SIZE) break;
  }
  return { success: true, deletedThreads, deletedMessages };
});

async function deleteMatchingCollection(collectionName, fields, targetUid, subcollections = []) {
  let lastDoc = null;
  let deleted = 0;

  while (true) {
    let query = db.collection(collectionName)
      .orderBy("__name__")
      .limit(CLEANUP_PAGE_SIZE);
    if (lastDoc) query = query.startAfter(lastDoc);

    const snapshot = await query.get();
    if (snapshot.empty) break;

    const refsToDelete = [];
    for (const document of snapshot.docs) {
      if (!matchesTargetUid(document.data(), fields, targetUid)) continue;
      for (const subcollectionName of subcollections) {
        await deleteSubcollection(document.ref, subcollectionName);
      }
      refsToDelete.push(document.ref);
      deleted += 1;
    }

    await commitDeleteRefs(refsToDelete);
    lastDoc = snapshot.docs[snapshot.docs.length - 1];
    if (snapshot.size < CLEANUP_PAGE_SIZE) break;
  }

  return deleted;
}

async function deleteUserStorage(targetUid) {
  const bucket = getStorage().bucket();
  const prefix = `users/${targetUid}/`;
  const [files] = await bucket.getFiles({ prefix, autoPaginate: true });
  for (const file of files) {
    await file.delete({ ignoreNotFound: true });
  }
  return files.length;
}

exports.setUserAdminRole = onCall({ region: "us-central1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "É necessário entrar na conta.");
  }
  if (!(await isAdminRequest(request))) {
    throw new HttpsError("permission-denied", "Apenas administradores podem alterar funções administrativas.");
  }

  const targetUid = String(request.data?.uid || "").trim();
  const role = normalizeRole(request.data?.role);
  const allowedRoles = new Set(["aluno", "empresa", "professor", "freelancer", "admin", "candidato"]);
  if (!targetUid) {
    throw new HttpsError("invalid-argument", "Usuário inválido.");
  }
  if (!allowedRoles.has(role)) {
    throw new HttpsError("invalid-argument", "Função inválida.");
  }

  const targetRef = db.doc(`users/${targetUid}`);
  const targetSnap = await targetRef.get();
  if (!targetSnap.exists) {
    throw new HttpsError("not-found", "Perfil não encontrado.");
  }

  const currentRole = normalizeRole(targetSnap.data().role);
  if (currentRole === "admin" && role !== "admin") {
    const activeAdmins = await db.collection("users")
      .where("role", "==", "admin")
      .get();
    const removableAdmins = activeAdmins.docs.filter((document) =>
      document.id !== targetUid &&
      document.data().blocked !== true &&
      document.data().status !== "blocked"
    );
    if (removableAdmins.length === 0) {
      throw new HttpsError("failed-precondition", "Não é permitido rebaixar o único administrador ativo.");
    }
  }

  const authUser = await getAuth().getUser(targetUid);
  const currentClaims = authUser.customClaims || {};
  const isAdmin = role === "admin";
  const updatedClaims = { ...currentClaims, admin: isAdmin };

  try {
    await getAuth().setCustomUserClaims(targetUid, updatedClaims);
  } catch (claimError) {
    throw new HttpsError("internal", "Não foi possível atualizar a autorização administrativa.", claimError);
  }

  try {
    await targetRef.update({
      role,
      roleUpdatedAt: new Date().toISOString()
    });
  } catch (profileError) {
    const rollbackClaims = { ...currentClaims };
    if (!Object.prototype.hasOwnProperty.call(currentClaims, "admin")) {
      delete rollbackClaims.admin;
    } else {
      rollbackClaims.admin = currentClaims.admin;
    }
    await getAuth().setCustomUserClaims(targetUid, rollbackClaims);
    throw new HttpsError("internal", "Não foi possível atualizar a função do usuário.", profileError);
  }

  return { success: true, uid: targetUid, role, admin: isAdmin };
});

exports.moderateServiceStatus = onCall({ region: "us-central1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "É necessário entrar na conta.");
  }
  if (!(await isAdminRequest(request))) {
    throw new HttpsError("permission-denied", "Apenas administradores podem moderar serviços.");
  }

  const serviceId = String(request.data?.serviceId || "").trim();
  const action = String(request.data?.action || "").trim();
  if (!serviceId) {
    throw new HttpsError("invalid-argument", "ID de serviço inválido.");
  }
  if (!["pause", "activate"].includes(action)) {
    throw new HttpsError("invalid-argument", "Ação de moderação inválida.");
  }

  const serviceRef = db.doc(`services/${serviceId}`);
  const serviceSnap = await serviceRef.get();
  if (!serviceSnap.exists) {
    throw new HttpsError("not-found", "Serviço não encontrado.");
  }

  const newStatus = action === "pause" ? "paused" : "active";
  await serviceRef.update({
    status: newStatus,
    moderatedAt: FieldValue.serverTimestamp()
  });

  return {
    success: true,
    status: newStatus,
    message: `Serviço ${newStatus === "active" ? "ativado" : "pausado"} com sucesso.`
  };
});

exports.adminDeleteUser = onCall({ region: "us-central1" }, async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "É necessário entrar na conta.");
    const adminUid = request.auth.uid;
    const isAdmin = request.auth.token.admin === true;
    if (!isAdmin) throw new HttpsError("permission-denied", "Apenas administradores podem excluir usuários.");

    let targetUid = String(request.data?.uid || "").trim();
    const targetEmail = String(request.data?.email || "").toLowerCase().trim();
    if (!targetUid && targetEmail) {
      try {
        const authUser = await getAuth().getUserByEmail(targetEmail);
        targetUid = authUser.uid;
      } catch (emailError) {
        if (emailError.code === "auth/user-not-found") {
          const profileSnapshot = await db.collection("users")
            .where("email", "==", targetEmail)
            .limit(1)
            .get();
          if (profileSnapshot.empty) {
            return { success: true, alreadyRemoved: true, cleanupFinished: true };
          }
          targetUid = profileSnapshot.docs[0].id;
        }
        throw emailError;
      }
    }
    if (!targetUid) throw new HttpsError("invalid-argument", "UID ou e-mail do usuário inválido.");
    if (targetUid === adminUid) throw new HttpsError("failed-precondition", "Use o fluxo próprio para excluir a própria conta.");

    await db.doc(`users/${targetUid}`).delete();

    const cleanupRules = [
      ["applications", ["candidateUid", "candidateId", "studentUid", "studentId"]],
      ["favorites", ["userUid", "userId", "ownerUid"]],
      ["chats", ["participantUids", "participantIds", "userUid", "targetUid"]],
      ["jobs", ["createdBy", "companyUid", "ownerUid"]],
      ["services", ["createdBy", "providerUid", "providerId", "ownerUid"]],
      ["service_orders", ["clientUid", "clientId", "buyerUid", "providerUid", "providerId"]],
      ["service_reviews", ["authorUid", "userUid", "clientUid", "clientId", "providerUid", "providerId"]],
      ["talents", ["uid", "userUid", "talentUid", "ownerUid"]],
      ["endorsement_requests", ["studentId", "studentUid", "profUid", "profId", "requesterUid", "targetTeacherId"]],
      ["mail", ["to", "email", "recipientUid", "recipientEmail", "userUid", "userId"]],
      ["presence", ["uid", "userUid"]]
    ];

    const pendingCollections = [];
    const deletedDocuments = {};
    for (const [collectionName, fields] of cleanupRules) {
      try {
        const subcollections = collectionName === "chats" ? ["messages"] : [];
        deletedDocuments[collectionName] = await deleteMatchingCollection(
          collectionName,
          fields,
          targetUid,
          subcollections
        );
      } catch (cleanupError) {
        pendingCollections.push(collectionName);
        console.error(`Falha na limpeza paginada de ${collectionName}:`, cleanupError);
      }
    }

    let storagePending = false;
    let deletedStorageFiles = 0;
    try {
      deletedStorageFiles = await deleteUserStorage(targetUid);
    } catch (storageError) {
      storagePending = true;
      console.error(`Falha ao limpar arquivos de Storage do usuário ${targetUid}:`, storageError);
    }

    let authDeletionPending = false;
    try {
      await getAuth().deleteUser(targetUid);
    } catch (authError) {
      if (authError.code === "auth/user-not-found") {
        authDeletionPending = false;
      } else {
        authDeletionPending = true;
        console.error(`Falha ao excluir autenticação do usuário ${targetUid}:`, authError);
      }
    }

    const cleanupPending = pendingCollections.length > 0 || storagePending || authDeletionPending;
    return {
      success: !cleanupPending,
      cleanupFinished: !cleanupPending,
      cleanupPending,
      pendingCollections,
      authDeletionPending,
      deletedDocuments,
      deletedStorageFiles
    };
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

exports.submitServiceReview = onCall({ region: "us-central1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "É necessário entrar na conta.");
  }

  const orderId = String(request.data?.orderId || "").trim();
  const rating = Number(request.data?.rating);
  const comment = String(request.data?.comment || "").trim();
  if (!orderId) throw new HttpsError("invalid-argument", "Ordem de serviço inválida.");
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new HttpsError("invalid-argument", "A nota deve ser um inteiro entre 1 e 5.");
  }
  if (comment.length < 15 || comment.length > 500) {
    throw new HttpsError("invalid-argument", "O comentário deve ter entre 15 e 500 caracteres.");
  }

  const uid = request.auth.uid;
  const email = String(request.auth.token.email || "").toLowerCase().trim();
  const orderRef = db.doc(`service_orders/${orderId}`);
  const reviewRef = db.doc(`service_reviews/${orderId}`);

  const orderSnap = await orderRef.get();
  if (!orderSnap.exists) throw new HttpsError("not-found", "Ordem de serviço não encontrada.");
  const order = orderSnap.data();

  const isClient =
    order.clientUid === uid ||
    order.clientId === uid ||
    (email && order.clientEmail && String(order.clientEmail).toLowerCase().trim() === email);
  if (!isClient) throw new HttpsError("permission-denied", "Somente o cliente da ordem pode avaliá-la.");

  const status = String(order.status || "").toLowerCase().trim();
  if (!["concluido", "concluído", "avaliado"].includes(status)) {
    throw new HttpsError("failed-precondition", "A avaliação só pode ser enviada após a conclusão do serviço.");
  }

  const providerUid = String(order.providerUid || order.providerId || "").trim();
  if (providerUid && providerUid === uid) {
    throw new HttpsError("permission-denied", "O prestador não pode avaliar a própria prestação.");
  }

  const serviceId = String(order.serviceId || "").trim();
  if (!serviceId) throw new HttpsError("failed-precondition", "A ordem não está vinculada a um serviço.");

  const userSnap = await db.doc(`users/${uid}`).get();
  const user = userSnap.exists ? userSnap.data() : {};
  const author = String(user.name || request.auth.token.name || "Cliente Ivaí Conecta").trim();
  const avatar = String(user.avatar || "").trim();
  const serviceRef = db.doc(`services/${serviceId}`);
  const chatRef = db.doc(`chats/${orderId}`);

  const result = await db.runTransaction(async (transaction) => {
    const [currentReviewSnap, serviceSnap, chatSnap, reviewsSnap] = await Promise.all([
      transaction.get(reviewRef),
      transaction.get(serviceRef),
      transaction.get(chatRef),
      transaction.get(db.collection("service_reviews").where("serviceId", "==", serviceId))
    ]);

    if (currentReviewSnap.exists) {
      throw new HttpsError("already-exists", "Esta ordem já possui uma avaliação.");
    }
    if (!serviceSnap.exists) throw new HttpsError("not-found", "Serviço não encontrado.");

    const reviewData = {
      orderId,
      serviceId,
      providerUid,
      reviewerUid: uid,
      reviewerEmail: email,
      rating,
      stars: rating,
      comment,
      author,
      client: author,
      avatar,
      date: new Date().toLocaleDateString("pt-BR"),
      timestamp: FieldValue.serverTimestamp()
    };

    const reviewDocuments = reviewsSnap.docs
      .map((document) => document.data())
      .filter((review) => Number.isInteger(review.rating) && review.rating >= 1 && review.rating <= 5);

    const allReviews = [...reviewDocuments, reviewData];
    const reviewsCount = allReviews.length;
    const average = Number(
      (allReviews.reduce((sum, review) => sum + Number(review.rating), 0) / reviewsCount).toFixed(1)
    );
    const publicReviews = allReviews
      .slice()
      .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
      .map((review) => ({
        orderId: review.orderId,
        rating: review.rating,
        stars: review.stars || review.rating,
        comment: review.comment,
        author: review.author || "Cliente Ivaí Conecta",
        client: review.client || review.author || "Cliente Ivaí Conecta",
        avatar: review.avatar || "",
        date: review.date || "",
        timestamp: typeof review.timestamp === "number" ? review.timestamp : null
      }));

    transaction.set(reviewRef, reviewData);
    transaction.update(orderRef, {
      review: reviewData,
      rating,
      status: "avaliado",
      updatedAt: FieldValue.serverTimestamp()
    });
    transaction.update(serviceRef, {
      rating: average,
      reviewsCount,
      reviewCount: reviewsCount,
      reviews: publicReviews,
      updatedAt: FieldValue.serverTimestamp()
    });
    if (chatSnap.exists) {
      transaction.set(chatRef, {
        serviceOrder: {
          review: reviewData,
          rating,
          status: "avaliado"
        },
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
    }

    return {
      success: true,
      review: {
        orderId,
        rating,
        stars: rating,
        comment,
        author,
        client: author,
        avatar,
        date: reviewData.date,
        timestamp: Date.now()
      },
      rating: average,
      reviewsCount
    };
  });

  return result;
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
  const userRef = db.doc(`users/${uid}`);
  let incorrectCode = false;

  await db.runTransaction(async (transaction) => {
    incorrectCode = false;
    const [verificationSnapshot, userSnapshot] = await Promise.all([
      transaction.get(verificationRef),
      transaction.get(userRef)
    ]);

    if (!verificationSnapshot.exists) {
      throw new HttpsError("failed-precondition", "Solicite um código de validação.");
    }
    if (!userSnapshot.exists) {
      throw new HttpsError("not-found", "Perfil não encontrado.");
    }

    const current = verificationSnapshot.data();
    const user = userSnapshot.data();
    if (normalizeRole(user.role) !== "aluno") {
      throw new HttpsError("failed-precondition", "Esta validação é exclusiva para contas de estudante.");
    }
    if (!current.uid || String(current.uid) !== uid) {
      throw new HttpsError("permission-denied", "O código não pertence a esta conta.");
    }
    if (current.used) {
      throw new HttpsError("failed-precondition", "Este código já foi utilizado.");
    }

    const expiresAt = current.expiresAt?.toMillis
      ? current.expiresAt.toMillis()
      : new Date(current.expiresAt).getTime();
    if (!expiresAt || expiresAt < Date.now()) {
      throw new HttpsError("failed-precondition", "O código expirou. Solicite um novo.");
    }

    const attempts = Number(current.attempts || 0);
    if (attempts >= 5) {
      throw new HttpsError("resource-exhausted", "Limite de tentativas excedido. Solicite um novo código.");
    }

    if (hashCode(code) !== current.codeHash) {
      transaction.update(verificationRef, { attempts: FieldValue.increment(1) });
      incorrectCode = true;
      return;
    }

    transaction.update(verificationRef, { used: true, usedAt: FieldValue.serverTimestamp() });
    transaction.set(userRef, {
      isVerifiedStudent: true,
      institutionalValidationStatus: "VALIDADO",
      studentEmailVerifiedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
  });

  if (incorrectCode) {
    throw new HttpsError("invalid-argument", "Código incorreto.");
  }

  return { success: true, validated: true };
});
