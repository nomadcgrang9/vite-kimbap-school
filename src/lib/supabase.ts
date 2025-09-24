/**
 * Supabase Client Setup
 * 타입 안전한 Supabase 클라이언트 초기화
 */

import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from '../config/supabase';

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);

// 연결 테스트 함수
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('students').select('count').limit(1);
    if (error) {
      console.warn('[Supabase] Connection test failed:', error.message);
      return false;
    }
    console.log('[Supabase] Connection successful');
    return true;
  } catch (error) {
    console.error('[Supabase] Connection error:', error);
    return false;
  }
}

export default supabase;