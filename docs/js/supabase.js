// Configuración de Supabase
const SUPABASE_URL = 'https://kxkajeoxyhbmzohwaxit.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4a2FqZW94eWhibXpvaHdheGl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMTIzNzIsImV4cCI6MjA5NTY4ODM3Mn0.uFyqJvaHlBhDGkjuTZz-yA4WKnmXZmvcOwv6EHNTBJ8';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

window.supabaseClient = _supabase;

// Global Toast System
window.showToast = (message, type = 'info') => {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icon = type === 'success' ? 'fa-check-circle' : (type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle');

    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Trigger reflow for animation
    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500);
    }, 4000);
};

// Professional Modal System
window.customConfirm = (message) => {
    return new Promise((resolve) => {
        let modal = document.getElementById('custom-confirm-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'custom-confirm-modal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-card">
                    <i class="fas fa-question-circle" style="font-size: 3rem; color: var(--hub-accent); margin-bottom: 1.5rem;"></i>
                    <h3 id="confirm-modal-message" style="margin-bottom: 2rem;"></h3>
                    <div class="hub-modal-actions">
                        <button id="confirm-cancel" class="hub-btn secondary">Cancelar</button>
                        <button id="confirm-ok" class="hub-btn primary">Confirmar</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        document.getElementById('confirm-modal-message').textContent = message;
        modal.style.display = 'flex';

        const okBtn = document.getElementById('confirm-ok');
        const cancelBtn = document.getElementById('confirm-cancel');

        const cleanup = () => {
            modal.style.display = 'none';
            okBtn.onclick = null;
            cancelBtn.onclick = null;
        };

        okBtn.onclick = () => {
            cleanup();
            resolve(true);
        };

        cancelBtn.onclick = () => {
            cleanup();
            resolve(false);
        };
    });
};

window.customAlert = (message) => {
    return new Promise((resolve) => {
        let modal = document.getElementById('custom-alert-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'custom-alert-modal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-card">
                    <i class="fas fa-info-circle" style="font-size: 3rem; color: var(--hub-accent); margin-bottom: 1.5rem;"></i>
                    <h3 id="alert-modal-message" style="margin-bottom: 2rem;"></h3>
                    <div class="hub-modal-actions">
                        <button id="alert-ok" class="hub-btn primary" style="width: 100%;">Aceptar</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        document.getElementById('alert-modal-message').textContent = message;
        modal.style.display = 'flex';

        const okBtn = document.getElementById('alert-ok');

        okBtn.onclick = () => {
            modal.style.display = 'none';
            okBtn.onclick = null;
            resolve();
        };
    });
};

// Override window.alert for a professional look
window.alert = (msg) => window.customAlert(msg);

// Note: confirm is intentionally not overridden to avoid breaking
// non-async third party code, but we use customConfirm manually.
