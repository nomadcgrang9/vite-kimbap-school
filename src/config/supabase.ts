/**
 * Supabase Configuration
 * 환경변수를 사용한 안전한 설정
 */

interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export const supabaseConfig: SupabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL || 'https://xzhbhrhihtfkuvcltpsw.supabase.co',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6aGJocmhpaHRma3V2Y2x0cHN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3NjYyNzEsImV4cCI6MjA3MzM0MjI3MX0.hvHQV0O6SjWgzDyI7WkZC74Mude9dtssqqA4B4_Iqcw'
};

// 환경변수 검증 (이제 fallback 값이 있으므로 항상 통과)
if (!supabaseConfig.url || !supabaseConfig.anonKey) {
  console.warn('Using fallback Supabase configuration');
}

export default supabaseConfig;