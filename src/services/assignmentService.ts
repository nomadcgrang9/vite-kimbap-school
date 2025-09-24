/**
 * Assignment Service
 * 과제/배정 관련 데이터 서비스
 * 원본 loadAssignments 함수를 TypeScript로 안전하게 마이그레이션
 */

import { safeSupabaseCall } from './supabaseService';

// Assignment 데이터 타입 정의
export interface Assignment {
  id: string;
  student_id?: string;
  studentId?: string;  // localStorage 호환성
  class?: string;
  role?: string;
  role_type?: 'text' | 'image';
  role_content?: string;
  roleContent?: string;  // localStorage 호환성
  target_class?: string;  // 반별 배정용
  targetClass?: string;   // localStorage 호환성
  status?: string;        // 배정 상태
  sessionName?: string;   // 세션명
  missions?: Array<{      // 반별 미션 배열
    name?: string;
    content?: string;
    description?: string;
  }>;
  created_at?: string;
  updated_at?: string;
  checked?: boolean;
}

// 서비스 응답 타입
export interface AssignmentServiceResult {
  success: boolean;
  data: Assignment[];
  source: 'supabase' | 'localStorage' | 'fallback';
  error?: string;
}

/**
 * 과제 목록 로드
 * 원본 loadAssignments() 함수의 TypeScript 버전
 */
export async function loadAssignments(): Promise<AssignmentServiceResult> {
  console.log('[AssignmentService] 과제 로드 시작');

  try {
    // Supabase에서 데이터 로드 시도
    const supabaseResult = await safeSupabaseCall(async (client) => {
      console.log('[AssignmentService] Supabase assignments 테이블 조회');
      
      const { data, error } = await client
        .from('assignments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw new Error(`Supabase 오류: ${error.message}`);
      }
      
      return data as Assignment[];
    });

    if (supabaseResult && Array.isArray(supabaseResult)) {
      console.log('[AssignmentService] Supabase 로드 성공:', supabaseResult.length, '개 과제');
      
      if (supabaseResult.length > 0) {
        console.log('[AssignmentService] 첫 번째 과제:', supabaseResult[0]);
      }
      
      return {
        success: true,
        data: supabaseResult,
        source: 'supabase'
      };
    }
    
    throw new Error('Supabase에서 유효한 데이터를 받지 못함');
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    console.warn('[AssignmentService] Supabase 실패, localStorage 폴백:', errorMessage);
    
    // localStorage 폴백 로직
    try {
      const localAssignments = loadFromLocalStorage();
      
      return {
        success: true,
        data: localAssignments,
        source: 'localStorage',
        error: `Supabase 오류로 인한 폴백: ${errorMessage}`
      };
      
    } catch (localError) {
      const localErrorMessage = localError instanceof Error ? localError.message : '로컬 저장소 오류';
      console.error('[AssignmentService] localStorage도 실패:', localErrorMessage);
      
      return {
        success: false,
        data: [],
        source: 'fallback',
        error: `모든 데이터 소스 실패 - Supabase: ${errorMessage}, localStorage: ${localErrorMessage}`
      };
    }
  }
}

/**
 * localStorage에서 과제 데이터 로드 (폴백)
 * 원본 코드의 폴백 로직을 별도 함수로 분리
 */
function loadFromLocalStorage(): Assignment[] {
  console.log('[AssignmentService] localStorage에서 과제 로드');
  
  // 기본 assignments 로드
  const assignmentsData = localStorage.getItem('assignments');
  let assignments: Assignment[] = assignmentsData ? JSON.parse(assignmentsData) : [];
  
  // classAssignments 병합 (원본 로직 유지)
  const classAssignmentsData = localStorage.getItem('classAssignments');
  if (classAssignmentsData) {
    const classAssignments = JSON.parse(classAssignmentsData);
    
    // 객체의 모든 값을 순회하며 중복되지 않은 과제 추가
    Object.values(classAssignments).forEach((assignment: any) => {
      if (assignment && assignment.id && !assignments.find(a => a.id === assignment.id)) {
        assignments.push(assignment as Assignment);
      }
    });
  }
  
  console.log('[AssignmentService] localStorage 로드 완료:', assignments.length, '개 과제');
  return assignments;
}

/**
 * 과제 데이터 검증
 */
export function validateAssignment(assignment: any): assignment is Assignment {
  return assignment && 
         typeof assignment === 'object' && 
         typeof assignment.id === 'string' && 
         assignment.id.length > 0;
}

/**
 * 과제 데이터를 localStorage에 저장
 */
export function saveAssignmentsToLocal(assignments: Assignment[]): boolean {
  try {
    localStorage.setItem('assignments', JSON.stringify(assignments));
    console.log('[AssignmentService] localStorage에 저장 완료:', assignments.length, '개 과제');
    return true;
  } catch (error) {
    console.error('[AssignmentService] localStorage 저장 실패:', error);
    return false;
  }
}