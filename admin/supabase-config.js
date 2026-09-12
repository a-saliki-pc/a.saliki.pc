/* ============================================================
   CONFIGURATION SUPABASE — A SALIKI PC
   ============================================================ */

const SUPABASE_URL = 'https://meidxvxamevtqhjrptmz.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_jOYTzu5XoajM_qarXRbIyA_V1Wah6Em';

let supabaseClient = null;

async function initSupabase() {
  if (supabaseClient) return supabaseClient;

  if (!window.supabase) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  return supabaseClient;
}

async function verifierAuth() {
  const sb = await initSupabase();
  const { data: { session } } = await sb.auth.getSession();
  return session;
}

async function protegerPage() {
  const session = await verifierAuth();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  return session;
}

async function deconnexion() {
  const sb = await initSupabase();
  await sb.auth.signOut();
  window.location.href = 'login.html';
}

async function uploaderFichier(file, chemin) {
  const sb = await initSupabase();
  const { data, error } = await sb.storage
    .from('ressources-pdf')
    .upload(chemin, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  const { data: urlData } = sb.storage.from('ressources-pdf').getPublicUrl(chemin);
  return urlData.publicUrl;
}

async function supprimerFichier(chemin) {
  const sb = await initSupabase();
  const { error } = await sb.storage.from('ressources-pdf').remove([chemin]);
  if (error) throw error;
}

async function lireTable(table, options = {}) {
  const sb = await initSupabase();
  let query = sb.from(table).select(options.select || '*');
  if (options.filtres) {
    Object.entries(options.filtres).forEach(([col, val]) => {
      query = query.eq(col, val);
    });
  }
  if (options.ordre) {
    query = query.order(options.ordre.col, { ascending: options.ordre.asc !== false });
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function insererLigne(table, donnees) {
  const sb = await initSupabase();
  const { data, error } = await sb.from(table).insert(donnees).select();
  if (error) throw error;
  return data;
}

async function modifierLigne(table, id, donnees) {
  const sb = await initSupabase();
  const { data, error } = await sb.from(table).update(donnees).eq('id', id).select();
  if (error) throw error;
  return data;
}

async function supprimerLigne(table, id) {
  const sb = await initSupabase();
  const { error } = await sb.from(table).delete().eq('id', id);
  if (error) throw error;
}

function formaterDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function afficherMessage(message, type = 'info') {
  const toast = document.createElement('div');
  toast.textContent = message;
  const colors = { info: '#22d3ee', succes: '#4ade80', erreur: '#ef4444' };
  toast.style.cssText = `
    position: fixed; top: 20px; right: 20px;
    padding: 1rem 1.5rem; border-radius: 0.5rem;
    background: ${colors[type] || colors.info};
    color: #050b14; font-weight: 600;
    z-index: 99999; box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
