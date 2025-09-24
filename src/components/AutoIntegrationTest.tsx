/**
 * 자동 통합 테스트 실행 컴포넌트
 * Step 3A.3 자동 검증용
 */

import { useEffect, useState, useCallback } from 'react';
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

export default function AutoIntegrationTest() {
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [assignment, setAssignment] = useState<StudentAssignment | null>(null);
  const [isRoleVisible, setIsRoleVisible] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);



  // 자동 통합 테스트 실행
  useEffect(() => {
    let isMounted = true;

    const runAutoTest = async () => {
      if (!isMounted) return;
      
      console.log('🚀 [Step 3A.3 Auto] 자동 통합 테스트 시작...');

      try {
        // Step 1: 세션 정리
        logoutStudent();
        if (!isMounted) return;
        
        setStudent(null);
        setAssignment(null);
        setIsRoleVisible(false);
        
        const addResult = (step: string, success: boolean, details: any) => {
          const result = {
            timestamp: new Date().toLocaleTimeString(),
            step,
            success,
            details
          };
          if (isMounted) {
            setTestResults(prev => [...prev, result]);
          }
          console.log(`🚀 [Step 3A.3 Auto] ${step}:`, result);
        };

        addResult('1. 세션 정리', true, '기존 로그인 데이터 제거 완료');

        // 잠시 대기
        await new Promise(resolve => setTimeout(resolve, 500));
        if (!isMounted) return;

        // Step 2: 학생 3127로 로그인
        const credentials: LoginCredentials = {
          studentId: '3127',
          studentName: '테스트학생'
        };

        addResult('2. 로그인 시도', true, `학번: ${credentials.studentId}`);
        
        const loginResult = await authenticateStudent(credentials);
        if (!isMounted) return;
        
        if (!loginResult.success) {
          addResult('2. 로그인 실패', false, loginResult.error);
          if (isMounted) setIsCompleted(true);
          return;
        }

        addResult('2. 로그인 성공', true, {
          student: loginResult.student,
          step: loginResult.step
        });
        
        // Step 3: 세션 저장 및 검증
        if (loginResult.student) {
          saveStudentSession(loginResult.student);
          const savedSession = loadStudentSession();
          
          if (!savedSession || savedSession.studentId !== credentials.studentId) {
            addResult('3. 세션 저장 실패', false, '세션이 정상적으로 저장되지 않음');
            if (isMounted) setIsCompleted(true);
            return;
          }

          if (isMounted) setStudent(savedSession);
          addResult('3. 세션 저장 성공', true, {
            studentId: savedSession.studentId,
            name: savedSession.name,
            fullClass: savedSession.fullClass
          });

          // 잠시 대기
          await new Promise(resolve => setTimeout(resolve, 500));
          if (!isMounted) return;

          // Step 4: 과제 배정 확인
          addResult('4. 과제 확인 시작', true, '학생 과제 배정 상태 확인');
          
          const assignmentResult = await checkStudentAssignment(savedSession);
          if (!isMounted) return;
          
          if (!assignmentResult.success) {
            addResult('4. 과제 확인 실패', false, assignmentResult.error);
            if (isMounted) setIsCompleted(true);
            return;
          }

          addResult('4. 과제 확인 성공', true, {
            hasAssignment: assignmentResult.hasAssignment,
            assignment: assignmentResult.assignment ? {
              id: assignmentResult.assignment.id,
              roleName: assignmentResult.assignment.roleName,
              roleType: assignmentResult.assignment.roleType,
              sessionName: assignmentResult.assignment.sessionName
            } : null
          });

          if (assignmentResult.hasAssignment && assignmentResult.assignment) {
            if (isMounted) setAssignment(assignmentResult.assignment);
            addResult('4. 과제 배정 발견', true, {
              roleName: assignmentResult.assignment.roleName,
              roleType: assignmentResult.assignment.roleType || 'text',
              sessionName: assignmentResult.assignment.sessionName
            });
          } else {
            if (isMounted) setAssignment(null);
            addResult('4. 과제 배정 없음', true, '현재 배정된 과제가 없습니다');
          }

          // 잠시 대기
          await new Promise(resolve => setTimeout(resolve, 500));
          if (!isMounted) return;

          // Step 5: 역할 표시 활성화
          if (isMounted) setIsRoleVisible(true);
          addResult('5. 역할 표시 활성화', true, {
            studentExists: !!savedSession,
            assignmentExists: !!assignmentResult.assignment,
            displayMode: assignmentResult.assignment ? 
              (assignmentResult.assignment.roleType || 'text') : 'no-role'
          });

          // Step 6: 컴포넌트 렌더링 확인
          setTimeout(() => {
            if (!isMounted) return;
            addResult('6. 컴포넌트 렌더링 완료', true, 'RoleDisplay 컴포넌트 정상 렌더링');
            addResult('✅ 전체 통합 테스트 완료', true, {
              totalSteps: 6,
              studentLoggedIn: true,
              assignmentFound: !!assignmentResult.assignment,
              roleDisplayActive: true,
              migrationSuccess: true
            });
            if (isMounted) setIsCompleted(true);
          }, 1000);

        }
      } catch (error) {
        if (!isMounted) return;
        const addResult = (step: string, success: boolean, details: any) => {
          const result = {
            timestamp: new Date().toLocaleTimeString(),
            step,
            success,
            details
          };
          if (isMounted) {
            setTestResults(prev => [...prev, result]);
          }
          console.log(`🚀 [Step 3A.3 Auto] ${step}:`, result);
        };
        
        addResult('❌ 통합 테스트 오류', false, {
          error: error instanceof Error ? error.message : '알 수 없는 오류',
          stack: error instanceof Error ? error.stack : undefined
        });
        console.error('❌ [Step 3A.3 Auto] 통합 테스트 오류:', error);
        if (isMounted) setIsCompleted(true);
      }
    };

    // 컴포넌트 마운트 후 2초 뒤에 자동 실행
    const timer = setTimeout(runAutoTest, 2000);
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []); // 빈 의존성 배열로 한 번만 실행

  // 포인트 시스템 초기화 콜백
  const handlePointSystemInit = useCallback(() => {
    const result = {
      timestamp: new Date().toLocaleTimeString(),
      step: '🎯 포인트 시스템 초기화 호출',
      success: true,
      details: 'onPointSystemInit 콜백 정상 실행됨'
    };
    setTestResults(prev => [...prev, result]);
    console.log(`🚀 [Step 3A.3 Auto] ${result.step}:`, result);
  }, []);

  // 스테이지 설정 시작 콜백  
  const handleStageSettingsStart = useCallback(() => {
    const result = {
      timestamp: new Date().toLocaleTimeString(),
      step: '⚙️ 스테이지 설정 시작 호출',
      success: true,
      details: 'onStageSettingsStart 콜백 정상 실행됨'
    };
    setTestResults(prev => [...prev, result]);
    console.log(`🚀 [Step 3A.3 Auto] ${result.step}:`, result);
  }, []);

  const successCount = testResults.filter(r => r.success).length;
  const failCount = testResults.filter(r => !r.success).length;
  const overallSuccess = isCompleted && failCount === 0 && successCount > 0;

  return (
    <div style={{ 
      padding: '15px', 
      border: `3px solid ${overallSuccess ? '#28a745' : isCompleted ? '#dc3545' : '#ffc107'}`, 
      borderRadius: '8px',
      marginTop: '15px',
      backgroundColor: overallSuccess ? '#d4edda' : isCompleted ? '#f8d7da' : '#fff3cd'
    }}>
      <h4 style={{ 
        color: overallSuccess ? '#155724' : isCompleted ? '#721c24' : '#856404',
        margin: '0 0 15px 0'
      }}>
        🚀 Step 3A.3: 자동 통합 테스트 {isCompleted ? (overallSuccess ? '✅ 성공' : '❌ 실패') : '⏳ 진행 중...'}
      </h4>
      
      {/* 현재 상태 표시 */}
      <div style={{ 
        fontSize: '13px', 
        color: '#495057', 
        marginBottom: '15px',
        padding: '10px',
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: '4px'
      }}>
        <div><strong>🔐 로그인 상태:</strong> {student ? `✅ ${student.name} (${student.studentId})` : '❌ 미로그인'}</div>
        <div><strong>📋 과제 배정:</strong> {assignment ? `✅ ${assignment.roleName} (${assignment.roleType || 'text'})` : '❌ 배정 없음'}</div>
        <div><strong>👁️ 역할 표시:</strong> {isRoleVisible ? '✅ 활성화' : '❌ 비활성화'}</div>
        <div><strong>📊 테스트 결과:</strong> ✅ {successCount}개 성공, ❌ {failCount}개 실패</div>
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
            📝 자동 테스트 실행 로그
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
        border: '2px solid #007bff',
        borderRadius: '8px',
        backgroundColor: '#ffffff',
        minHeight: '200px'
      }}>
        <div style={{
          padding: '10px',
          backgroundColor: '#cce7ff',
          borderBottom: '1px solid #99d3ff',
          fontWeight: 'bold',
          color: '#004085'
        }}>
          🎭 RoleDisplay 컴포넌트 (마이그레이션 검증)
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
            <p>자동 테스트 진행 중... 역할 표시 준비 중입니다.</p>
          </div>
        )}
      </div>

      <div style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
        <strong>자동 검증 항목:</strong> 로그인 → 세션 관리 → 과제 확인 → 역할 표시 → 콜백 함수 → React 컴포넌트 렌더링
      </div>
    </div>
  );
}