/**
 * Assignment Check Service
 * 원본 checkStudentAssignment 함수를 TypeScript로 안전하게 마이그레이션
 */

import { loadAssignments } from './assignmentService';
import type { Assignment, AssignmentServiceResult } from './assignmentService';
import type { StudentInfo } from './studentAuthService';

// 확장된 Assignment 타입 (원본 데이터 필드 추가)
interface ExtendedAssignment extends Omit<Assignment, 'role_type'> {
  student_id?: string;
  studentId?: string;
  target_class?: string;
  targetClass?: string;
  status?: string;
  role?: string;
  role_content?: string;
  role_type?: 'text' | 'image' | string;
  sessionName?: string;
  roleName?: string;
  missions?: ClassMission[];
}

// 과제 확인 결과 타입
export interface AssignmentCheckResult {
  success: boolean;
  hasAssignment: boolean;
  assignment?: StudentAssignment;
  assignmentType?: 'direct' | 'class-based' | 'none';
  error?: string;
  debugInfo?: AssignmentDebugInfo;
}

// 학생 배정 정보 타입 (원본 구조 유지)
export interface StudentAssignment {
  id: string;
  studentId: string;
  studentName: string;
  roleName: string;
  roleContent: string;
  roleDescription?: string;
  roleType?: 'text' | 'image';
  sessionName?: string;
  class?: string;
  created_at?: string;
  status?: string;
}

// 반별 배정의 미션 타입
export interface ClassMission {
  name: string;
  content: string;
  description?: string;
}

// 디버그 정보 타입
export interface AssignmentDebugInfo {
  totalAssignments: number;
  studentDirectAssignments: number;
  classAssignments: number;
  allStudentIds: string[];
  currentStudentId: string;
  matchingLogic: {
    directMatches: Array<{
      assignmentId: string;
      studentIdFromDB: string;
      isMatch: boolean;
      isActive: boolean;
    }>;
    classMatches: Array<{
      assignmentId: string;
      targetClass: string;
      isMatch: boolean;
    }>;
  };
}

/**
 * 학생의 직접 배정 확인
 * 원본의 직접 배정 찾기 로직
 */
function findDirectAssignments(assignments: ExtendedAssignment[], student: StudentInfo): {
  assignments: ExtendedAssignment[];
  debugInfo: AssignmentDebugInfo['matchingLogic']['directMatches'];
} {
  const debugInfo: AssignmentDebugInfo['matchingLogic']['directMatches'] = [];
  
  const directAssignments = assignments.filter(assignment => {
    // Supabase는 student_id, localStorage는 studentId
    const studentIdFromDB = assignment.student_id || assignment.studentId || '';
    const isForThisStudent = studentIdFromDB === student.studentId;
    const isActive = !assignment.status || assignment.status === 'active';
    const isMatch = isForThisStudent && isActive;
    
    // 디버그 정보 수집
    debugInfo.push({
      assignmentId: assignment.id || 'unknown',
      studentIdFromDB,
      isMatch: isForThisStudent,
      isActive
    });
    
    return isMatch;
  });
  
  return { assignments: directAssignments, debugInfo };
}

/**
 * 반별 배정 확인
 * 원본의 반별 배정 찾기 로직
 */
function findClassAssignments(assignments: ExtendedAssignment[], student: StudentInfo): {
  assignments: ExtendedAssignment[];
  debugInfo: AssignmentDebugInfo['matchingLogic']['classMatches'];
} {
  const debugInfo: AssignmentDebugInfo['matchingLogic']['classMatches'] = [];
  
  const classAssignments = assignments.filter(assignment => {
    // Supabase는 target_class, localStorage는 targetClass
    const targetClassFromDB = assignment.target_class || assignment.targetClass || '';
    const classMatch = targetClassFromDB === student.fullClass;
    const statusMatch = !assignment.status || assignment.status === 'active';
    const isMatch = classMatch && statusMatch;
    
    // 디버그 정보 수집
    debugInfo.push({
      assignmentId: assignment.id || 'unknown',
      targetClass: targetClassFromDB,
      isMatch
    });
    
    return isMatch;
  });
  
  return { assignments: classAssignments, debugInfo };
}

/**
 * 반별 배정을 개별 학생 배정으로 변환
 * 원본의 미션 할당 로직 (학생 번호 기반)
 */
function convertClassToStudentAssignment(
  classAssignment: ExtendedAssignment, 
  student: StudentInfo
): StudentAssignment | null {
  try {
    // missions 배열 확인
    const missions: ClassMission[] = (classAssignment as any).missions || [];
    
    if (missions.length === 0) {
      // 미션이 없으면 기본 배정 정보 사용
      return {
        id: classAssignment.id || '',
        studentId: student.studentId,
        studentName: student.name,
        roleName: (classAssignment as any).sessionName || '기본 역할',
        roleContent: classAssignment.role_content || classAssignment.role || '기본 내용',
        roleDescription: classAssignment.role_content || '',
        roleType: (classAssignment.role_type as 'text' | 'image') || 'text',
        sessionName: (classAssignment as any).sessionName,
        class: student.fullClass,
        created_at: classAssignment.created_at,
        status: 'active'
      };
    }
    
    // 학생 번호 기반으로 미션 할당 (원본 로직 유지)
    const studentNumber = parseInt(student.number.toString()) || 1;
    const missionIndex = (studentNumber - 1) % missions.length;
    const selectedMission = missions[missionIndex];
    
    console.log(`[AssignmentCheck] 학생 ${student.number}번 → 미션 ${missionIndex}: ${selectedMission.name}`);
    
    return {
      id: `${classAssignment.id}_${student.studentId}`,
      studentId: student.studentId,
      studentName: student.name,
      roleName: selectedMission.name || (classAssignment as any).sessionName || '기본 역할',
      roleContent: selectedMission.content || selectedMission.name || '',
      roleDescription: selectedMission.description || selectedMission.content || '',
      roleType: (classAssignment.role_type as 'text' | 'image') || 'text',
      sessionName: (classAssignment as any).sessionName,
      class: student.fullClass,
      created_at: classAssignment.created_at,
      status: 'active'
    };
    
  } catch (error) {
    console.error('[AssignmentCheck] 반별 배정 변환 오류:', error);
    return null;
  }
}

/**
 * 학생의 과제 배정 확인
 * 원본 checkStudentAssignment 함수의 TypeScript 버전
 */
export async function checkStudentAssignment(student: StudentInfo): Promise<AssignmentCheckResult> {
  console.log('[AssignmentCheck] 과제 확인 시작:', student.studentId, student.name);
  
  try {
    // 1. 최신 배정 데이터 로드
    const assignmentResult: AssignmentServiceResult = await loadAssignments();
    
    if (!assignmentResult.success) {
      return {
        success: false,
        hasAssignment: false,
        error: `배정 데이터 로드 실패: ${assignmentResult.error}`,
        debugInfo: {
          totalAssignments: 0,
          studentDirectAssignments: 0,
          classAssignments: 0,
          allStudentIds: [],
          currentStudentId: student.studentId,
          matchingLogic: { directMatches: [], classMatches: [] }
        }
      };
    }
    
    const assignments = assignmentResult.data as ExtendedAssignment[];
    console.log('[AssignmentCheck] 로드된 배정 수:', assignments.length);
    
    // 디버그 정보 수집
    const allStudentIds = assignments
      .map(a => a.student_id || a.studentId)
      .filter(Boolean)
      .filter((id, index, arr) => arr.indexOf(id) === index) as string[]; // 중복 제거
    
    // 2. 직접 배정 확인
    const { assignments: directAssignments, debugInfo: directDebugInfo } = findDirectAssignments(assignments, student);
    
    if (directAssignments.length > 0) {
      console.log('[AssignmentCheck] 직접 배정 발견:', directAssignments.length, '개');
      
      // 가장 최신 배정 선택
      const latestAssignment = directAssignments[directAssignments.length - 1];
      const studentAssignment: StudentAssignment = {
        id: latestAssignment.id || '',
        studentId: student.studentId,
        studentName: student.name,
        roleName: (latestAssignment as any).roleName || latestAssignment.role || '직접 배정 역할',
        roleContent: latestAssignment.role_content || latestAssignment.role || '',
        roleDescription: (latestAssignment as any).roleDescription || '',
        roleType: (latestAssignment.role_type as 'text' | 'image') || 'text',
        sessionName: (latestAssignment as any).sessionName || '',
        class: student.fullClass,
        created_at: latestAssignment.created_at,
        status: latestAssignment.status || 'active'
      };
      
      return {
        success: true,
        hasAssignment: true,
        assignment: studentAssignment,
        assignmentType: 'direct',
        debugInfo: {
          totalAssignments: assignments.length,
          studentDirectAssignments: directAssignments.length,
          classAssignments: 0,
          allStudentIds: allStudentIds,
          currentStudentId: student.studentId,
          matchingLogic: { directMatches: directDebugInfo, classMatches: [] }
        }
      };
    }
    
    // 3. 반별 배정 확인
    console.log('[AssignmentCheck] 직접 배정 없음, 반별 배정 확인:', student.fullClass);
    
    const { assignments: classAssignments, debugInfo: classDebugInfo } = findClassAssignments(assignments, student);
    
    if (classAssignments.length > 0) {
      console.log('[AssignmentCheck] 반별 배정 발견:', classAssignments.length, '개');
      
      // 가장 최신 반별 배정 선택
      const latestClassAssignment = classAssignments[classAssignments.length - 1];
      const studentAssignment = convertClassToStudentAssignment(latestClassAssignment, student);
      
      if (studentAssignment) {
        return {
          success: true,
          hasAssignment: true,
          assignment: studentAssignment,
          assignmentType: 'class-based',
          debugInfo: {
            totalAssignments: assignments.length,
            studentDirectAssignments: 0,
            classAssignments: classAssignments.length,
            allStudentIds: allStudentIds,
            currentStudentId: student.studentId,
            matchingLogic: { directMatches: directDebugInfo, classMatches: classDebugInfo }
          }
        };
      }
    }
    
    // 4. 배정 없음
    console.log('[AssignmentCheck] 배정 없음');
    return {
      success: true,
      hasAssignment: false,
      assignmentType: 'none',
      debugInfo: {
        totalAssignments: assignments.length,
        studentDirectAssignments: 0,
        classAssignments: classAssignments.length,
        allStudentIds,
        currentStudentId: student.studentId,
        matchingLogic: { directMatches: directDebugInfo, classMatches: classDebugInfo }
      }
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    console.error('[AssignmentCheck] 과제 확인 오류:', errorMessage);
    
    return {
      success: false,
      hasAssignment: false,
      error: errorMessage
    };
  }
}