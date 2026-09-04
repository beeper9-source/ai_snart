/**
 * Supabase 클라이언트 연동 설정
 * Project: beeper9-source's Project (dmgtwzbvpualecnrcyug)
 */

const SUPABASE_CONFIG = {
  url: 'https://dmgtwzbvpualecnrcyug.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtZ3R3emJ2cHVhbGVjbnJjeXVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMzAzODUsImV4cCI6MjA3MjcwNjM4NX0.Cddfcij0GL3lLCZz51tALcyKULfGECyq4YNpjVh9Uf4'
};

let supabaseClient = null;

function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
    supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    console.log('[Supabase] 클라이언트 초기화 완료:', SUPABASE_CONFIG.url);
    return supabaseClient;
  }

  console.warn('[Supabase] CDN SDK가 아직 로드되지 않았습니다.');
  return null;
}

window.SUPABASE_CONFIG = SUPABASE_CONFIG;
window.getSupabaseClient = getSupabaseClient;
