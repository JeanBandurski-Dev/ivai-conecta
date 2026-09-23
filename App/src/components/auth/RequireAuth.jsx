import ProtectedRoute from './ProtectedRoute';

/**
 * RequireAuth Component (Alias para ProtectedRoute)
 * Garante que:
 * 1. O usuário esteja autenticado.
 * 2. O e-mail do usuário (user.emailVerified) seja true.
 *    - Se for false, bloqueia o acesso e exibe tela para verificação com botão "Já verifiquei"
 *      que executa auth.currentUser.reload().
 * 3. O usuário possua as roles necessárias (allowedRoles), se especificadas.
 */
export { ProtectedRoute };
export const RequireAuth = ProtectedRoute;
export default ProtectedRoute;
