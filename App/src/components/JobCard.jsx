import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';

export default function JobCard({ job, matchScore }) {
  const { id, title, company, city, type, requiredSkills = [] } = job;
  const isHighMatch = matchScore >= 75;

  return (
    <div className="card gap-3">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="font-bold text-primary-dark text-base leading-tight">{company}</div>
        {matchScore != null && (
          <span className={`badge-match shrink-0 ${isHighMatch ? 'badge-match-high' : ''}`}>
            {matchScore}% Match
          </span>
        )}
      </div>

      <h3 className="text-base font-semibold text-gray-800 leading-snug">{title}</h3>

      <div className="flex items-center gap-1 text-sm text-gray-500">
        <MapPin size={13} className="shrink-0" />
        <span>{city}</span>
        <span className="text-gray-300">·</span>
        <span>{type}</span>
      </div>

      {/* Skills */}
      <div className="flex flex-wrap gap-1.5">
        {requiredSkills.map(skill => (
          <span key={skill} className="tag">{skill}</span>
        ))}
      </div>

      {/* Action */}
      <div className="mt-auto pt-3 border-t border-gray-100">
        <Link to={`/vagas?jobId=${id}`} className="btn btn-primary btn-sm w-full text-xs">
          Ver Detalhes da Vaga
        </Link>
      </div>
    </div>
  );
}
