document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegister = document.getElementById('show-register');
    const showLogin = document.getElementById('show-login');
    const authError = document.getElementById('auth-error');

    // Toggle forms
    if (showRegister) {
        showRegister.onclick = (e) => {
            e.preventDefault();
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
            authError.textContent = '';
        };
    }

    if (showLogin) {
        showLogin.onclick = (e) => {
            e.preventDefault();
            registerForm.style.display = 'none';
            loginForm.style.display = 'block';
            authError.textContent = '';
        };
    }

    // Login logic
    const btnLogin = document.getElementById('btn-login');
    if (btnLogin) {
        btnLogin.onclick = async () => {
            const user = document.getElementById('login-username').value.trim();
            const pass = document.getElementById('login-password').value.trim();

            if (!user || !pass) {
                authError.textContent = 'Ingresa usuario y contraseña';
                return;
            }

            // LOGIN DIRECTO PARA ANTONIO (SIN ESPERAR A SUPABASE)
            if (user.toLowerCase() === 'antonio' && pass === 'Asd123') {
                localStorage.setItem('currentUser', JSON.stringify({ id: 1, username: 'Antonio', role: 'Admin' }));
                window.location.href = 'index.html';
                return;
            }

            // Para otros usuarios, buscar en la DB
            try {
                const { data, error } = await window.supabaseClient
                    .from('users')
                    .select('*')
                    .eq('username', user)
                    .eq('password', pass);

                if (error) throw error;

                if (data && data.length > 0) {
                    localStorage.setItem('currentUser', JSON.stringify(data[0]));
                    window.location.href = 'index.html';
                } else {
                    authError.textContent = 'Usuario o contraseña incorrectos';
                }
            } catch (err) {
                console.error('Login error:', err);
                authError.textContent = 'Error de conexión';
            }
        };
    }

    // Register logic
    const btnRegister = document.getElementById('btn-register');
    if (btnRegister) {
        btnRegister.onclick = async () => {
            const user = document.getElementById('reg-username').value.trim();
            const pass = document.getElementById('reg-password').value.trim();

            if (!user || !pass) {
                authError.textContent = 'Completa los campos';
                return;
            }

            try {
                const { error } = await window.supabaseClient
                    .from('users')
                    .insert([{ username: user, password: pass, role: 'User' }]);

                if (error) throw new Error(error.message + ". Revisa SETUP_GUIDE.md.");

                await window.customAlert('Registro exitoso. Ahora puedes iniciar sesión.');
                showLogin.click();
            } catch (err) {
                console.error('Register error:', err);
                authError.textContent = 'Error al registrarse o el usuario ya existe';
            }
        };
    }
});

// Helper for protection
function checkAuth() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        window.location.href = 'login.html';
    }
    return user;
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}
