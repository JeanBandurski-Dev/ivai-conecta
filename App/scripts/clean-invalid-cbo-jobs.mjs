/**
 * Script de Limpeza Automatizada de Vagas Fora do Padrão CBO no Firestore
 * Ivaí Conecta
 *
 * Uso:
 *   npm run clean:cbo -- <email-admin> <senha-admin>
 * Ou:
 *   npm run clean:cbo -- --dry-run (apenas lista sem apagar)
 */

import { db, auth } from '../src/lib/firebase.js';
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  query,
  where
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword
} from 'firebase/auth';
import { validateJobTitle } from '../src/services/jobTaxonomy.js';

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const positionalArgs = args.filter(a => !a.startsWith('--'));

const email = positionalArgs[0] || process.env.ADMIN_EMAIL;
const password = positionalArgs[1] || process.env.ADMIN_PASSWORD;

async function run() {
  console.log('🧹 [Ivaí Conecta] Iniciando auditoria e higienização CBO no Firestore...\n');

  if (!isDryRun) {
    if (!email || !password) {
      console.log('⚠️ Para apagar os documentos do Firestore, o script precisa autenticar como Admin.');
      console.log('Uso:');
      console.log('  npm run clean:cbo -- <email-admin> <senha-admin>\n');
      console.log('Dica: Para apenas listar sem apagar, use:');
      console.log('  npm run clean:cbo -- --dry-run\n');
    } else {
      try {
        console.log(`🔐 Autenticando como ${email}...`);
        await signInWithEmailAndPassword(auth, email, password);
        console.log('✅ Autenticado com sucesso!\n');
      } catch (authErr) {
        console.error('❌ Falha na autenticação Firebase:', authErr.message);
        process.exit(1);
      }
    }
  }

  try {
    const jobsRef = collection(db, 'jobs');
    const snap = await getDocs(jobsRef);
    console.log(`📋 Total de vagas encontradas no Firestore: ${snap.size}\n`);

    const invalidDocs = [];
    const validDocs = [];

    snap.docs.forEach(d => {
      const data = d.data();
      const title = String(data.title || '').trim();
      const validation = validateJobTitle(title);

      if (validation.valid) {
        validDocs.push({ id: d.id, title, company: data.company });
      } else {
        invalidDocs.push({
          id: d.id,
          title: title || '(sem título)',
          company: data.company || '(empresa não informada)',
          reason: validation.error
        });
      }
    });

    console.log(`✅ Vagas em conformidade com CBO (${validDocs.length}):`);
    validDocs.forEach(v => console.log(`   - "${v.title}" (${v.company || 'Empresa'}) [ID: ${v.id}]`));

    console.log(`\n❌ Vagas com títulos inválidos/fora da CBO (${invalidDocs.length}):`);
    invalidDocs.forEach(inv => {
      console.log(`   - "${inv.title}" [ID: ${inv.id}]`);
      console.log(`     Motivo: ${inv.reason}`);
    });

    if (invalidDocs.length === 0) {
      console.log('\n✨ Nenhuma vaga com título inválido encontrada. O banco está 100% higienizado!');
      process.exit(0);
    }

    if (isDryRun || (!email || !password)) {
      console.log(`\n🔍 Modo simulação: Nenhuma alteração foi gravada.`);
      console.log(`Para deletar essas ${invalidDocs.length} vagas definitivamente, informe suas credenciais de admin.`);
      process.exit(0);
    }

    console.log(`\n🗑️ Removendo ${invalidDocs.length} vagas inválidas do Firestore...`);
    let deletedCount = 0;

    for (const inv of invalidDocs) {
      try {
        await deleteDoc(doc(db, 'jobs', inv.id));
        console.log(`   ✔️ Vaga excluída: "${inv.title}" (ID: ${inv.id})`);

        // Remove candidaturas órfãs associadas a esta vaga
        try {
          const appsRef = collection(db, 'applications');
          const qApps = query(appsRef, where('jobId', '==', inv.id));
          const appSnap = await getDocs(qApps);
          for (const appDoc of appSnap.docs) {
            await deleteDoc(doc(db, 'applications', appDoc.id));
            console.log(`      ↪ Candidatura órfã removida: ${appDoc.id}`);
          }
        } catch {}

        deletedCount++;
      } catch (delErr) {
        console.error(`   ❌ Falha ao excluir ${inv.id}:`, delErr.message);
      }
    }

    console.log(`\n🎉 Concluído! ${deletedCount}/${invalidDocs.length} vagas fora do padrão CBO foram excluídas do Firestore.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro durante a operação:', err);
    process.exit(1);
  }
}

run();
