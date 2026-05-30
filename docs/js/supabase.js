// Configuración de Supabase
const SUPABASE_URL = 'https://kxkajeoxyhbmzohwaxit.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4a2FqZW94eWhibXpvaHdheGl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMTIzNzIsImV4cCI6MjA5NTY4ODM3Mn0.uFyqJvaHlBhDGkjuTZz-yA4WKnmXZmvcOwv6EHNTBJ8';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

window.supabaseClient = _supabase;
