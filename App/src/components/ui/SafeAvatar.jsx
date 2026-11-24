import { useState, useEffect } from 'react';
import { isGenericPlaceholderAvatar, getAvatarGradient } from '../../services/chatService';

function getInitials(name, length = 2) {
  const clean = String(name || '').trim();
  if (!clean) return 'U';
  const parts = clean.split(/\s+/).filter(Boolean);
  if (length === 1) return parts[0].charAt(0).toUpperCase();
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }
  return clean.slice(0, length).toUpperCase();
}

export function isRenderableImageUrl(src, { allowGenericPlaceholder = false } = {}) {
  if (!src || typeof src !== 'string') return false;
  const trimmed = src.trim();
  if (!trimmed) return false;
  if (!allowGenericPlaceholder && isGenericPlaceholderAvatar(trimmed)) return false;
  if (/^data:image\/[a-z0-9.+-]+;base64,[a-z0-9+/=\s]+$/i.test(trimmed)) return true;
  if (/^(https?:\/\/|blob:|\/)/i.test(trimmed)) return true;
  return false;
}

/**
 * Componente resiliente para fotos de perfil e logotipos.
 * - Usa referrerPolicy="no-referrer" (corrige fotos Google Auth 403/429)
 * - Reseta automaticamente o estado de erro quando `src` muda (ex: após novo upload)
 * - Faz fallback seguro para iniciais com gradiente ou imagem padrão sem exibir ícone de imagem quebrada
 */
export default function SafeAvatar({
  src,
  name = 'Usuário',
  alt,
  className = 'w-10 h-10 rounded-full',
  imgClassName = '',
  fallbackClassName = 'text-xs font-bold',
  initialsLength = 2,
  allowGenericPlaceholder = false,
  fallbackSrc = '',
}) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [src]);

  const canRenderPrimary = !imgError && isRenderableImageUrl(src, { allowGenericPlaceholder });

  if (canRenderPrimary) {
    return (
      <img
        src={src.trim()}
        alt={alt || name}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className={`${className} object-cover ${imgClassName}`.trim()}
      />
    );
  }

  if (fallbackSrc) {
    return (
      <img
        src={fallbackSrc}
        alt={alt || name}
        referrerPolicy="no-referrer"
        className={`${className} object-cover ${imgClassName}`.trim()}
      />
    );
  }

  return (
    <div
      aria-label={alt || name}
      className={`${className} bg-gradient-to-tr ${getAvatarGradient(name)} text-white flex items-center justify-center select-none ${fallbackClassName}`.trim()}
    >
      {getInitials(name, initialsLength)}
    </div>
  );
}
