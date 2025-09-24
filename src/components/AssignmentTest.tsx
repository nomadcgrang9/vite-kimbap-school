/**
 * Assignment Service Test Component
 * Step 2A.2b 검증용 컴포넌트
 */

import { useEffect, useState } from 'react';
import { loadAssignments } from '../services/assignmentService';
import type { AssignmentServiceResult } from '../services/assignmentService';

export default function AssignmentTest() {
  const [testResult, setTestResult] = useState<AssignmentServiceResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testHistory, setTestHistory] = useState<AssignmentServiceResult[]>([]);

  useEffect(() => {
    runAssignmentTest();
  }, []);

  const runAssignmentTest = async () => {
    setIsLoading(true);
    console.log('🧪 [Step 2A.2b] Assignment Service 테스트 시작...');

    try {
      const result = await loadAssignments();
      
      console.log('📋 Assignment Test Result:', result);
      setTestResult(result);
      
      // 테스트 히스토리에 추가 (최대 3개)
      setTestHistory(prev => [result, ...prev.slice(0, 2)]);
      
      if (result.success) {
        console.log('✅ [Step 2A.2b] Assignment 로드 성공!', result.source, 'source');
      } else {
        console.warn('⚠️ [Step 2A.2b] Assignment 로드 실패:', result.error);
      }

    } catch (error) {
      console.error('❌ [Step 2A.2b] 테스트 실행 오류:', error);
      const errorResult: AssignmentServiceResult = {
        success: false,
        data: [],
        source: 'fallback',
        error: error instanceof Error ? error.message : '테스트 실행 오류'
      };
      setTestResult(errorResult);
      setTestHistory(prev => [errorResult, ...prev.slice(0, 2)]);
      
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (result: AssignmentServiceResult | null) => {
    if (!result) return 'gray';
    if (result.success) {
      return result.source === 'supabase' ? 'green' : 'orange';
    }
    return 'red';
  };

  const getStatusText = (result: AssignmentServiceResult | null) => {
    if (isLoading) return '테스트 중...';
    if (!result) return '테스트 대기 중';
    
    if (result.success) {
      return `✅ 성공 (${result.source}): ${result.data.length}개 과제`;
    } else {
      return `❌ 실패: ${result.error}`;
    }
  };

  const status = getStatusColor(testResult);

  return (
    <div style={{ 
      padding: '15px', 
      border: `2px solid ${status}`, 
      borderRadius: '8px',
      marginTop: '15px'
    }}>
      <h4>Step 2A.2b: Assignment Service 테스트</h4>
      <p style={{ color: status, fontWeight: 'bold' }}>
        상태: {getStatusText(testResult)}
      </p>
      
      {testResult && !isLoading && (
        <div style={{ fontSize: '14px', marginTop: '10px' }}>
          <div><strong>데이터 소스:</strong> {testResult.source}</div>
          <div><strong>성공 여부:</strong> {testResult.success ? '✅ 성공' : '❌ 실패'}</div>
          <div><strong>로드된 과제 수:</strong> {testResult.data.length}</div>
          
          {testResult.error && (
            <div style={{ color: 'red', marginTop: '5px' }}>
              <strong>오류:</strong> {testResult.error}
            </div>
          )}
          
          {testResult.success && testResult.data.length > 0 && (
            <details style={{ marginTop: '10px' }}>
              <summary style={{ cursor: 'pointer', color: '#007bff' }}>
                첫 번째 과제 데이터 보기
              </summary>
              <pre style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '8px', 
                borderRadius: '4px',
                fontSize: '12px',
                overflow: 'auto',
                marginTop: '5px'
              }}>
                {JSON.stringify(testResult.data[0], null, 2)}
              </pre>
            </details>
          )}
          
          {testResult.success && testResult.data.length === 0 && (
            <div style={{ color: 'orange', marginTop: '5px' }}>
              ℹ️ 데이터는 성공적으로 로드되었지만 과제가 없습니다.
            </div>
          )}
        </div>
      )}
      
      <div style={{ marginTop: '15px' }}>
        <button 
          onClick={runAssignmentTest}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
          disabled={isLoading}
        >
          {isLoading ? '테스트 중...' : '다시 테스트'}
        </button>
        
        <small style={{ color: '#666' }}>
          원본 loadAssignments() 함수 → TypeScript AssignmentService 마이그레이션 검증
        </small>
      </div>

      {testHistory.length > 1 && (
        <details style={{ marginTop: '10px' }}>
          <summary style={{ cursor: 'pointer', fontSize: '14px' }}>
            테스트 히스토리 ({testHistory.length}개)
          </summary>
          <div style={{ fontSize: '12px', marginTop: '5px' }}>
            {testHistory.map((test, index) => (
              <div key={index} style={{ 
                padding: '4px 8px', 
                backgroundColor: index === 0 ? '#e7f3ff' : '#f8f9fa',
                margin: '2px 0',
                borderRadius: '3px'
              }}>
                #{index + 1}: {test.success ? '✅' : '❌'} {test.source} - {test.data.length}개
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}