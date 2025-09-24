/**
 * Student Initialization Hook
 * 원본 initializeStudent 함수를 React Hook으로 마이그레이션
 */

import { useState, useEffect, useCallback } from 'react';
import { loadAssignments } from '../services/assignmentService';
import type { Assignment, AssignmentServiceResult } from '../services/assignmentService';

// 초기화 상태 타입 정의
export interface StudentInitializationState {
  isInitializing: boolean;
  isInitialized: boolean;
  assignments: Assignment[];
  assignmentLoadResult: AssignmentServiceResult | null;
  error: string | null;
  initializationStep: string;
}

// 초기화 Hook 반환 타입
export interface UseStudentInitializationReturn {
  state: StudentInitializationState;
  reinitialize: () => Promise<void>;
  loadAssignmentsOnly: () => Promise<void>;
}

/**
 * 학생 시스템 초기화 Hook
 * 원본 initializeStudent() 함수의 React 버전
 */
export function useStudentInitialization(): UseStudentInitializationReturn {
  const [state, setState] = useState<StudentInitializationState>({
    isInitializing: false,
    isInitialized: false,
    assignments: [],
    assignmentLoadResult: null,
    error: null,
    initializationStep: '대기 중'
  });

  // 과제 로드 함수 (원본 loadAssignments 호출)
  const loadAssignmentsOnly = useCallback(async () => {
    console.log('[useStudentInitialization] Assignment 로드 시작');
    
    setState(prev => ({
      ...prev,
      initializationStep: 'Assignments 로딩 중...'
    }));

    try {
      const result = await loadAssignments();
      
      setState(prev => ({
        ...prev,
        assignments: result.data,
        assignmentLoadResult: result,
        initializationStep: result.success ? 
          `Assignments 로드 완료 (${result.data.length}개)` :
          `Assignments 로드 실패: ${result.error}`
      }));

      console.log('[useStudentInitialization] Assignment 로드 완료:', result);
      return;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      console.error('[useStudentInitialization] Assignment 로드 오류:', errorMessage);
      
      setState(prev => ({
        ...prev,
        error: `Assignment 로드 실패: ${errorMessage}`,
        initializationStep: `오류: ${errorMessage}`
      }));
    }
  }, []);

  // loadSessions 함수 (원본에서는 별도 함수, 여기서는 간단히 구현)
  const loadSessions = useCallback(async () => {
    console.log('[useStudentInitialization] Sessions 로드 시작');
    
    setState(prev => ({
      ...prev,
      initializationStep: 'Sessions 로딩 중...'
    }));

    // 원본 로직에서는 Supabase sessions 테이블을 조회하지만, 
    // 현재는 간단히 localStorage 또는 기본값 사용
    try {
      // localStorage에서 세션 데이터 로드 시도
      const savedSessions = localStorage.getItem('sessions');
      const sessions = savedSessions ? JSON.parse(savedSessions) : [];
      
      console.log('[useStudentInitialization] Sessions 로드 완료:', sessions.length, '개');
      setState(prev => ({
        ...prev,
        initializationStep: `Sessions 로드 완료 (${sessions.length}개)`
      }));
      
    } catch (error) {
      console.warn('[useStudentInitialization] Sessions 로드 실패, 기본값 사용:', error);
      setState(prev => ({
        ...prev,
        initializationStep: 'Sessions 로드 완료 (기본값)'
      }));
    }
  }, []);

  // loadStageSettings 함수 (원본의 동적 설명 로드)
  const loadStageSettings = useCallback(async () => {
    console.log('[useStudentInitialization] Stage Settings 로드 시작');
    
    setState(prev => ({
      ...prev,
      initializationStep: 'Stage Settings 로딩 중...'
    }));

    try {
      // 원본에서는 별도 API 호출, 여기서는 localStorage 또는 기본값
      const savedSettings = localStorage.getItem('stageSettings');
      if (savedSettings) {
        JSON.parse(savedSettings); // 유효성 검사만 수행
      }
      
      console.log('[useStudentInitialization] Stage Settings 로드 완료');
      setState(prev => ({
        ...prev,
        initializationStep: 'Stage Settings 로드 완료'
      }));
      
    } catch (error) {
      console.warn('[useStudentInitialization] Stage Settings 로드 실패, 기본값 사용:', error);
      setState(prev => ({
        ...prev,
        initializationStep: 'Stage Settings 로드 완료 (기본값)'
      }));
    }
  }, []);

  // Learning Guides Schema 초기화 (원본의 조건부 초기화)
  const initializeLearningGuidesSchema = useCallback(async () => {
    console.log('[useStudentInitialization] Learning Guides Schema 확인');
    
    setState(prev => ({
      ...prev,
      initializationStep: 'Learning Guides Schema 확인 중...'
    }));

    try {
      // 원본에서는 전역 함수 존재 여부 확인 후 호출
      // React 환경에서는 해당 기능이 필요할 때 별도 구현
      console.log('[useStudentInitialization] Learning Guides Schema 스킵 (React 환경)');
      
      setState(prev => ({
        ...prev,
        initializationStep: 'Learning Guides Schema 완료'
      }));
      
    } catch (error) {
      console.log('[useStudentInitialization] Learning Guides Schema 초기화 스킵:', error);
      setState(prev => ({
        ...prev,
        initializationStep: 'Learning Guides Schema 스킵됨'
      }));
    }
  }, []);

  // 전체 초기화 함수 (원본 initializeStudent 로직)
  const initialize = useCallback(async () => {
    if (state.isInitializing) {
      console.log('[useStudentInitialization] 이미 초기화 진행 중, 중복 실행 방지');
      return;
    }

    console.log('[useStudentInitialization] 학생 시스템 초기화 시작');
    
    setState(prev => ({
      ...prev,
      isInitializing: true,
      isInitialized: false,
      error: null,
      initializationStep: '초기화 시작'
    }));

    try {
      // 1. Learning Guides Schema 초기화 (조건부)
      await initializeLearningGuidesSchema();
      
      // 2. Assignments 로드
      await loadAssignmentsOnly();
      
      // 3. Sessions 로드  
      await loadSessions();
      
      // 4. Stage Settings 로드
      await loadStageSettings();
      
      // 초기화 완료
      setState(prev => ({
        ...prev,
        isInitializing: false,
        isInitialized: true,
        initializationStep: '초기화 완료'
      }));
      
      console.log('✅ [useStudentInitialization] 학생 시스템 초기화 완료');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      console.error('❌ [useStudentInitialization] 초기화 실패:', errorMessage);
      
      setState(prev => ({
        ...prev,
        isInitializing: false,
        isInitialized: false,
        error: `초기화 실패: ${errorMessage}`,
        initializationStep: `오류: ${errorMessage}`
      }));
    }
  }, [state.isInitializing, initializeLearningGuidesSchema, loadAssignmentsOnly, loadSessions, loadStageSettings]);

  // 재초기화 함수
  const reinitialize = useCallback(async () => {
    console.log('[useStudentInitialization] 재초기화 요청');
    setState(prev => ({
      ...prev,
      isInitialized: false,
      error: null
    }));
    await initialize();
  }, [initialize]);

  // 컴포넌트 마운트 시 자동 초기화
  useEffect(() => {
    if (!state.isInitialized && !state.isInitializing) {
      console.log('[useStudentInitialization] 자동 초기화 시작');
      initialize();
    }
  }, [initialize, state.isInitialized, state.isInitializing]);

  return {
    state,
    reinitialize,
    loadAssignmentsOnly
  };
}