/**
 * Supabase Configuration
 * 환경변수를 사용한 안전한 설정
 */

interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export const supabaseConfig: SupabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL || '',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || ''
};

// 환경변수 검증
if (!supabaseConfig.url || !supabaseConfig.anonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export default supabaseConfig;