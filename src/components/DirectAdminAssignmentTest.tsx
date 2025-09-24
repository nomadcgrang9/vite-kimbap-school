/**
 * Direct Admin Assignment Test - 직접 테스트 컴포넌트
 */

import { useEffect, useState } from 'react';
import { 
  loadAdminAssignments, 
  filterActiveAssignments,
  findRecentAssignments,
  type AdminAssignmentLoadResult, 
 
} from '../services/adminAssignmentService';

export default function DirectAdminAssignmentTest() {
  const [result, setResult] = useState<AdminAssignmentLoadResult | null>(null);

  useEffect(() => {
    console.log('🧪 Direct Admin Assignment Test 실행');
    
    const testDirectly = async () => {
      try {
        const testResult = await loadAdminAssignments();
        console.log('🧪 [Direct Assignment Test] 결과:', testResult);
        setResult(testResult);
        
        if (testResult.success && testResult.data.length > 0) {
          // 추가 분석
          const activeAssignments = filterActiveAssignments(testResult.data);
          const recentAssignments = findRecentAssignments(testResult.data, 30);
          
          console.log('🧪 [Direct Assignment Test] 활성 배정:', activeAssignments.length);
          console.log('🧪 [Direct Assignment Test] 최근 30일:', recentAssignments.length);
        }
      } catch (error) {
        console.error('🧪 [Direct Assignment Test] 오류:', error);
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
      border: '2px solid #6610f2',
      borderRadius: '8px',
      marginTop: '15px',
      backgroundColor: '#f8f5ff'
    }}>
      <h4 style={{ color: '#6610f2' }}>🎯 Direct Admin Assignment Test</h4>
      
      {result ? (
        <div style={{ marginTop: '10px' }}>
          <div><strong>성공:</strong> {result.success ? '✅' : '❌'}</div>
          <div><strong>배정 수:</strong> {result.count}개</div>
          <div><strong>소스:</strong> {result.source}</div>
          {result.error && <div><strong>에러:</strong> {result.error}</div>}
          
          {result.stats && (
            <div style={{ marginTop: '10px' }}>
              <strong>📊 통계:</strong>
              <div style={{ fontSize: '13px', marginTop: '5px' }}>
                <div>활성 배정: {result.stats.activeAssignments}개 / 전체: {result.stats.totalAssignments}개</div>
                <div>세션별: {Object.keys(result.stats.bySession).length}개 세션</div>
                <div>역할 타입: {Object.entries(result.stats.byRoleType).map(([type, count]) => 
                  `${type}: ${count}개`).join(', ')}</div>
              </div>
            </div>
          )}
          
          {result.data.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <strong>최근 배정 3개:</strong>
              <div style={{ fontSize: '12px', marginTop: '5px' }}>
                {result.data.slice(0, 3).map(assignment => (
                  <div key={assignment.id}>
                    {assignment.student_name || assignment.student_id} → {assignment.role_name || '역할'}
                    {assignment.session_name && ` (${assignment.session_name})`}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>로딩 중...</div>
      )}
    </div>
  );
}