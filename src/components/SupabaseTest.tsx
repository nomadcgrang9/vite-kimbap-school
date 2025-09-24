/**
 * Supabase Service Test Component
 * Step 2A.1 검증용 컴포넌트
 */

import { useEffect, useState } from 'react';
import { getSupabaseClient, checkSupabaseConnection, safeSupabaseCall } from '../services/supabaseService';

interface TestResult {
  clientAvailable: boolean;
  connectionWorking: boolean;
  apiCallWorking: boolean;
  error?: string;
}

export default function SupabaseTest() {
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    runSupabaseTests();
  }, []);

  const runSupabaseTests = async () => {
    setIsLoading(true);
    console.log('🧪 [Step 2A.1] Supabase Service 테스트 시작...');

    try {
      // Test 1: 클라이언트 사용 가능 여부
      const client = getSupabaseClient();
      const clientAvailable = client !== null;
      console.log('📋 Test 1 - Client Available:', clientAvailable);

      // Test 2: 연결 상태 확인
      const connectionWorking = await checkSupabaseConnection();
      console.log('📋 Test 2 - Connection Working:', connectionWorking);

      // Test 3: 안전한 API 호출 테스트
      const apiResult = await safeSupabaseCall(async (client) => {
        const { data, error } = await client.from('students').select('count').limit(1);
        if (error) throw error;
        return data;
      });
      const apiCallWorking = apiResult !== null;
      console.log('📋 Test 3 - API Call Working:', apiCallWorking, apiResult);

      setTestResult({
        clientAvailable,
        connectionWorking,
        apiCallWorking
      });

      const allPassed = clientAvailable && connectionWorking && apiCallWorking;
      console.log(allPassed ? 
        '✅ [Step 2A.1] 모든 테스트 통과!' : 
        '⚠️ [Step 2A.1] 일부 테스트 실패'
      );

    } catch (error) {
      console.error('❌ [Step 2A.1] 테스트 실행 오류:', error);
      setTestResult({
        clientAvailable: false,
        connectionWorking: false,
        apiCallWorking: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatus = () => {
    if (isLoading) return { text: '테스트 중...', color: 'orange' };
    if (!testResult) return { text: '테스트 실패', color: 'red' };
    
    const allPassed = testResult.clientAvailable && 
                      testResult.connectionWorking && 
                      testResult.apiCallWorking;
    
    return allPassed ? 
      { text: '✅ 모든 테스트 통과', color: 'green' } :
      { text: '⚠️ 일부 테스트 실패', color: 'red' };
  };

  const status = getStatus();

  return (
    <div style={{ 
      padding: '15px', 
      border: `2px solid ${status.color}`, 
      borderRadius: '8px',
      marginTop: '15px'
    }}>
      <h4>Step 2A.1: getSupabaseClient 마이그레이션 테스트</h4>
      <p style={{ color: status.color, fontWeight: 'bold' }}>
        상태: {status.text}
      </p>
      
      {testResult && !isLoading && (
        <div style={{ fontSize: '14px', marginTop: '10px' }}>
          <div>✓ 클라이언트 사용 가능: {testResult.clientAvailable ? '✅' : '❌'}</div>
          <div>✓ 연결 상태 정상: {testResult.connectionWorking ? '✅' : '❌'}</div>
          <div>✓ API 호출 작동: {testResult.apiCallWorking ? '✅' : '❌'}</div>
          {testResult.error && (
            <div style={{ color: 'red', marginTop: '5px' }}>
              오류: {testResult.error}
            </div>
          )}
        </div>
      )}
      
      <button 
        onClick={runSupabaseTests}
        style={{
          marginTop: '10px',
          padding: '8px 16px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
        disabled={isLoading}
      >
        {isLoading ? '테스트 중...' : '다시 테스트'}
      </button>
    </div>
  );
}