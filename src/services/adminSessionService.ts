/**
 * Admin Session Service
 * Step 3B.1a: loadSessions 함수 마이그레이션
 * 원본: admin-rolesv2.js loadSessions()
 */

import { getSupabaseClient } from './supabaseService';

// ============ 타입 정의 ============

export interface Mission {
  id?: string;
  name: string;
  description?: string;
  type?: 'text' | 'image';
  content?: string;
  order?: number;
}

export interface AdminSession {
  id: string;
  created_at: string;
  updated_at?: string;
  name: string; // DB 컬럼명과 일치: name
  activity_instructions?: string; // DB 컬럼명과 일치: activity_instructions  
  target_class?: string;
  missions?: string; // JSON string
  parsedMissions?: Mission[]; // 파싱된 missions
  status: string; // DB 컬럼명과 일치: status ('active' | 'inactive')
  type?: string; // DB에 있는 type 컬럼
  // 편의를 위한 computed properties
  session_name?: string; // name의 별칭
  description?: string; // activity_instructions의 별칭
  is_active?: boolean; // status === 'active'의 별칭
}

export interface AdminSessionLoadResult {
  success: boolean;
  data: AdminSession[];
  count: number;
  error?: string;
  source: 'supabase' | 'localStorage' | 'cache';
}

// ============ 안전한 데이터 처리 ============

function safeParseMissions(missions: string | null | undefined): Mission[] {
  try {
    if (!missions) return [];
    
    if (typeof missions === 'string') {
      const parsed = JSON.parse(missions);
      if (Array.isArray(parsed)) {
        return parsed.map((mission, index) => ({
          id: mission.id || `mission-${index}`,
          name: mission.name || `미션 ${index + 1}`,
          description: mission.description || '',
          type: mission.type || 'text',
          content: mission.content || '',
          order: mission.order || index
        }));
      }
    }
    
    return [];
  } catch (error) {
    console.warn('⚠️ [AdminSessionService] missions 파싱 실패:', error);
    return [];
  }
}

// ============ 세션 로드 함수 ============

export async function loadAdminSessions(): Promise<AdminSessionLoadResult> {
  console.log('📋 [AdminSessionService] 세션 데이터 로드 시작');
  
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase 클라이언트 초기화 실패');
    }
    
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('❌ [AdminSessionService] 세션 로드 오류:', error);
      throw new Error(`세션 로드 실패: ${error.message}`);
    }
    
    const sessions = data || [];
    
    // 🔍 데이터베이스에서 가져온 원본 데이터 구조 확인
    console.log('🔍 [AdminSessionService] 원본 sessions 데이터:', sessions);
    if (sessions.length > 0) {
      console.log('🔍 [AdminSessionService] 첫 번째 세션 객체:', sessions[0]);
      console.log('🔍 [AdminSessionService] 첫 번째 세션 키들:', Object.keys(sessions[0]));
    }
    
    // missions 데이터 파싱 및 편의 속성 추가
    const processedSessions: AdminSession[] = sessions.map(session => ({
      ...session,
      // 편의를 위한 별칭 속성들 추가
      session_name: session.name, // name -> session_name 별칭
      description: session.activity_instructions, // activity_instructions -> description 별칭
      is_active: session.status === 'active', // status -> is_active 별칭
      parsedMissions: safeParseMissions(session.missions)
    }));
    
    console.log('🔍 [AdminSessionService] 처리된 sessions 데이터:', processedSessions);
    if (processedSessions.length > 0) {
      console.log('🔍 [AdminSessionService] 처리된 첫 번째 세션:', processedSessions[0]);
    }
    
    console.log(`✅ [AdminSessionService] 세션 데이터 로드 완료: ${processedSessions.length}개`);
    
    return {
      success: true,
      data: processedSessions,
      count: processedSessions.length,
      source: 'supabase'
    };
    
  } catch (error) {
    console.error('❌ [AdminSessionService] 세션 로드 실패:', error);
    
    // localStorage 폴백 시도
    try {
      const cached = localStorage.getItem('admin_sessions');
      if (cached) {
        const cachedSessions = JSON.parse(cached);
        console.log(`📱 [AdminSessionService] localStorage에서 ${cachedSessions.length}개 세션 로드`);
        
        return {
          success: true,
          data: cachedSessions,
          count: cachedSessions.length,
          source: 'localStorage'
        };
      }
    } catch (cacheError) {
      console.warn('⚠️ [AdminSessionService] localStorage 폴백 실패:', cacheError);
    }
    
    return {
      success: false,
      data: [],
      count: 0,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      source: 'supabase'
    };
  }
}

// ============ 세션 캐싱 함수 ============

export function cacheAdminSessions(sessions: AdminSession[]): void {
  try {
    localStorage.setItem('admin_sessions', JSON.stringify(sessions));
    console.log('💾 [AdminSessionService] 세션 데이터 캐시됨');
  } catch (error) {
    console.warn('⚠️ [AdminSessionService] 세션 캐싱 실패:', error);
  }
}

// ============ 세션 검증 함수 ============

export function validateAdminSession(session: any): session is AdminSession {
  return (
    typeof session === 'object' &&
    typeof session.id === 'string' &&
    typeof session.session_name === 'string' &&
    typeof session.created_at === 'string' &&
    typeof session.is_active === 'boolean'
  );
}

// ============ 세션 필터링 함수 ============

export function filterActiveSessions(sessions: AdminSession[]): AdminSession[] {
  return sessions.filter(session => session.is_active);
}

export function filterSessionsByClass(sessions: AdminSession[], targetClass: string): AdminSession[] {
  return sessions.filter(session => 
    !session.target_class || 
    session.target_class === targetClass ||
    session.target_class.includes(targetClass)
  );
}

// ============ 세션 업데이트 함수 ============

export async function updateAdminSession(sessionId: string, updates: {
  name?: string;
  activity_instructions?: string;
  target_class?: string;
  status?: string;
  missions?: string;
}): Promise<{
  success: boolean;
  message: string;
  error?: any;
}> {
  console.log('📝 [AdminSessionService] 세션 업데이트 시작:', sessionId, updates);
  
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase 클라이언트 초기화 실패');
    }

    console.log('💾 [AdminSessionService] Supabase에서 세션 업데이트 중...');
    
    const { error } = await supabase
      .from('sessions')
      .update(updates)
      .eq('id', sessionId);
      
    if (error) {
      console.error('❌ [AdminSessionService] 세션 업데이트 실패:', error);
      throw new Error(`세션 업데이트 실패: ${error.message}`);
    }
    
    console.log('✅ [AdminSessionService] 세션 업데이트 성공');
    
    return {
      success: true,
      message: '세션이 성공적으로 업데이트되었습니다.'
    };
    
  } catch (error) {
    console.error('❌ [AdminSessionService] 세션 업데이트 오류:', error);
    return {
      success: false,
      message: '세션 업데이트 중 오류가 발생했습니다.',
      error
    };
  }
}

// ============ 세션 삭제 함수 ============

export async function deleteAdminSession(sessionId: string): Promise<{
  success: boolean;
  message: string;
  error?: any;
}> {
  console.log('🗑️ [AdminSessionService] 세션 삭제 시작:', sessionId);
  
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase 클라이언트를 초기화할 수 없습니다');
    }

    console.log('💾 [AdminSessionService] Supabase에서 세션 삭제 중...');
    
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId);
    
    if (error) {
      console.error('❌ [AdminSessionService] 세션 삭제 실패:', error);
      throw new Error(`세션 삭제 실패: ${error.message}`);
    }
    
    console.log('✅ [AdminSessionService] 세션 삭제 성공');
    
    return {
      success: true,
      message: '세션이 성공적으로 삭제되었습니다.'
    };
    
  } catch (error) {
    console.error('❌ [AdminSessionService] 세션 삭제 오류:', error);
    return {
      success: false,
      message: '세션 삭제 중 오류가 발생했습니다.',
      error
    };
  }
}