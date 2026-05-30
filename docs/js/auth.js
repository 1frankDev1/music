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

            // Bypass Antonio para evitar problemas de base de datos vacía o RLS
            if (user.toLowerCase() === 'antonio' && pass === 'Asd123') {
                const adminUser = { id: 1, username: 'Antonio', role: 'Admin' };
                localStorage.setItem('currentUser', JSON.stringify(adminUser));

                // Intentamos registrarlo en la DB por si no existe (silenciosamente)
                window.supabaseClient
                    .from('users')
                    .insert([{ id: 1, username: 'Antonio', password: 'Asd123', role: 'Admin' }])
                    .finally(() => {
                        window.location.href = 'index.html';
                    });

                // Redirigir de inmediato por si la DB tarda
                setTimeout(() => {
                    if (window.location.pathname.includes('login.html')) {
                        window.location.href = 'index.html';
                    }
                }, 800);
                return;
            }

            const { data, error } = await window.supabaseClient
                .from('users')
                .select('*')
                .eq('username', user)
                .eq('password', pass);

            if (error) {
                console.error('Login error:', error);
                authError.textContent = 'Error de conexión o tabla no lista';
            } else if (!data || data.length === 0) {
                authError.textContent = 'Usuario o contraseña incorrectos';
            } else {
                localStorage.setItem('currentUser', JSON.stringify(data[0]));
                window.location.href = 'index.html';
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

            // Check if exists
            const { data: existing, error: checkError } = await window.supabaseClient
                .from('users')
                .select('username')
                .eq('username', user);

            if (existing && existing.length > 0) {
                authError.textContent = 'El usuario ya existe';
                return;
            }

            const { error } = await window.supabaseClient
                .from('users')
                .insert([{ username: user, password: pass, role: 'User' }]);

            if (error) {
                console.error('Register error:', error);
                authError.textContent = 'Error al registrarse';
            } else {
                alert('Registro exitoso. Ahora puedes iniciar sesión.');
                showLogin.click();
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
