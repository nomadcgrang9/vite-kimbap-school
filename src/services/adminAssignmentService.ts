/**
 * Admin Assignment Service
 * Step 3B.1c: loadAssignments 관리자용 함수 마이그레이션
 * 원본: admin-rolesv2.js loadAssignments()
 */

import { getSupabaseClient } from './supabaseService';

// ============ 타입 정의 ============

export interface AdminAssignment {
  id: string;
  created_at: string;
  updated_at?: string;
  assigned_at: string; // 배정 시간
  student_id: string; // 학생 ID (예: "3127")
  student_name?: string; // 학생 이름
  session_id: string; // 세션 ID
  session_name?: string; // 세션 이름
  role_name?: string; // 역할 이름
  role_content?: string; // 역할 내용
  role_type?: 'text' | 'image'; // 역할 타입
  role_description?: string; // 역할 설명
  is_active: boolean; // 활성 상태
  assigned_by?: string; // 배정한 사람
  notes?: string; // 메모
}

export interface AdminAssignmentLoadResult {
  success: boolean;
  data: AdminAssignment[];
  count: number;
  bySession?: Record<string, AdminAssignment[]>; // 세션별 그룹핑
  byStudent?: Record<string, AdminAssignment[]>; // 학생별 그룹핑
  stats?: AssignmentStats; // 배정 통계
  error?: string;
  source: 'supabase' | 'localStorage' | 'cache';
}

export interface AssignmentStats {
  totalAssignments: number;
  activeAssignments: number;
  bySession: Record<string, number>; // 세션별 배정 수
  byRoleType: Record<string, number>; // 역할 타입별 배정 수
  recentAssignments: AdminAssignment[]; // 최근 배정 (최대 5개)
}

// ============ 관리자용 배정 로드 함수 ============

export async function loadAdminAssignments(): Promise<AdminAssignmentLoadResult> {
  console.log('🎯 [AdminAssignmentService] 배정 데이터 로드 시작');
  
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase 클라이언트 초기화 실패');
    }
    
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .order('assigned_at', { ascending: false });
      
    if (error) {
      console.error('❌ [AdminAssignmentService] 배정 로드 오류:', error);
      throw new Error(`배정 로드 실패: ${error.message}`);
    }
    
    const assignments = data || [];
    
    // 세션별, 학생별 그룹핑
    const bySession: Record<string, AdminAssignment[]> = {};
    const byStudent: Record<string, AdminAssignment[]> = {};
    
    assignments.forEach(assignment => {
      // 세션별 그룹핑
      if (!bySession[assignment.session_id]) {
        bySession[assignment.session_id] = [];
      }
      bySession[assignment.session_id].push(assignment);
      
      // 학생별 그룹핑
      if (!byStudent[assignment.student_id]) {
        byStudent[assignment.student_id] = [];
      }
      byStudent[assignment.student_id].push(assignment);
    });
    
    // 통계 생성
    const stats = generateAssignmentStats(assignments);
    
    console.log(`✅ [AdminAssignmentService] 배정 데이터 로드 완료: ${assignments.length}개`);
    console.log(`📊 [AdminAssignmentService] 활성 배정: ${stats.activeAssignments}개`);
    
    return {
      success: true,
      data: assignments,
      count: assignments.length,
      bySession,
      byStudent,
      stats,
      source: 'supabase'
    };
    
  } catch (error) {
    console.error('❌ [AdminAssignmentService] 배정 로드 실패:', error);
    
    // localStorage 폴백 시도
    try {
      const cached = localStorage.getItem('admin_assignments');
      if (cached) {
        const cachedAssignments = JSON.parse(cached);
        console.log(`📱 [AdminAssignmentService] localStorage에서 ${cachedAssignments.length}개 배정 로드`);
        
        return {
          success: true,
          data: cachedAssignments,
          count: cachedAssignments.length,
          source: 'localStorage'
        };
      }
    } catch (cacheError) {
      console.warn('⚠️ [AdminAssignmentService] localStorage 폴백 실패:', cacheError);
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

// ============ 배정 통계 생성 함수 ============

function generateAssignmentStats(assignments: AdminAssignment[]): AssignmentStats {
  const activeAssignments = assignments.filter(a => a.is_active);
  
  const bySession: Record<string, number> = {};
  const byRoleType: Record<string, number> = {};
  
  activeAssignments.forEach(assignment => {
    // 세션별 카운트
    bySession[assignment.session_id] = (bySession[assignment.session_id] || 0) + 1;
    
    // 역할 타입별 카운트
    const roleType = assignment.role_type || 'text';
    byRoleType[roleType] = (byRoleType[roleType] || 0) + 1;
  });
  
  // 최근 배정 5개
  const recentAssignments = assignments
    .sort((a, b) => new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime())
    .slice(0, 5);
  
  return {
    totalAssignments: assignments.length,
    activeAssignments: activeAssignments.length,
    bySession,
    byRoleType,
    recentAssignments
  };
}

// ============ 배정 캐싱 함수 ============

export function cacheAdminAssignments(assignments: AdminAssignment[]): void {
  try {
    localStorage.setItem('admin_assignments', JSON.stringify(assignments));
    console.log('💾 [AdminAssignmentService] 배정 데이터 캐시됨');
  } catch (error) {
    console.warn('⚠️ [AdminAssignmentService] 배정 캐싱 실패:', error);
  }
}

// ============ 배정 검증 함수 ============

export function validateAdminAssignment(assignment: any): assignment is AdminAssignment {
  return (
    typeof assignment === 'object' &&
    typeof assignment.id === 'string' &&
    typeof assignment.student_id === 'string' &&
    typeof assignment.session_id === 'string' &&
    typeof assignment.assigned_at === 'string' &&
    typeof assignment.is_active === 'boolean'
  );
}

// ============ 배정 필터링 함수들 ============

export function filterActiveAssignments(assignments: AdminAssignment[]): AdminAssignment[] {
  return assignments.filter(assignment => assignment.is_active);
}

export function filterAssignmentsBySession(assignments: AdminAssignment[], sessionId: string): AdminAssignment[] {
  return assignments.filter(assignment => assignment.session_id === sessionId);
}

export function filterAssignmentsByStudent(assignments: AdminAssignment[], studentId: string): AdminAssignment[] {
  return assignments.filter(assignment => assignment.student_id === studentId);
}

export function filterAssignmentsByRoleType(assignments: AdminAssignment[], roleType: 'text' | 'image'): AdminAssignment[] {
  return assignments.filter(assignment => assignment.role_type === roleType);
}

export function findRecentAssignments(assignments: AdminAssignment[], days: number = 7): AdminAssignment[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return assignments.filter(assignment => 
    new Date(assignment.assigned_at) >= cutoffDate
  ).sort((a, b) => 
    new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime()
  );
}

// ============ 배정 정렬 함수들 ============

export function sortAssignmentsByDate(assignments: AdminAssignment[]): AdminAssignment[] {
  return [...assignments].sort((a, b) => 
    new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime()
  );
}

export function sortAssignmentsByStudent(assignments: AdminAssignment[]): AdminAssignment[] {
  return [...assignments].sort((a, b) => 
    a.student_id.localeCompare(b.student_id)
  );
}

export function sortAssignmentsBySession(assignments: AdminAssignment[]): AdminAssignment[] {
  return [...assignments].sort((a, b) => 
    (a.session_name || a.session_id).localeCompare(b.session_name || b.session_id)
  );
}