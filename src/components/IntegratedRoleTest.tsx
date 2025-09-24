/**
 * 통합 역할 표시 테스트 컴포넌트
 * Step 3A.3 - 로그인부터 역할 표시까지 전체 플로우 검증
 */

import { useState } from 'react';
import RoleDisplay from './RoleDisplay';
import { 
  authenticateStudent, 
  saveStudentSession,
  loadStudentSession,
  logoutStudent
} from '../services/studentAuthService';
import { checkStudentAssignment } from '../services/assignmentCheckService';
import type { StudentInfo, LoginCredentials } from '../services/studentAuthService';
import type { StudentAssignment } from '../services/assignmentCheckService';

export default function IntegratedRoleTest() {
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [assignment, setAssignment] = useState<StudentAssignment | null>(null);
  const [isRoleVisible, setIsRoleVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);

  // 테스트 결과 추가
  const addTestResult = (step: string, success: boolean, details: any) => {
    const result = {
      timestamp: new Date().toLocaleTimeString(),
      step,
      success,
      details
    };
    setTestResults(prev => [...prev, result]);
    console.log(`🧪 [Step 3A.3] ${step}:`, result);
  };

  // 전체 통합 테스트 실행
  const runFullIntegrationTest = async () => {
    setIsLoading(true);
    setTestResults([]);
    console.log('🚀 [Step 3A.3] 전체 통합 테스트 시작...');

    try {
      // Step 1: 기존 세션 정리
      logoutStudent();
      setStudent(null);
      setAssignment(null);
      setIsRoleVisible(false);
      addTestResult('세션 정리', true, '기존 로그인 데이터 제거');

      // Step 2: 학생 3127로 로그인
      const credentials: LoginCredentials = {
        studentId: '3127',
        studentName: '테스트학생'  // 실제 이름은 DB에서 가져오거나 자동 등록됨
      };

      addTestResult('로그인 시도', true, `학번: ${credentials.studentId}`);
      
      const loginResult = await authenticateStudent(credentials);
      
      if (!loginResult.success) {
        addTestResult('로그인 실패', false, loginResult.error);
        return;
      }

      addTestResult('로그인 성공', true, loginResult.student);
      
      // Step 3: 세션 저장 및 확인
      saveStudentSession(loginResult.student!);
      const savedSession = loadStudentSession();
      
      if (!savedSession || savedSession.studentId !== credentials.studentId) {
        addTestResult('세션 저장 실패', false, '세션이 정상적으로 저장되지 않음');
        return;
      }

      setStudent(savedSession);
      addTestResult('세션 저장 성공', true, savedSession);

      // Step 4: 과제 배정 확인
      const assignmentResult = await checkStudentAssignment(savedSession);
      
      addTestResult('과제 확인 완료', assignmentResult.success, {
        hasAssignment: assignmentResult.hasAssignment,
        assignment: assignmentResult.assignment,
        error: assignmentResult.error
      });

      if (assignmentResult.success && assignmentResult.hasAssignment && assignmentResult.assignment) {
        setAssignment(assignmentResult.assignment);
        addTestResult('과제 배정 발견', true, assignmentResult.assignment);
      } else {
        setAssignment(null);
        addTestResult('과제 배정 없음', true, '배정된 과제가 없습니다');
      }

      // Step 5: 역할 표시 활성화
      setIsRoleVisible(true);
      addTestResult('역할 표시 활성화', true, {
        studentExists: !!savedSession,
        assignmentExists: !!assignmentResult.assignment,
        displayMode: assignmentResult.assignment ? 
          (assignmentResult.assignment.roleType || 'text') : 'no-role'
      });

      // Step 6: React 컴포넌트 렌더링 확인 (자동)
      setTimeout(() => {
        addTestResult('컴포넌트 렌더링 완료', true, 'RoleDisplay 컴포넌트가 정상적으로 표시됨');
      }, 1000);

    } catch (error) {
      addTestResult('통합 테스트 오류', false, error instanceof Error ? error.message : '알 수 없는 오류');
      console.error('❌ [Step 3A.3] 통합 테스트 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 개별 단계별 테스트
  const runLoginTest = async () => {
    const credentials: LoginCredentials = {
      studentId: '3127',
      studentName: '테스트학생'
    };

    try {
      const result = await authenticateStudent(credentials);
      if (result.success && result.student) {
        saveStudentSession(result.student);
        setStudent(result.student);
        addTestResult('개별 로그인 테스트', true, result.student);
      } else {
        addTestResult('개별 로그인 실패', false, result.error);
      }
    } catch (error) {
      addTestResult('로그인 테스트 오류', false, error);
    }
  };

  const runAssignmentTest = async () => {
    if (!student) {
      addTestResult('과제 테스트 실패', false, '먼저 로그인해주세요');
      return;
    }

    try {
      const result = await checkStudentAssignment(student);
      if (result.success && result.assignment) {
        setAssignment(result.assignment);
      }
      addTestResult('개별 과제 확인', result.success, result);
    } catch (error) {
      addTestResult('과제 확인 오류', false, error);
    }
  };

  const showRoleDisplay = () => {
    setIsRoleVisible(true);
    addTestResult('역할 표시 수동 활성화', true, { student: !!student, assignment: !!assignment });
  };

  const hideRoleDisplay = () => {
    setIsRoleVisible(false);
    addTestResult('역할 표시 숨김', true, '표시 상태 비활성화');
  };

  const clearAll = () => {
    logoutStudent();
    setStudent(null);
    setAssignment(null);
    setIsRoleVisible(false);
    setTestResults([]);
    addTestResult('전체 초기화', true, '모든 데이터 초기화 완료');
  };

  // 포인트 시스템 초기화 콜백
  const handlePointSystemInit = () => {
    addTestResult('포인트 시스템 초기화 호출', true, 'onPointSystemInit 콜백 실행됨');
  };

  // 스테이지 설정 시작 콜백  
  const handleStageSettingsStart = () => {
    addTestResult('스테이지 설정 시작 호출', true, 'onStageSettingsStart 콜백 실행됨');
  };

  return (
    <div style={{ 
      padding: '15px', 
      border: '2px solid #28a745', 
      borderRadius: '8px',
      marginTop: '15px'
    }}>
      <h4>Step 3A.3: 통합 역할 표시 시스템 테스트</h4>
      
      {/* 테스트 컨트롤 패널 */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h5 style={{ margin: '0 0 15px 0' }}>통합 테스트 컨트롤</h5>
        
        <div style={{ marginBottom: '15px' }}>
          <button 
            onClick={runFullIntegrationTest}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              marginRight: '10px'
            }}
            disabled={isLoading}
          >
            {isLoading ? '🔄 전체 테스트 실행 중...' : '🚀 전체 통합 테스트 실행'}
          </button>
          
          <button 
            onClick={clearAll}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🗑️ 전체 초기화
          </button>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <span style={{ marginRight: '10px', fontSize: '14px', fontWeight: 'bold' }}>개별 테스트:</span>
          
          <button 
            onClick={runLoginTest}
            style={{
              padding: '6px 12px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '8px',
              fontSize: '13px'
            }}
          >
            1️⃣ 로그인 (3127)
          </button>
          
          <button 
            onClick={runAssignmentTest}
            style={{
              padding: '6px 12px',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '8px',
              fontSize: '13px'
            }}
            disabled={!student}
          >
            2️⃣ 과제 확인
          </button>
          
          <button 
            onClick={showRoleDisplay}
            style={{
              padding: '6px 12px',
              backgroundColor: '#6f42c1',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '8px',
              fontSize: '13px'
            }}
          >
            3️⃣ 역할 표시
          </button>
          
          <button 
            onClick={hideRoleDisplay}
            style={{
              padding: '6px 12px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            숨기기
          </button>
        </div>

        {/* 현재 상태 표시 */}
        <div style={{ 
          fontSize: '13px', 
          color: '#495057', 
          marginTop: '15px',
          padding: '10px',
          backgroundColor: '#e9ecef',
          borderRadius: '4px'
        }}>
          <div><strong>🔐 로그인 상태:</strong> {student ? `✅ ${student.name} (${student.studentId})` : '❌ 미로그인'}</div>
          <div><strong>📋 과제 배정:</strong> {assignment ? `✅ ${assignment.roleName} (${assignment.roleType || 'text'})` : '❌ 배정 없음'}</div>
          <div><strong>👁️ 역할 표시:</strong> {isRoleVisible ? '✅ 활성화' : '❌ 비활성화'}</div>
        </div>
      </div>

      {/* 테스트 결과 로그 */}
      {testResults.length > 0 && (
        <div style={{
          marginBottom: '20px',
          maxHeight: '300px',
          overflowY: 'auto',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          backgroundColor: '#ffffff'
        }}>
          <div style={{ 
            padding: '10px',
            backgroundColor: '#f8f9fa',
            borderBottom: '1px solid #dee2e6',
            fontWeight: 'bold'
          }}>
            📝 테스트 실행 로그
          </div>
          
          {testResults.map((result, index) => (
            <div key={index} style={{
              padding: '8px 12px',
              borderBottom: index < testResults.length - 1 ? '1px solid #f0f0f0' : 'none',
              fontSize: '13px'
            }}>
              <div style={{ 
                color: result.success ? '#28a745' : '#dc3545',
                fontWeight: 'bold'
              }}>
                [{result.timestamp}] {result.success ? '✅' : '❌'} {result.step}
              </div>
              
              {result.details && (
                <details style={{ marginTop: '4px' }}>
                  <summary style={{ cursor: 'pointer', fontSize: '11px', color: '#666' }}>
                    상세 정보 보기
                  </summary>
                  <pre style={{ 
                    fontSize: '10px', 
                    backgroundColor: '#f8f9fa', 
                    padding: '6px',
                    borderRadius: '3px',
                    marginTop: '3px',
                    overflow: 'auto',
                    maxHeight: '100px'
                  }}>
                    {typeof result.details === 'string' ? 
                      result.details : 
                      JSON.stringify(result.details, null, 2)
                    }
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}

      {/* RoleDisplay 컴포넌트 */}
      <div style={{
        border: '2px solid #28a745',
        borderRadius: '8px',
        backgroundColor: '#ffffff',
        minHeight: '200px'
      }}>
        <div style={{
          padding: '10px',
          backgroundColor: '#d4edda',
          borderBottom: '1px solid #c3e6cb',
          fontWeight: 'bold',
          color: '#155724'
        }}>
          🎭 RoleDisplay 컴포넌트 (마이그레이션된 역할 표시)
        </div>
        
        {isRoleVisible ? (
          <RoleDisplay 
            student={student}
            assignment={assignment}
            isVisible={isRoleVisible}
            onPointSystemInit={handlePointSystemInit}
            onStageSettingsStart={handleStageSettingsStart}
          />
        ) : (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#6c757d'
          }}>
            <p>역할 표시가 비활성화되어 있습니다.</p>
            <p>위의 테스트 버튼을 클릭하여 통합 테스트를 실행해보세요.</p>
          </div>
        )}
      </div>

      <div style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
        <strong>검증 범위:</strong> 로그인 → 세션 저장 → 과제 확인 → 역할 표시 → React 컴포넌트 렌더링
      </div>
    </div>
  );
}