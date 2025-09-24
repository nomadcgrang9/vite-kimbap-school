// Supabase Client Module
// 분리된 모듈: getSupabaseClient() 함수

export function getSupabaseClient() {
    // 인라인 스크립트에서 초기화된 글로벌 클라이언트 사용
    if (typeof globalSupabaseClient !== 'undefined' && globalSupabaseClient) {
        return globalSupabaseClient;
    }
    
    // 폴백: 로컬에서 직접 초기화
    if (typeof window.supabase !== 'undefined') {
        const SUPABASE_URL = 'https://xzhbhrhihtfkuvcltpsw.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6aGJocmhpaHRma3V2Y2x0cHN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3NjYyNzEsImV4cCI6MjA3MzM0MjI3MX0.hvHQV0O6SjWgzDyI7WkZC74Mude9dtssqqA4B4_Iqcw';
        
        try {
            const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('[Student] 폴백 Supabase 초기화 성공');
            return client;
        } catch (error) {
            console.error('[Student] 폴백 Supabase 초기화 실패:', error);
            return null;
        }
    }
    
    return null;
}