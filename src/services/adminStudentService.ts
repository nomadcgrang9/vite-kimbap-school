/**
 * Admin Student Service
 * Step 3B.1b: loadStudents 함수 마이그레이션
 * 원본: admin-rolesv2.js loadStudents()
 */

import { getSupabaseClient } from './supabaseService';

// ============ 타입 정의 ============

export interface AdminStudent {
  id: string;
  created_at: string;
  updated_at?: string;
  student_id: string; // 4자리 학생 번호 (예: "1201", "3127")
  name: string;
  grade: number; // 학년 (1-6)
  class_num: number; // 반 (1-9)
  number: number; // 번호 (1-27)
  full_class?: string; // 자동 생성 필드 (예: "1-2")
  email?: string;
  phone?: string;
  is_active: boolean;
}

export interface AdminStudentLoadResult {
  success: boolean;
  data: AdminStudent[];
  count: number;
  byGrade?: Record<number, AdminStudent[]>; // 학년별 그룹핑
  byClass?: Record<string, AdminStudent[]>; // 반별 그룹핑 
  error?: string;
  source: 'supabase' | 'localStorage' | 'cache';
}

export interface StudentStats {
  totalStudents: number;
  activeStudents: number;
  byGrade: Record<number, number>;
  byClass: Record<string, number>;
}

// ============ 학생 데이터 로드 함수 ============

export async function loadAdminStudents(): Promise<AdminStudentLoadResult> {
  console.log('👥 [AdminStudentService] 학생 데이터 로드 시작');
  
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase 클라이언트 초기화 실패');
    }
    
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('grade, class_num, number');
      
    if (error) {
      console.error('❌ [AdminStudentService] 학생 로드 오류:', error);
      throw new Error(`학생 로드 실패: ${error.message}`);
    }
    
    const students = data || [];
    
    // full_class 필드 자동 생성
    const processedStudents: AdminStudent[] = students.map(student => ({
      ...student,
      full_class: `${student.grade}-${student.class_num}`
    }));
    
    // 학년별, 반별 그룹핑
    const byGrade: Record<number, AdminStudent[]> = {};
    const byClass: Record<string, AdminStudent[]> = {};
    
    processedStudents.forEach(student => {
      // 학년별 그룹핑
      if (!byGrade[student.grade]) {
        byGrade[student.grade] = [];
      }
      byGrade[student.grade].push(student);
      
      // 반별 그룹핑
      const classKey = student.full_class || `${student.grade}-${student.class_num}`;
      if (!byClass[classKey]) {
        byClass[classKey] = [];
      }
      byClass[classKey].push(student);
    });
    
    console.log(`✅ [AdminStudentService] 학생 데이터 로드 완료: ${processedStudents.length}명`);
    console.log(`📊 [AdminStudentService] 학년별 분포:`, Object.keys(byGrade).map(grade => 
      `${grade}학년: ${byGrade[parseInt(grade)].length}명`
    ).join(', '));
    
    return {
      success: true,
      data: processedStudents,
      count: processedStudents.length,
      byGrade,
      byClass,
      source: 'supabase'
    };
    
  } catch (error) {
    console.error('❌ [AdminStudentService] 학생 로드 실패:', error);
    
    // localStorage 폴백 시도
    try {
      const cached = localStorage.getItem('admin_students');
      if (cached) {
        const cachedStudents = JSON.parse(cached);
        console.log(`📱 [AdminStudentService] localStorage에서 ${cachedStudents.length}명 학생 로드`);
        
        return {
          success: true,
          data: cachedStudents,
          count: cachedStudents.length,
          source: 'localStorage'
        };
      }
    } catch (cacheError) {
      console.warn('⚠️ [AdminStudentService] localStorage 폴백 실패:', cacheError);
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

// ============ 학생 캐싱 함수 ============

export function cacheAdminStudents(students: AdminStudent[]): void {
  try {
    localStorage.setItem('admin_students', JSON.stringify(students));
    console.log('💾 [AdminStudentService] 학생 데이터 캐시됨');
  } catch (error) {
    console.warn('⚠️ [AdminStudentService] 학생 캐싱 실패:', error);
  }
}

// ============ 학생 검증 함수 ============

export function validateAdminStudent(student: any): student is AdminStudent {
  return (
    typeof student === 'object' &&
    typeof student.id === 'string' &&
    typeof student.student_id === 'string' &&
    typeof student.name === 'string' &&
    typeof student.grade === 'number' &&
    typeof student.class_num === 'number' &&
    typeof student.number === 'number' &&
    typeof student.is_active === 'boolean' &&
    student.grade >= 1 && student.grade <= 6 &&
    student.class_num >= 1 && student.class_num <= 9 &&
    student.number >= 1 && student.number <= 27 &&
    student.student_id.length === 4
  );
}

// ============ 학생 필터링 함수들 ============

export function filterActiveStudents(students: AdminStudent[]): AdminStudent[] {
  return students.filter(student => student.is_active);
}

export function filterStudentsByGrade(students: AdminStudent[], grade: number): AdminStudent[] {
  return students.filter(student => student.grade === grade);
}

export function filterStudentsByClass(students: AdminStudent[], grade: number, classNum: number): AdminStudent[] {
  return students.filter(student => 
    student.grade === grade && student.class_num === classNum
  );
}

export function findStudentById(students: AdminStudent[], studentId: string): AdminStudent | null {
  return students.find(student => student.student_id === studentId) || null;
}

export function findStudentsByName(students: AdminStudent[], name: string): AdminStudent[] {
  return students.filter(student => 
    student.name.includes(name) || student.name.toLowerCase().includes(name.toLowerCase())
  );
}

// ============ 학생 통계 함수 ============

export function getStudentStats(students: AdminStudent[]): StudentStats {
  const activeStudents = filterActiveStudents(students);
  
  const byGrade: Record<number, number> = {};
  const byClass: Record<string, number> = {};
  
  activeStudents.forEach(student => {
    // 학년별 카운트
    byGrade[student.grade] = (byGrade[student.grade] || 0) + 1;
    
    // 반별 카운트
    const classKey = `${student.grade}-${student.class_num}`;
    byClass[classKey] = (byClass[classKey] || 0) + 1;
  });
  
  return {
    totalStudents: students.length,
    activeStudents: activeStudents.length,
    byGrade,
    byClass
  };
}

// ============ 학생 정렬 함수 ============

export function sortStudentsByClass(students: AdminStudent[]): AdminStudent[] {
  return [...students].sort((a, b) => {
    if (a.grade !== b.grade) return a.grade - b.grade;
    if (a.class_num !== b.class_num) return a.class_num - b.class_num;
    return a.number - b.number;
  });
}

export function sortStudentsByName(students: AdminStudent[]): AdminStudent[] {
  return [...students].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
}