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

// Override window.alert for a professional look
window.alert = (msg) => window.showToast(msg, 'info');
