/**
 * Student Auth Service Test Component
 * Step 2B.2 검증용 컴포넌트
 */

import { useState } from 'react';
import { 
  authenticateStudent, 
  validateLoginCredentials,
  saveStudentSession,
  loadStudentSession,
  logoutStudent
} from '../services/studentAuthService';
import type { LoginCredentials, LoginResult, StudentInfo } from '../services/studentAuthService';

export default function StudentAuthTest() {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    studentId: '',
    studentName: ''
  });
  const [loginResult, setLoginResult] = useState<LoginResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [savedStudent, setSavedStudent] = useState<StudentInfo | null>(null);

  // 로그인 테스트 실행
  const runLoginTest = async () => {
    setIsLoading(true);
    console.log('🧪 [Step 2B.2] Student Auth 테스트 시작...');

    try {
      const result = await authenticateStudent(credentials);
      
      console.log('📋 Login Test Result:', result);
      setLoginResult(result);
      
      // 성공 시 세션 저장 테스트
      if (result.success && result.student) {
        const sessionSaved = saveStudentSession(result.student);
        console.log('💾 Session Save Test:', sessionSaved);
        
        // 저장된 세션 다시 로드해서 확인
        const loadedSession = loadStudentSession();
        setSavedStudent(loadedSession);
        console.log('📖 Session Load Test:', loadedSession);
      }
      
    } catch (error) {
      console.error('❌ [Step 2B.2] 테스트 실행 오류:', error);
      setLoginResult({
        success: false,
        error: error instanceof Error ? error.message : '테스트 실행 오류',
        step: '테스트 오류'
      });
      
    } finally {
      setIsLoading(false);
    }
  };

  // 입력값 검증만 테스트
  const testValidationOnly = () => {
    const validation = validateLoginCredentials(credentials);
    console.log('🔍 Validation Test:', validation);
    
    setLoginResult({
      success: validation.valid,
      error: validation.error || '검증 통과',
      step: '입력값 검증만'
    });
  };

  // 저장된 세션 확인
  const checkSavedSession = () => {
    const session = loadStudentSession();
    setSavedStudent(session);
    console.log('📖 Current Session:', session);
  };

  // 로그아웃 테스트
  const testLogout = () => {
    logoutStudent();
    setSavedStudent(null);
    setLoginResult(null);
    console.log('👋 Logout completed');
  };

  const getStatusColor = () => {
    if (isLoading) return 'orange';
    if (!loginResult) return 'gray';
    return loginResult.success ? 'green' : 'red';
  };

  const getStatusText = () => {
    if (isLoading) return `🔄 로그인 처리 중...`;
    if (!loginResult) return '⏳ 테스트 대기 중';
    return loginResult.success ? 
      `✅ 로그인 성공 (${loginResult.step})` : 
      `❌ 실패: ${loginResult.error} (${loginResult.step})`;
  };

  const statusColor = getStatusColor();

  return (
    <div style={{ 
      padding: '15px', 
      border: `2px solid ${statusColor}`, 
      borderRadius: '8px',
      marginTop: '15px'
    }}>
      <h4>Step 2B.2: Student Auth Service 테스트</h4>
      <p style={{ color: statusColor, fontWeight: 'bold' }}>
        상태: {getStatusText()}
      </p>
      
      {/* 로그인 입력 폼 */}
      <div style={{ marginTop: '15px', marginBottom: '15px' }}>
        <div style={{ marginBottom: '8px' }}>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>
            학번 (4자리):
          </label>
          <input
            type="text"
            value={credentials.studentId}
            onChange={(e) => setCredentials(prev => ({ ...prev, studentId: e.target.value }))}
            placeholder="예: 1301"
            style={{
              padding: '6px 10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              width: '120px'
            }}
            maxLength={4}
          />
        </div>
        
        <div style={{ marginBottom: '8px' }}>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>
            이름:
          </label>
          <input
            type="text"
            value={credentials.studentName}
            onChange={(e) => setCredentials(prev => ({ ...prev, studentName: e.target.value }))}
            placeholder="예: 홍길동"
            style={{
              padding: '6px 10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              width: '120px'
            }}
          />
        </div>
      </div>
      
      {/* 테스트 버튼들 */}
      <div style={{ marginBottom: '15px' }}>
        <button 
          onClick={testValidationOnly}
          style={{
            padding: '6px 12px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '8px',
            fontSize: '13px'
          }}
          disabled={isLoading}
        >
          검증만 테스트
        </button>
        
        <button 
          onClick={runLoginTest}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '8px'
          }}
          disabled={isLoading || !credentials.studentId || !credentials.studentName}
        >
          {isLoading ? '로그인 중...' : '전체 로그인 테스트'}
        </button>
        
        <button 
          onClick={checkSavedSession}
          style={{
            padding: '6px 12px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '8px',
            fontSize: '13px'
          }}
        >
          세션 확인
        </button>
        
        <button 
          onClick={testLogout}
          style={{
            padding: '6px 12px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          로그아웃
        </button>
      </div>
      
      {/* 로그인 결과 표시 */}
      {loginResult && (
        <div style={{ fontSize: '14px', marginTop: '10px' }}>
          <div><strong>처리 단계:</strong> {loginResult.step}</div>
          <div><strong>성공 여부:</strong> {loginResult.success ? '✅ 성공' : '❌ 실패'}</div>
          
          {loginResult.error && (
            <div style={{ color: 'red', marginTop: '5px' }}>
              <strong>오류:</strong> {loginResult.error}
            </div>
          )}
          
          {loginResult.success && loginResult.student && (
            <div style={{ marginTop: '8px' }}>
              <div><strong>로그인된 학생:</strong></div>
              <div style={{ marginLeft: '15px', fontSize: '13px' }}>
                <div>• 학번: {loginResult.student.studentId}</div>
                <div>• 이름: {loginResult.student.name}</div>
                <div>• 학년: {loginResult.student.grade}학년</div>
                <div>• 반: {loginResult.student.fullClass}</div>
                <div>• 번호: {loginResult.student.number}번</div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* 저장된 세션 정보 */}
      {savedStudent && (
        <div style={{ 
          marginTop: '15px', 
          padding: '10px', 
          backgroundColor: '#e7f3ff', 
          borderRadius: '4px',
          border: '1px solid #007bff'
        }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#007bff' }}>
            💾 저장된 세션 정보:
          </div>
          <div style={{ fontSize: '13px', marginTop: '5px' }}>
            {savedStudent.name} ({savedStudent.studentId}) - {savedStudent.fullClass} {savedStudent.number}번
          </div>
        </div>
      )}
      
      <div style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
        원본 studentLogin() 함수 → TypeScript StudentAuthService 마이그레이션 검증
      </div>
    </div>
  );
}