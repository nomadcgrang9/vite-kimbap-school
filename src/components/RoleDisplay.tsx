/**
 * Role Display Component
 * 원본 showRole, showNoRole, displayRole 함수들을 React 컴포넌트로 마이그레이션
 */

import { useState, useEffect } from 'react';
import type { StudentInfo } from '../services/studentAuthService';
import type { StudentAssignment } from '../services/assignmentCheckService';

// 역할 표시 상태 타입
interface RoleDisplayState {
  isVisible: boolean;
  student: StudentInfo | null;
  assignment: StudentAssignment | null;
  displayMode: 'loading' | 'no-role' | 'text-role' | 'image-role';
}

// Props 타입
interface RoleDisplayProps {
  student: StudentInfo | null;
  assignment: StudentAssignment | null;
  isVisible?: boolean;
  onPointSystemInit?: () => void;
  onStageSettingsStart?: () => void;
}

export default function RoleDisplay({
  student,
  assignment,
  isVisible = false,
  onPointSystemInit,
  onStageSettingsStart
}: RoleDisplayProps) {
  const [state, setState] = useState<RoleDisplayState>({
    isVisible: false,
    student: null,
    assignment: null,
    displayMode: 'loading'
  });

  // Props 변화 감지 및 상태 업데이트
  useEffect(() => {
    setState(prev => ({
      ...prev,
      isVisible,
      student,
      assignment,
      displayMode: determineDisplayMode(assignment)
    }));

    // 역할 표시가 활성화될 때 초기화 함수들 호출 (원본 showRole 로직)
    if (isVisible && student) {
      console.log('[RoleDisplay] 역할 표시 활성화:', student.studentId);
      
      // 포인트 시스템 초기화
      if (onPointSystemInit) {
        onPointSystemInit();
        console.log('[RoleDisplay] 포인트 시스템 초기화 요청');
      }
      
      // 스테이지 설정 자동 새로고침 시작
      if (onStageSettingsStart) {
        onStageSettingsStart();
        console.log('[RoleDisplay] 스테이지 설정 자동 새로고침 시작');
      }
    }
  }, [isVisible, student, assignment, onPointSystemInit, onStageSettingsStart]);

  // 표시 모드 결정 함수
  function determineDisplayMode(assignment: StudentAssignment | null): RoleDisplayState['displayMode'] {
    if (!assignment) {
      return 'no-role';
    }
    
    const roleType = assignment.role_type || assignment.roleType;
    return roleType === 'image' ? 'image-role' : 'text-role';
  }

  // 역할명 추출 함수
  function getRoleName(): string {
    if (!assignment) return '배정된 역할이 없습니다';
    
    // Supabase vs localStorage 필드명 호환성
    return assignment.roleContent || 
           assignment.role_content || 
           assignment.roleName || 
           assignment.role_name || 
           '역할';
  }

  // 역할 설명 추출 함수
  function getRoleDescription(): string {
    if (!assignment) return '🔧 [수정됨] 역할 배정 시스템이 업데이트되었습니다!';
    
    return assignment.roleDescription || 
           assignment.role_description || 
           assignment.roleContent ||
           assignment.role_content ||
           '역할 설명이 없습니다.';
  }

  // 세션 정보 추출 함수
  function getSessionInfo(): string {
    if (!assignment) return '';
    
    return assignment.sessionName || 
           assignment.session_name || 
           '세션 정보 없음';
  }

  // 컴포넌트가 보이지 않으면 렌더링하지 않음
  if (!state.isVisible) {
    return null;
  }

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '600px', 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* 학생 정보 표시 (원본 showRole의 학생 정보 표시 부분) */}
      {student && (
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #dee2e6'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>학생 정보</h3>
          <div style={{ fontSize: '16px' }}>
            <div><strong>학번:</strong> {student.studentId}</div>
            <div><strong>이름:</strong> {student.name}</div>
            <div><strong>반:</strong> {student.fullClass} {student.number}번</div>
          </div>
        </div>
      )}

      {/* 역할 표시 영역 */}
      <div style={{
        border: '2px solid #007bff',
        borderRadius: '12px',
        padding: '20px',
        backgroundColor: '#ffffff'
      }}>
        {state.displayMode === 'loading' && (
          <div style={{ textAlign: 'center', color: '#6c757d' }}>
            <h2>🔄 역할 정보 로딩 중...</h2>
          </div>
        )}

        {state.displayMode === 'no-role' && (
          <div style={{ textAlign: 'center', color: '#6c757d' }}>
            <h2 style={{ color: '#dc3545' }}>📋 배정된 역할이 없습니다</h2>
            <p style={{ fontSize: '16px', marginTop: '15px' }}>
              {getRoleDescription()}
            </p>
            <div style={{
              marginTop: '20px',
              padding: '15px',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '8px'
            }}>
              <p style={{ margin: 0, color: '#856404' }}>
                💡 관리자가 역할을 배정할 때까지 기다려주세요.
              </p>
            </div>
          </div>
        )}

        {state.displayMode === 'text-role' && (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ 
              color: '#007bff', 
              marginBottom: '20px',
              fontSize: '28px'
            }}>
              🎭 {getRoleName()}
            </h2>
            
            <div style={{
              backgroundColor: '#e7f3ff',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #007bff',
              marginBottom: '15px'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#0056b3' }}>역할 내용:</h4>
              <p style={{ 
                margin: 0, 
                fontSize: '16px', 
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap'
              }}>
                {getRoleDescription()}
              </p>
            </div>

            {getSessionInfo() !== '세션 정보 없음' && (
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid #dee2e6'
              }}>
                <h5 style={{ margin: '0 0 8px 0', color: '#495057' }}>📚 세션:</h5>
                <p style={{ margin: 0, fontSize: '14px' }}>{getSessionInfo()}</p>
              </div>
            )}
          </div>
        )}

        {state.displayMode === 'image-role' && (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ 
              color: '#28a745', 
              marginBottom: '20px',
              fontSize: '28px'
            }}>
              🖼️ {getRoleName()}
            </h2>
            
            <div style={{
              backgroundColor: '#d4edda',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #28a745',
              marginBottom: '15px'
            }}>
              <p style={{ 
                margin: '0 0 15px 0', 
                fontSize: '16px',
                color: '#155724'
              }}>
                📸 이미지 기반 역할이 배정되었습니다.
              </p>
              
              {/* 이미지 표시 영역 (추후 확장 가능) */}
              <div style={{
                width: '100%',
                height: '200px',
                backgroundColor: '#f8f9fa',
                border: '2px dashed #28a745',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6c757d',
                fontSize: '14px'
              }}>
                🖼️ 이미지 표시 영역<br/>
                (추후 구현 예정)
              </div>

              <div style={{ marginTop: '15px' }}>
                <h5 style={{ margin: '0 0 8px 0', color: '#155724' }}>역할 설명:</h5>
                <p style={{ 
                  margin: 0, 
                  fontSize: '14px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {getRoleDescription()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 디버그 정보 (개발용) */}
        {assignment && (
          <details style={{ 
            marginTop: '20px', 
            fontSize: '12px', 
            color: '#6c757d' 
          }}>
            <summary style={{ cursor: 'pointer' }}>
              🔍 개발자 정보 (디버그)
            </summary>
            <pre style={{
              backgroundColor: '#f8f9fa',
              padding: '10px',
              borderRadius: '4px',
              marginTop: '10px',
              overflow: 'auto'
            }}>
              {JSON.stringify({
                assignmentId: assignment.id,
                roleType: assignment.role_type || assignment.roleType,
                displayMode: state.displayMode,
                hasRoleContent: !!(assignment.roleContent || assignment.role_content),
                sessionInfo: getSessionInfo()
              }, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}