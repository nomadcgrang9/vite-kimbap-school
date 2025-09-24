/**
 * Supabase Service
 * 기존 getSupabaseClient 함수를 TypeScript로 안전하게 마이그레이션
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

/**
 * 안전한 Supabase 클라이언트 반환
 * 기존 getSupabaseClient() 함수의 TypeScript 버전
 */
export function getSupabaseClient(): SupabaseClient | null {
  try {
    // 이미 초기화된 모듈 클라이언트 사용 (환경변수 기반)
    if (supabase) {
      console.log('[SupabaseService] 모듈 기반 클라이언트 사용');
      return supabase;
    }
    
    console.error('[SupabaseService] Supabase 클라이언트가 초기화되지 않음');
    return null;
  } catch (error) {
    console.error('[SupabaseService] 클라이언트 접근 오류:', error);
    return null;
  }
}

/**
 * Supabase 연결 상태 확인
 * 원본 코드에 없던 추가 안전 기능
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) {
    return false;
  }
  
  try {
    // 간단한 연결 테스트 (students 테이블 count)
    const { error } = await client.from('students').select('count').limit(1);
    if (error) {
      console.warn('[SupabaseService] 연결 테스트 실패:', error.message);
      return false;
    }
    
    console.log('[SupabaseService] 연결 상태 정상');
    return true;
  } catch (error) {
    console.error('[SupabaseService] 연결 테스트 오류:', error);
    return false;
  }
}

/**
 * 안전한 API 호출 래퍼
 * 연결 상태를 확인한 후 API 호출 실행
 */
export async function safeSupabaseCall<T>(
  operation: (client: SupabaseClient) => Promise<T>
): Promise<T | null> {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase 클라이언트를 사용할 수 없습니다');
  }
  
  try {
    return await operation(client);
  } catch (error) {
    console.error('[SupabaseService] API 호출 오류:', error);
    return null;
  }
}