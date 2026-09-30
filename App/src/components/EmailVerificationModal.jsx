import { useState, useEffect, useRef } from 'react';
import {
  Mail, CheckCircle2, AlertCircle, RefreshCw, X, ShieldCheck,
  Send, Loader2, Sparkles, KeyRound
} from 'lucide-react';
import { sendVerificationCode, confirmVerificationCode } from '../services/emailVerificationService';
import useAppStore from '../store/useAppStore';

/**
 * Modal de Verificação de E-mail com Código Numérico de 6 Dígitos
 */
export default function EmailVerificationModal({ isOpen, onClose, onVerified }) {
  const { currentUser, setCurrentUser, showToast } = useAppStore();

  const [step, setStep] = useState('input'); // 'sending' | 'input' | 'success'
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [expiresAt, setExpiresAt] = useState(null);
  const [remainingTime, setRemainingTime] = useState('');
  const [devCode, setDevCode] = useState(null);
  const [emailDispatched, setEmailDispatched] = useState(false);

  const inputRefs = useRef([]);

  // Inicializar refs
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 6);
  }, []);

  // Timer de cooldown (reenvio) e expiração (10 min)
  useEffect(() => {
    let interval = null;
    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldown]);

  useEffect(() => {
    if (!expiresAt) return;
    const updateRemaining = () => {
      const diff = expiresAt - Date.now();
      if (diff <= 0) {
        setRemainingTime('Expirado');
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setRemainingTime(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
      }
    };
    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  // Ao abrir o modal pela primeira vez, dispara o código automaticamente se ainda não tiver enviado
  useEffect(() => {
    if (isOpen && currentUser && !expiresAt && step === 'input') {
      handleSendCode();
    }
  }, [isOpen, currentUser]);

  if (!isOpen || !currentUser) return null;

  const handleSendCode = async () => {
    if (cooldown > 0 || sending) return;
    setSending(true);
    setError('');
    try {
      const res = await sendVerificationCode(currentUser);
      if (res.success) {
        setExpiresAt(res.expiresAt);
        setCooldown(60);
        setEmailDispatched(Boolean(res.emailDispatchedViaApi));
        if (res.devCode) {
          setDevCode(res.devCode);
        }
        showToast(res.message || 'Código de verificação gerado!');
        // Focar no primeiro dígito
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 150);
      } else {
        setError(res.error || 'Erro ao enviar código de verificação.');
        if (res.cooldownRemaining) {
          setCooldown(res.cooldownRemaining);
        }
      }
    } catch (err) {
      setError('Erro de conexão ao enviar o código. Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  const handlePaste = (e, targetIndex = 0) => {
    e.preventDefault();
    const pastedText = e.clipboardData?.getData('text') || '';
    const cleanVal = pastedText.replace(/\D/g, '');
    if (!cleanVal) return;

    const newDigits = [...digits];
    // Se o usuário colou 6 dígitos ou estava no primeiro campo, preenche desde o início
    const startIndex = cleanVal.length >= 6 ? 0 : targetIndex;
    const chars = cleanVal.slice(0, 6 - startIndex).split('');

    chars.forEach((char, i) => {
      const pos = startIndex + i;
      if (pos < 6) {
        newDigits[pos] = char;
      }
    });

    setDigits(newDigits);

    // Focar no último campo preenchido ou no próximo vazio
    const lastFilled = Math.min(startIndex + chars.length - 1, 5);
    const nextEmpty = newDigits.findIndex(d => !d);
    const focusIndex = nextEmpty !== -1 ? nextEmpty : lastFilled;
    setTimeout(() => {
      inputRefs.current[focusIndex]?.focus();
    }, 10);
  };

  const handleDigitChange = (index, value) => {
    const cleanVal = value.replace(/\D/g, '');

    // Se múltiplos dígitos foram inseridos de uma vez (ex: autofill do navegador)
    if (cleanVal.length > 1) {
      const pastedDigits = cleanVal.slice(0, 6).split('');
      const newDigits = [...digits];
      pastedDigits.forEach((d, i) => {
        if (i < 6) newDigits[i] = d;
      });
      setDigits(newDigits);
      const nextIndex = Math.min(pastedDigits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = cleanVal ? cleanVal.slice(-1) : '';
    setDigits(newDigits);

    // Auto-avanço para o próximo campo
    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Se já está vazio, volta para o anterior e foca
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleConfirmCode = async (e) => {
    if (e) e.preventDefault();
    const fullCode = digits.join('');
    if (fullCode.length !== 6) {
      setError('Digite todos os 6 dígitos do código recebido.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await confirmVerificationCode(currentUser, fullCode);
      if (res.success) {
        if (res.user) {
          setCurrentUser(res.user);
        }
        setStep('success');
        showToast('✅ E-mail verificado com sucesso!');
        if (typeof onVerified === 'function') {
          onVerified(res.user);
        }
      } else {
        setError(res.error || 'Código incorreto.');
      }
    } catch (err) {
      setError('Falha ao validar código. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="card max-w-md w-full p-6 sm:p-8 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 shadow-2xl relative">
        {/* Botão fechar */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Fechar"
        >
          <X size={18} />
        </button>

        {step === 'input' ? (
          <div>
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-primary-blue dark:text-blue-400 shrink-0 shadow-xs">
                <KeyRound size={22} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-xl text-primary-dark dark:text-white">
                  Verificar E-mail
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Código de segurança de 6 dígitos
                </p>
              </div>
            </div>

            {/* Informação do destinatário */}
            <div className="bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 mb-5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2 font-medium text-slate-800 dark:text-white mb-0.5">
                <Mail size={14} className="text-primary-blue dark:text-blue-400 shrink-0" />
                <span className="truncate">{currentUser.email}</span>
              </div>
              {emailDispatched ? (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
                  <CheckCircle2 size={13} className="shrink-0" />
                  E-mail com o código de 6 dígitos enviado com sucesso para a sua caixa de entrada!
                </p>
              ) : (
                <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">
                  Código de 6 dígitos gerado com validade de 10 minutos.
                </p>
              )}
            </div>

            {/* Aviso de erro */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Formulário dos 6 dígitos */}
            <form onSubmit={handleConfirmCode} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 text-center mb-2.5">
                  Digite o código de 6 dígitos
                </label>
                <div
                  className="flex justify-center items-center gap-2 sm:gap-2.5"
                  onPaste={e => handlePaste(e, 0)}
                >
                  {digits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={el => (inputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleDigitChange(idx, e.target.value)}
                      onKeyDown={e => handleKeyDown(idx, e)}
                      onPaste={e => handlePaste(e, idx)}
                      onFocus={e => e.target.select()}
                      autoFocus={idx === 0}
                      aria-label={`Dígito ${idx + 1} do código de verificação`}
                      className="w-11 h-13 sm:w-12 sm:h-14 text-center text-2xl font-bold font-mono rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-primary-blue dark:focus:border-blue-400 focus:ring-2 focus:ring-primary-blue/20 outline-hidden transition-all shadow-xs"
                    />
                  ))}
                </div>
                <p className="text-[11px] text-gray-400 dark:text-slate-500 text-center mt-2">
                  Dica: Você pode colar o código completo com <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 font-mono text-[10px] text-gray-600 dark:text-slate-300">Ctrl + V</kbd>
                </p>
              </div>

              {/* Informações de expiração */}
              {remainingTime && (
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400 px-1">
                  <span>
                    Código expira em: <strong className="text-gray-800 dark:text-slate-200 font-mono">{remainingTime}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={cooldown > 0 || sending}
                    className="text-primary-blue dark:text-blue-400 hover:underline font-semibold text-xs disabled:opacity-50 disabled:no-underline flex items-center gap-1 cursor-pointer"
                  >
                    {sending ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <RefreshCw size={12} className={cooldown > 0 ? '' : 'hover:rotate-180 transition-transform'} />
                    )}
                    <span>{cooldown > 0 ? `Reenviar em ${cooldown}s` : 'Reenviar código'}</span>
                  </button>
                </div>
              )}

              {/* Botões de Ação */}
              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={loading || digits.join('').length !== 6}
                  className="btn btn-primary w-full py-2.5 font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Validando código...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      Confirmar Código de Verificação
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Aviso de Ambiente Local / Dev */}
            {devCode && (
              <div className="mt-4 p-2.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/40 text-[11px] text-blue-800 dark:text-blue-300 flex items-center justify-between">
                <span>Código gerado para testes: <strong className="font-mono text-xs">{devCode}</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    setDigits(devCode.split(''));
                    inputRefs.current[5]?.focus();
                  }}
                  className="text-primary-blue dark:text-blue-400 font-bold hover:underline cursor-pointer text-[10px]"
                >
                  Preencher
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Estado de Sucesso */
          <div className="text-center py-4 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700 mx-auto flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-lg">
              <CheckCircle2 size={32} />
            </div>

            <div>
              <h3 className="font-heading font-bold text-2xl text-gray-900 dark:text-white">
                E-mail Confirmado!
              </h3>
              <p className="text-xs text-gray-600 dark:text-slate-300 mt-1 max-w-xs mx-auto">
                Seu endereço de e-mail foi verificado com sucesso no sistema. Sua conta agora está totalmente autenticada.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="btn btn-primary px-8 py-2.5 font-bold shadow-md cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
