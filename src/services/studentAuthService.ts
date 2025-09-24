/**
 * Student Authentication Service
 * 원본 studentLogin 함수를 TypeScript로 안전하게 마이그레이션
 */

import { parseStudentId, isValidStudentId } from '../utils/studentUtils';
import { safeSupabaseCall } from './supabaseService';

// 학생 정보 타입 정의
export interface StudentInfo {
  id: string;
  studentId: string;
  name: string;
  grade: number;
  classNum: number;
  number: number;
  fullClass: string;
}

// 로그인 입력 데이터 타입
export interface LoginCredentials {
  studentId: string;
  studentName: string;
}

// 로그인 결과 타입
export interface LoginResult {
  success: boolean;
  student?: StudentInfo;
  error?: string;
  step?: string;
}

// 자동 등록 결과 타입
export interface AutoRegisterResult {
  success: boolean;
  isNewStudent: boolean;
  error?: string;
}

/**
 * 로그인 입력값 검증
 * 원본 studentLogin 함수의 초기 검증 로직
 */
export function validateLoginCredentials(credentials: LoginCredentials): { valid: boolean; error?: string } {
  const { studentId, studentName } = credentials;
  
  // 빈 값 체크
  if (!studentId || !studentName) {
    return { valid: false, error: '학번과 이름을 모두 입력해주세요.' };
  }
  
  // 학번 형식 체크 (4자리 숫자)
  if (!/^\d{4}$/.test(studentId)) {
    return { valid: false, error: '학번은 4자리 숫자여야 합니다.' };
  }
  
  // 이름 길이 체크 (추가 검증)
  if (studentName.length < 2 || studentName.length > 10) {
    return { valid: false, error: '이름은 2~10글자 사이여야 합니다.' };
  }
  
  return { valid: true };
}

/**
 * 학생 ID 파싱 및 검증
 * 원본의 parseStudentId 호출 부분을 TypeScript로 안전하게 래핑
 */
export function parseAndValidateStudentId(studentId: string): { valid: boolean; parsed?: any; error?: string } {
  const parsedResult = parseStudentId(studentId);
  
  if (!isValidStudentId(parsedResult)) {
    return { 
      valid: false, 
      error: parsedResult.error || '잘못된 학번 형식입니다.' 
    };
  }
  
  return { valid: true, parsed: parsedResult };
}

/**
 * 학생 자동 등록
 * 원본 autoRegisterStudent 함수의 TypeScript 버전
 */
export async function autoRegisterStudent(studentInfo: StudentInfo): Promise<AutoRegisterResult> {
  console.log('[StudentAuth] 학생 자동 등록 시작:', studentInfo.studentId);
  
  try {
    const result = await safeSupabaseCall(async (client) => {
      // 1. 기존 학생 확인
      const { data: existingStudent, error: selectError } = await client
        .from('students')
        .select('*')
        .eq('student_id', studentInfo.studentId)
        .single();
      
      if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = no rows found
        throw new Error(`학생 조회 오류: ${selectError.message}`);
      }
      
      if (existingStudent) {
        console.log('[StudentAuth] 기존 학생 확인됨:', existingStudent);
        return { success: true, isNewStudent: false };
      }
      
      // 2. 신규 학생 등록
      const { error: insertError } = await client
        .from('students')
        .insert([{
          student_id: studentInfo.studentId,
          name: studentInfo.name,
          grade: studentInfo.grade,
          class_num: studentInfo.classNum,
          number: studentInfo.number,
          full_class: studentInfo.fullClass,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);
      
      if (insertError) {
        throw new Error(`학생 등록 오류: ${insertError.message}`);
      }
      
      console.log('[StudentAuth] 신규 학생 등록 완료:', studentInfo.studentId);
      return { success: true, isNewStudent: true };
    });
    
    return result || { success: false, isNewStudent: false, error: 'Supabase 호출 실패' };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    console.error('[StudentAuth] 자동 등록 실패:', errorMessage);
    
    return {
      success: false,
      isNewStudent: false,
      error: errorMessage
    };
  }
}

/**
 * 학생 로그인 프로세스
 * 원본 studentLogin 함수의 핵심 로직을 TypeScript로 구현
 */
export async function authenticateStudent(credentials: LoginCredentials): Promise<LoginResult> {
  console.log('[StudentAuth] 로그인 프로세스 시작');
  
  try {
    // 1. 입력값 검증
    const validationResult = validateLoginCredentials(credentials);
    if (!validationResult.valid) {
      return {
        success: false,
        error: validationResult.error,
        step: '입력값 검증'
      };
    }
    
    // 2. 학번 파싱
    const parseResult = parseAndValidateStudentId(credentials.studentId);
    if (!parseResult.valid) {
      return {
        success: false,
        error: parseResult.error,
        step: '학번 파싱'
      };
    }
    
    // 3. 학생 정보 객체 생성 (원본 currentStudent 구조 유지)
    const studentInfo: StudentInfo = {
      id: credentials.studentId,
      studentId: credentials.studentId,
      name: credentials.studentName,
      grade: parseResult.parsed!.grade,
      classNum: parseResult.parsed!.class,
      number: parseResult.parsed!.number,
      fullClass: parseResult.parsed!.fullClass
    };
    
    // 4. 자동 등록
    const registerResult = await autoRegisterStudent(studentInfo);
    if (!registerResult.success) {
      return {
        success: false,
        error: `등록 실패: ${registerResult.error}`,
        step: '자동 등록'
      };
    }
    
    console.log('[StudentAuth] 로그인 성공:', studentInfo.studentId);
    return {
      success: true,
      student: studentInfo,
      step: '완료'
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    console.error('[StudentAuth] 로그인 프로세스 오류:', errorMessage);
    
    return {
      success: false,
      error: `로그인 실패: ${errorMessage}`,
      step: '프로세스 오류'
    };
  }
}

/**
 * 세션 스토리지에 학생 정보 저장
 * 원본의 sessionStorage 저장 로직
 */
export function saveStudentSession(student: StudentInfo): boolean {
  try {
    sessionStorage.setItem('currentStudent', JSON.stringify(student));
    console.log('[StudentAuth] 세션 저장 완료:', student.studentId);
    return true;
  } catch (error) {
    console.error('[StudentAuth] 세션 저장 실패:', error);
    return false;
  }
}

/**
 * 세션 스토리지에서 학생 정보 로드
 */
export function loadStudentSession(): StudentInfo | null {
  try {
    const savedData = sessionStorage.getItem('currentStudent');
    if (!savedData) return null;
    
    const student = JSON.parse(savedData) as StudentInfo;
    console.log('[StudentAuth] 세션 로드 완료:', student.studentId);
    return student;
  } catch (error) {
    console.error('[StudentAuth] 세션 로드 실패:', error);
    return null;
  }
}

/**
 * 로그아웃 (세션 정리)
 */
export function logoutStudent(): void {
  try {
    sessionStorage.removeItem('currentStudent');
    console.log('[StudentAuth] 로그아웃 완료');
  } catch (error) {
    console.error('[StudentAuth] 로그아웃 오류:', error);
  }
}