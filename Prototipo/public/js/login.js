//importando a camada de serviço firebase
import { loginUser, registerUser } from '../../src/database/auth-service.js';

let selectedRole = 'aluno';

document.addEventListener('DOMContentLoaded', () => {
    const alertBox = document.getElementById('authAlertBox');

    function showAlert(msg) {
        if (!alertBox) return;
        alertBox.textContent = msg;
        alertBox.style.display = 'block';
    }

    function hideAlert() {
        if (!alertBox) return;
        alertBox.style.display = 'none';
        alertBox.textContent = '';
    }

    // Role card click
    document.querySelectorAll('.role-card-option').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.role-card-option').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedRole = card.getAttribute('data-role');
        });
    });

    // Tabs switcher
    const tabLoginBtn = document.getElementById('tabLoginBtn');
    const tabRegisterBtn = document.getElementById('tabRegisterBtn');
    const authLoginForm = document.getElementById('authLoginForm');
    const authRegisterForm = document.getElementById('authRegisterForm');

    tabLoginBtn.addEventListener('click', () => {
        hideAlert();
        tabLoginBtn.classList.add('active');
        tabRegisterBtn.classList.remove('active');
        authLoginForm.style.display = 'block';
        authRegisterForm.style.display = 'none';
    });

    tabRegisterBtn.addEventListener('click', () => {
        hideAlert();
        tabRegisterBtn.classList.add('active');
        tabLoginBtn.classList.remove('active');
        authRegisterForm.style.display = 'block';
        authLoginForm.style.display = 'none';
    });

    // Submit Login com Validação Real
    authLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAlert();

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        //chamada limpa para a camada de serviço
        const response = await loginUser(email, password);

        if (!response.success) {
            let errorMessage = "Erro ao fazer login.";
            if (response.errorCode === 'auth/invalid-credential' || response.errorCode === 'auth/user-not-found' || response.errorCode === 'auth/wrong-password') {
                errorMessage = "E-mail ou senha inválidos.";
            }
            showAlert(errorMessage);
            return;
        }

        //se chegar aqui, login ok
        IvaiConecta.showToast('Login realizado com sucesso!');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 800);
    });

    // -----------------------------------------------------
    // SUBMIT CADASTRO REAL
    // -----------------------------------------------------
    authRegisterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAlert();

        const name = document.getElementById('regName').value;
        const email = document.getElementById('regEmail').value;
        const city = document.getElementById('regCity').value;
        const password = document.getElementById('regPassword').value;

        const additionalData = { name, city, role: selectedRole };

        //chamada limpa para a camada de serviço
        const response = await registerUser(email, password, additionalData);

        if (!response.success) {
            let errorMessage = "Erro ao criar conta.";
            if (response.errorCode === 'auth/email-already-in-use') {
                errorMessage = "Este e-mail já está em uso.";
            } else if (response.errorCode == 'auth/weak-password') {
                errorMessage = "A senha deve ter pelo menos 6 caracteres.";
            }
            showAlert(errorMessage);
            return;
        }

        //cadastro deu certo
        IvaiConecta.showToast('Conta criada com sucesso! Bem-vindo(a) ao Ivai Conecta.');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 800);
    });
});