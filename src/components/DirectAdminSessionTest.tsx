/**
 * Direct Admin Session Test - 직접 테스트 컴포넌트
 */

import { useEffect, useState } from 'react';
import { loadAdminSessions, type AdminSessionLoadResult } from '../services/adminSessionService';

export default function DirectAdminSessionTest() {
  const [result, setResult] = useState<AdminSessionLoadResult | null>(null);

  useEffect(() => {
    console.log('🧪 Direct Admin Session Test 실행');
    
    const testDirectly = async () => {
      try {
        const testResult = await loadAdminSessions();
        console.log('🧪 [Direct Test] 결과:', testResult);
        setResult(testResult);
      } catch (error) {
        console.error('🧪 [Direct Test] 오류:', error);
        setResult({
          success: false,
          data: [],
          count: 0,
          error: String(error),
          source: 'supabase'
        });
      }
    };

    testDirectly();
  }, []);

  return (
    <div style={{
      padding: '15px',
      border: '2px solid #dc3545',
      borderRadius: '8px',
      marginTop: '15px',
      backgroundColor: '#f8d7da'
    }}>
      <h4 style={{ color: '#721c24' }}>🔬 Direct Admin Session Test</h4>
      
      {result ? (
        <div style={{ marginTop: '10px' }}>
          <div><strong>성공:</strong> {result.success ? '✅' : '❌'}</div>
          <div><strong>개수:</strong> {result.count}</div>
          <div><strong>소스:</strong> {result.source}</div>
          {result.error && <div><strong>에러:</strong> {result.error}</div>}
          
          {result.data.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <strong>세션 목록:</strong>
              <pre style={{
                backgroundColor: '#f1f1f1',
                padding: '8px',
                borderRadius: '4px',
                fontSize: '12px',
                overflow: 'auto'
              }}>
                {JSON.stringify(result.data.slice(0, 3), null, 2)}
              </pre>
            </div>
          )}
        </div>
      ) : (
        <div>로딩 중...</div>
      )}
    </div>
  );
}