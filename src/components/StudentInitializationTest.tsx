/**
 * Student Initialization Test Component
 * Step 2A.2d 검증용 컴포넌트
 */

import { useStudentInitialization } from '../hooks/useStudentInitialization';

export default function StudentInitializationTest() {
  const { state, reinitialize, loadAssignmentsOnly } = useStudentInitialization();

  const getStatusColor = () => {
    if (state.isInitializing) return 'orange';
    if (state.error) return 'red';
    if (state.isInitialized) return 'green';
    return 'gray';
  };

  const getStatusText = () => {
    if (state.isInitializing) return `🔄 초기화 중: ${state.initializationStep}`;
    if (state.error) return `❌ 오류: ${state.error}`;
    if (state.isInitialized) return '✅ 초기화 완료';
    return '⏳ 대기 중';
  };

  const statusColor = getStatusColor();

  return (
    <div style={{ 
      padding: '15px', 
      border: `2px solid ${statusColor}`, 
      borderRadius: '8px',
      marginTop: '15px'
    }}>
      <h4>Step 2A.2d: Student Initialization Hook 테스트</h4>
      <p style={{ color: statusColor, fontWeight: 'bold' }}>
        상태: {getStatusText()}
      </p>
      
      <div style={{ fontSize: '14px', marginTop: '10px' }}>
        <div><strong>초기화 상태:</strong> {state.isInitialized ? '✅ 완료' : state.isInitializing ? '🔄 진행 중' : '❌ 미완료'}</div>
        <div><strong>현재 단계:</strong> {state.initializationStep}</div>
        <div><strong>로드된 과제:</strong> {state.assignments.length}개</div>
        
        {state.assignmentLoadResult && (
          <div style={{ marginTop: '8px' }}>
            <div><strong>과제 로드 결과:</strong></div>
            <div style={{ marginLeft: '15px', fontSize: '13px' }}>
              <div>• 성공: {state.assignmentLoadResult.success ? '✅' : '❌'}</div>
              <div>• 데이터 소스: {state.assignmentLoadResult.source}</div>
              <div>• 과제 수: {state.assignmentLoadResult.data.length}개</div>
              {state.assignmentLoadResult.error && (
                <div style={{ color: 'orange' }}>• 경고: {state.assignmentLoadResult.error}</div>
              )}
            </div>
          </div>
        )}
        
        {state.error && (
          <div style={{ color: 'red', marginTop: '8px' }}>
            <strong>오류 상세:</strong> {state.error}
          </div>
        )}
      </div>
      
      <div style={{ marginTop: '15px' }}>
        <button 
          onClick={reinitialize}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
          disabled={state.isInitializing}
        >
          {state.isInitializing ? '초기화 중...' : '전체 재초기화'}
        </button>
        
        <button 
          onClick={loadAssignmentsOnly}
          style={{
            padding: '8px 16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
          disabled={state.isInitializing}
        >
          Assignments만 다시 로드
        </button>
        
        <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
          원본 initializeStudent() 함수 → React Hook 마이그레이션 검증
        </small>
      </div>

      {state.assignments.length > 0 && (
        <details style={{ marginTop: '10px' }}>
          <summary style={{ cursor: 'pointer', color: '#007bff', fontSize: '14px' }}>
            로드된 과제 목록 보기 ({state.assignments.length}개)
          </summary>
          <div style={{ 
            maxHeight: '150px', 
            overflow: 'auto', 
            backgroundColor: '#f8f9fa', 
            padding: '8px',
            borderRadius: '4px',
            marginTop: '5px'
          }}>
            {state.assignments.map((assignment, index) => (
              <div key={assignment.id || index} style={{ 
                fontSize: '12px', 
                padding: '4px',
                borderBottom: '1px solid #dee2e6'
              }}>
                <strong>#{index + 1}</strong> ID: {assignment.id || 'N/A'} | 
                Class: {assignment.class || 'N/A'} | 
                Role: {assignment.role || 'N/A'}
              </div>
            ))}
          </div>
        </details>
      )}

      <details style={{ marginTop: '10px' }}>
        <summary style={{ cursor: 'pointer', fontSize: '14px' }}>
          Hook 상태 디버그 정보
        </summary>
        <pre style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '8px', 
          borderRadius: '4px',
          fontSize: '11px',
          overflow: 'auto',
          marginTop: '5px'
        }}>
          {JSON.stringify({
            isInitializing: state.isInitializing,
            isInitialized: state.isInitialized,
            initializationStep: state.initializationStep,
            assignmentsCount: state.assignments.length,
            hasError: !!state.error
          }, null, 2)}
        </pre>
      </details>
    </div>
  );
}