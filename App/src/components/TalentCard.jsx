import { Link } from 'react-router-dom';
import { CheckCircle, Bookmark, MessageSquare, Sparkles } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { isTalentFavorited } from '../lib/ivaiConecta';
import { isGenericPlaceholderAvatar, getAvatarGradient } from '../services/chatService';

export default function TalentCard({ talent, isHighlighted = false }) {
  const { favoriteTalents = [], toggleFavoriteTalent, showToast, startChatWith, currentUser } = useAppStore();
  const { id, name, course, institution, city, avatar, skills = [], endorsements = [] } = talent;

  const isFavorite = isTalentFavorited(talent, favoriteTalents);

  const isSelf = Boolean(
    currentUser && (
      (currentUser.uid && talent.uid && String(currentUser.uid) === String(talent.uid)) ||
      (currentUser.id && talent.id && String(currentUser.id) === String(talent.id)) ||
      (currentUser.uid && talent.id && String(currentUser.uid) === String(talent.id)) ||
      (currentUser.id && talent.uid && String(currentUser.id) === String(talent.uid))
    )
  );

  const handleFavoriteToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const added = toggleFavoriteTalent(talent);
    showToast(added ? 'Talento salvo nos seus Favoritos!' : 'Talento removido dos Favoritos.');
  };

  return (
    <div className={`card gap-3 relative min-w-0 overflow-hidden w-full transition-all ${
      isHighlighted
        ? 'border-amber-300 dark:border-amber-600/70 bg-gradient-to-b from-amber-50/20 dark:from-amber-950/20 to-white dark:to-slate-900 shadow-brand-sm ring-1 ring-amber-400/20 hover:border-amber-400'
        : ''
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 min-w-0">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {avatar && !isGenericPlaceholderAvatar(avatar) ? (
            <img
              src={avatar}
              alt={name}
              className="w-11 h-11 rounded-full object-cover border border-gray-200 dark:border-slate-700 shrink-0 bg-white dark:bg-slate-800"
            />
          ) : (
            <div
              className={`w-11 h-11 rounded-full bg-gradient-to-tr ${getAvatarGradient(name)} text-white font-bold text-xs flex items-center justify-center shrink-0 border border-white/20 shadow-xs`}
            >
              {(name || 'T').slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight truncate">{name}</h3>
            <div className="text-xs font-semibold text-gray-800 dark:text-slate-200 mt-0.5 truncate">{course || 'Perfil em formação'}</div>
            <div className="text-xs text-gray-600 dark:text-slate-400 mt-0.5 truncate">{institution ? `${institution} · ` : ''}{city}</div>
          </div>
        </div>

        {/* Favorite Button */}
        <button
          onClick={handleFavoriteToggle}
          className={`p-1.5 rounded-full border transition-all shrink-0 cursor-pointer ${
            isFavorite
              ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-500 border-amber-300 dark:border-amber-700'
              : 'bg-white dark:bg-slate-800 text-gray-400 dark:text-slate-500 border-gray-200 dark:border-slate-700 hover:text-amber-500'
          }`}
          title={isFavorite ? 'Remover dos Favoritos' : 'Salvar Talento nos Favoritos'}
          aria-label="Favoritar talento"
        >
          <Bookmark size={15} className={isFavorite ? 'fill-amber-500' : ''} />
        </button>
      </div>

      {/* Endorsements, Student Verification Badges & Social Links */}
      <div className="flex items-center justify-between gap-1.5 flex-wrap min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          {isHighlighted && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 rounded-full shrink-0">
              <Sparkles size={11} className="text-amber-500 fill-amber-500" /> Destaque
            </span>
          )}
          {talent.isVerifiedStudent && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 rounded-full shrink-0">
              <CheckCircle size={11} /> Matrícula Verificada
            </span>
          )}
          {endorsements.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-primary-blue dark:text-blue-400 border border-blue-200/70 dark:border-blue-800/60 rounded-full shrink-0">
              <CheckCircle size={10} className="shrink-0" />
              {endorsements.length} Recomendaç{endorsements.length === 1 ? 'ão' : 'ões'}
            </span>
          )}
        </div>

        {/* Links diretos para LinkedIn e GitHub */}
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          {talent.linkedin && (
            <a
              href={talent.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#0A66C2] dark:text-blue-400 hover:bg-[#0A66C2] hover:text-white transition-colors"
              title="Acessar Perfil no LinkedIn"
              onClick={e => e.stopPropagation()}
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.78a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z"/></svg>
            </a>
          )}
          {talent.github && (
            <a
              href={talent.github}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
              title="Acessar GitHub"
              onClick={e => e.stopPropagation()}
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/></svg>
            </a>
          )}
        </div>
      </div>

      {/* Skills */}
      {skills.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 min-w-0">
          {skills.slice(0, 4).map(skill => (
            <span key={skill} className="tag truncate max-w-[130px]">{skill}</span>
          ))}
          {skills.length > 4 && (
            <span className="tag shrink-0">+{skills.length - 4}</span>
          )}
        </div>
      ) : (
        <div className="text-[11px] text-gray-400 dark:text-slate-500 italic">
          Competências em atualização
        </div>
      )}

      {/* Action */}
      <div className="mt-auto pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center gap-2 min-w-0">
        <Link
          to={`/perfil/${id}`}
          className="btn btn-outline btn-sm flex-1 min-w-0 text-xs font-bold text-gray-700 dark:text-slate-200 border-gray-300 dark:border-slate-700 text-center truncate"
        >
          Ver Perfil
        </Link>

        {/* Botão de Chat Direto com o Talento */}
        {!isSelf && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const targetEmail = talent.email || talent.studentEmail || '';
              const targetUid = talent.uid || talent.id || '';

              if (!targetEmail && !targetUid) {
                showToast('Perfil de talento não possui dados de contato vinculados.');
                return;
              }

              startChatWith({
                name,
                email: targetEmail,
                uid: targetUid,
                role: 'aluno',
                avatar: (avatar && !isGenericPlaceholderAvatar(avatar)) ? avatar : ''
              }, `Contato com Talento: ${name}`);
            }}
            className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-primary-blue dark:text-blue-400 hover:bg-primary-blue hover:text-white transition-colors shrink-0 flex items-center justify-center shadow-xs cursor-pointer"
            title={`Iniciar Chat com ${name}`}
            aria-label="Abrir chat com talento"
          >
            <MessageSquare size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
