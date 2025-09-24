/**
 * Student Utility Functions
 * 학생 관련 유틸리티 함수들
 */

export interface StudentIdParseResult {
  grade: number;
  class: number;
  number: number;
  fullClass: string;
}

export interface StudentIdParseError {
  error: string;
}

/**
 * 학생 ID 파싱 함수
 * @param studentId 4자리 학생 ID (예: "1301")
 * @returns 파싱된 정보 또는 에러
 */
export function parseStudentId(studentId: string): StudentIdParseResult | StudentIdParseError {
    if (!studentId || studentId.length !== 4) {
        return { error: '학생 ID는 4자리여야 합니다.' };
    }
    
    const grade = parseInt(studentId.substring(0, 1));
    const classNum = parseInt(studentId.substring(1, 2));
    const number = parseInt(studentId.substring(2, 4));
    
    // 입력 검증
    if (isNaN(grade) || isNaN(classNum) || isNaN(number)) {
        return { error: '학생 ID는 숫자로만 구성되어야 합니다.' };
    }
    
    // 학년 검증 (1~6학년)
    if (grade < 1 || grade > 6) {
        return { error: '학년은 1~6학년 사이여야 합니다.' };
    }
    
    // 반 검증 (1~9반)
    if (classNum < 1 || classNum > 9) {
        return { error: '반은 1~9반 사이여야 합니다.' };
    }
    
    // 번호 검증 (27명 제한)
    if (number < 1 || number > 27) {
        return { error: '학급당 27명까지만 등록 가능합니다. 01~27번 사이의 번호를 입력해주세요.' };
    }
    
    return {
        grade: grade,
        class: classNum,
        number: number,
        fullClass: `${grade}-${classNum}`
    };
}

/**
 * 학생 ID 검증 (타입 가드 함수)
 * @param result parseStudentId의 결과
 * @returns 성공 여부
 */
export function isValidStudentId(result: StudentIdParseResult | StudentIdParseError): result is StudentIdParseResult {
    return !('error' in result);
}

/**
 * 학생 ID 형식 검증
 * @param input 입력값
 * @returns 형식화된 4자리 문자열 또는 null
 */
export function formatStudentId(input: string): string | null {
    // 숫자만 추출
    const numbers = input.replace(/[^0-9]/g, '');
    
    // 4자리로 제한
    if (numbers.length > 4) {
        return numbers.slice(0, 4);
    }
    
    return numbers.length > 0 ? numbers : null;
}

/**
 * 현재 시간을 한국어 형식으로 반환
 */
export function getCurrentTimeKorean(): string {
    const now = new Date();
    return now.toLocaleString('ko-KR');
}