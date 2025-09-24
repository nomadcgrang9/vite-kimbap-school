/**
 * Assignment Check Service
 * 원본 checkStudentAssignment 함수를 TypeScript로 안전하게 마이그레이션
 */

import { loadAssignments } from './assignmentService';
import type { Assignment } from './assignmentService';
import type { StudentInfo } from './studentAuthService';

// 미션 데이터 타입 정의
export interface Mission {
  name?: string;
  content?: string;
  description?: string;
}

// 학생 배정 결과 타입
export interface StudentAssignment extends Assignment {
  studentId: string;
  studentName: string;
  roleName?: string;
  roleContent?: string;
  roleDescription?: string;
  sessionName?: string;
  roleType?: string;
  missions?: Mission[];
}

// 배정 확인 결과 타입
export interface AssignmentCheckResult {
  success: boolean;
  hasAssignment: boolean;
  assignment?: StudentAssignment;
  assignmentType?: 'direct' | 'class';
  error?: string;
  debugInfo?: {
    totalAssignments: number;
    directMatches: number;
    classMatches: number;
    studentId: string;
    fullClass: string;
  };
}

/**
 * 학생의 직접 배정 확인
 * 관리자가 특정 학생에게 직접 배정한 과제 찾기
 */
function findDirectAssignments(assignments: Assignment[], studentId: string): Assignment[] {
  console.log('[AssignmentCheck] 직접 배정 확인 시작:', studentId);
  
  const directAssignments = assignments.filter(assignment => {
    // Supabase에서는 student_id, localStorage에서는 studentId 필드 사용
    const assignmentStudentId = assignment.student_id || assignment.studentId;
    const isForThisStudent = assignmentStudentId === studentId;
    const isActive = !assignment.status || assignment.status === 'active';
    
    console.log('[DirectAssignment Filter]', {
      assignmentId: assignment.id,
      assignmentStudentId,
      studentId,
      isMatch: isForThisStudent,
      status: assignment.status,
      isActive,
      finalMatch: isForThisStudent && isActive
    });
    
    return isForThisStudent && isActive;
  });
  
  console.log('[AssignmentCheck] 직접 배정 결과:', directAssignments.length, '개');
  return directAssignments;
}

/**
 * 학생의 반별 배정 확인
 * 특정 반에 배정된 과제에서 학생 번호에 따른 미션 할당
 */
function findClassAssignments(assignments: Assignment[], student: StudentInfo): StudentAssignment[] {
  console.log('[AssignmentCheck] 반별 배정 확인 시작:', student.fullClass);
  
  const classAssignments = assignments.filter(assignment => {
    // Supabase에서는 target_class, localStorage에서는 targetClass 필드 사용
    const targetClass = assignment.target_class || assignment.targetClass;
    const isForThisClass = targetClass === student.fullClass;
    const isActive = !assignment.status || assignment.status === 'active';
    
    console.log('[ClassAssignment Filter]', {
      assignmentId: assignment.id,
      targetClass,
      studentClass: student.fullClass,
      isMatch: isForThisClass,
      status: assignment.status,
      isActive,
      finalMatch: isForThisClass && isActive
    });
    
    return isForThisClass && isActive;
  });
  
  console.log('[AssignmentCheck] 반별 배정 후보:', classAssignments.length, '개');
  
  if (classAssignments.length === 0) {
    return [];
  }
  
  // 가장 최근 반별 배정 선택
  const selectedClassAssignment = classAssignments[classAssignments.length - 1];
  console.log('[AssignmentCheck] 선택된 반별 배정:', selectedClassAssignment.id);
  
  // 미션 배열에서 학생 번호에 따른 미션 할당
  const missions = selectedClassAssignment.missions || [];
  console.log('[AssignmentCheck] 사용 가능한 미션:', missions.length, '개');
  
  if (missions.length === 0) {
    // 미션이 없으면 기본 배정으로 반환
    return [{
      ...selectedClassAssignment,
      studentId: student.studentId,
      studentName: student.name,
      roleName: selectedClassAssignment.sessionName || '기본 역할',
      roleContent: selectedClassAssignment.role_content || selectedClassAssignment.roleContent || '',
      roleDescription: '반별 기본 배정'
    } as StudentAssignment];
  }
  
  // 학생 번호 기반 미션 할당 (일관된 배정)
  const studentNumber = parseInt(student.number.toString()) || 1;
  const missionIndex = (studentNumber - 1) % missions.length;
  const selectedMission = missions[missionIndex];
  
  console.log('[AssignmentCheck] 미션 할당:', {
    studentNumber,
    missionIndex,
    selectedMission: selectedMission?.name || 'unnamed'
  });
  
  // 학생용 배정 생성
  const studentAssignment: StudentAssignment = {
    ...selectedClassAssignment,
    studentId: student.studentId,
    studentName: student.name,
    roleName: selectedMission.name || selectedClassAssignment.sessionName || '할당된 역할',
    roleContent: selectedMission.content || selectedMission.name || '',
    roleDescription: selectedMission.description || selectedMission.content || '반별 미션 배정'
  };
  
  return [studentAssignment];
}

/**
 * 학생 배정 확인 메인 함수
 * 원본 checkStudentAssignment 함수의 TypeScript 버전
 */
export async function checkStudentAssignment(student: StudentInfo): Promise<AssignmentCheckResult> {
  console.log('[AssignmentCheck] 학생 배정 확인 시작:', student.studentId);
  
  try {
    // 1. 최신 배정 데이터 로드
    const assignmentResult = await loadAssignments();
    if (!assignmentResult.success) {
      return {
        success: false,
        hasAssignment: false,
        error: `배정 데이터 로드 실패: ${assignmentResult.error}`
      };
    }
    
    const assignments = assignmentResult.data;
    console.log('[AssignmentCheck] 로드된 배정 수:', assignments.length);
    
    // 디버그 정보 수집
    const debugInfo = {
      totalAssignments: assignments.length,
      directMatches: 0,
      classMatches: 0,
      studentId: student.studentId,
      fullClass: student.fullClass
    };
    
    // 2. 직접 배정 확인 (우선순위 1)
    const directAssignments = findDirectAssignments(assignments, student.studentId);
    debugInfo.directMatches = directAssignments.length;
    
    if (directAssignments.length > 0) {
      const selectedAssignment = directAssignments[directAssignments.length - 1]; // 최신 배정 선택
      console.log('[AssignmentCheck] 직접 배정 발견:', selectedAssignment.id);
      
      return {
        success: true,
        hasAssignment: true,
        assignment: {
          ...selectedAssignment,
          studentId: student.studentId,
          studentName: student.name
        } as StudentAssignment,
        assignmentType: 'direct',
        debugInfo
      };
    }
    
    // 3. 반별 배정 확인 (우선순위 2)
    const classAssignments = findClassAssignments(assignments, student);
    debugInfo.classMatches = classAssignments.length;
    
    if (classAssignments.length > 0) {
      console.log('[AssignmentCheck] 반별 배정 발견');
      
      return {
        success: true,
        hasAssignment: true,
        assignment: classAssignments[0],
        assignmentType: 'class',
        debugInfo
      };
    }
    
    // 4. 배정 없음
    console.log('[AssignmentCheck] 학생에게 배정된 과제 없음');
    return {
      success: true,
      hasAssignment: false,
      debugInfo
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    console.error('[AssignmentCheck] 배정 확인 오류:', errorMessage);
    
    return {
      success: false,
      hasAssignment: false,
      error: `배정 확인 실패: ${errorMessage}`
    };
  }
}

/**
 * 배정 상태를 확인됨으로 표시
 * 원본의 markAssignmentAsChecked 로직
 */
export async function markAssignmentAsChecked(assignmentId: string): Promise<boolean> {
  console.log('[AssignmentCheck] 배정 확인 표시:', assignmentId);
  
  try {
    // 현재는 로컬에서만 처리, 추후 Supabase 연동 시 확장 가능
    const timestamp = new Date().toISOString();
    console.log('[AssignmentCheck] 배정 확인 시간:', timestamp);
    
    // localStorage에 확인 상태 저장 (임시)
    const checkedAssignments = JSON.parse(localStorage.getItem('checkedAssignments') || '{}');
    checkedAssignments[assignmentId] = {
      checked: true,
      checkedAt: timestamp
    };
    localStorage.setItem('checkedAssignments', JSON.stringify(checkedAssignments));
    
    return true;
    
  } catch (error) {
    console.error('[AssignmentCheck] 배정 확인 표시 오류:', error);
    return false;
  }
}