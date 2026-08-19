import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

export default function TalentCard({ talent }) {
  const { id, name, course, institution, city, avatar, skills = [], endorsements = [] } = talent;

  return (
    <div className="card gap-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        <img
          src={avatar}
          alt={name}
          className="w-11 h-11 rounded-full object-cover border border-gray-200 shrink-0"
        />
        <div className="min-w-0">
          <h3 className="text-base font-bold text-primary-dark leading-tight truncate">{name}</h3>
          <div className="text-xs font-semibold text-gray-800 mt-0.5">{course}</div>
          <div className="text-xs text-gray-500 mt-0.5 truncate">{institution} · {city}</div>
        </div>
      </div>

      {/* Endorsements badge */}
      {endorsements.length > 0 && (
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-green-50 text-green-700 border border-green-200 rounded-full">
            <CheckCircle size={11} className="shrink-0" />
            {endorsements.length} Recomendaç{endorsements.length === 1 ? 'ão' : 'ões'} Verificada{endorsements.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Skills */}
      <div className="flex flex-wrap gap-1.5">
        {skills.slice(0, 4).map(skill => (
          <span key={skill} className="tag">{skill}</span>
        ))}
        {skills.length > 4 && (
          <span className="tag">+{skills.length - 4}</span>
        )}
      </div>

      {/* Action */}
      <div className="mt-auto pt-3 border-t border-gray-100">
        <Link
          to={`/perfil/${id}`}
          className="btn btn-outline btn-sm w-full text-xs text-gray-700 border-gray-300"
        >
          Ver Perfil Completo
        </Link>
      </div>
    </div>
  );
}
