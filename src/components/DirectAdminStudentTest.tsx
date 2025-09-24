/**
 * Direct Admin Student Test - 직접 테스트 컴포넌트
 */

import { useEffect, useState } from 'react';
import { loadAdminStudents, getStudentStats, type AdminStudentLoadResult, type StudentStats } from '../services/adminStudentService';

export default function DirectAdminStudentTest() {
  const [result, setResult] = useState<AdminStudentLoadResult | null>(null);
  const [stats, setStats] = useState<StudentStats | null>(null);

  useEffect(() => {
    console.log('🧪 Direct Admin Student Test 실행');
    
    const testDirectly = async () => {
      try {
        const testResult = await loadAdminStudents();
        console.log('🧪 [Direct Student Test] 결과:', testResult);
        setResult(testResult);
        
        if (testResult.success && testResult.data.length > 0) {
          const studentStats = getStudentStats(testResult.data);
          console.log('🧪 [Direct Student Test] 통계:', studentStats);
          setStats(studentStats);
        }
      } catch (error) {
        console.error('🧪 [Direct Student Test] 오류:', error);
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
      border: '2px solid #ffc107',
      borderRadius: '8px',
      marginTop: '15px',
      backgroundColor: '#fff3cd'
    }}>
      <h4 style={{ color: '#856404' }}>👥 Direct Admin Student Test</h4>
      
      {result ? (
        <div style={{ marginTop: '10px' }}>
          <div><strong>성공:</strong> {result.success ? '✅' : '❌'}</div>
          <div><strong>학생 수:</strong> {result.count}명</div>
          <div><strong>소스:</strong> {result.source}</div>
          {result.error && <div><strong>에러:</strong> {result.error}</div>}
          
          {stats && (
            <div style={{ marginTop: '10px' }}>
              <strong>📊 통계:</strong>
              <div style={{ fontSize: '13px', marginTop: '5px' }}>
                <div>활성 학생: {stats.activeStudents}명 / 전체: {stats.totalStudents}명</div>
                <div>학년별: {Object.entries(stats.byGrade).map(([grade, count]) => 
                  `${grade}학년 ${count}명`).join(', ')}</div>
              </div>
            </div>
          )}
          
          {result.data.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <strong>첫 3명 학생:</strong>
              <div style={{ fontSize: '12px', marginTop: '5px' }}>
                {result.data.slice(0, 3).map(student => (
                  <div key={student.id}>
                    {student.name} ({student.student_id}) - {student.grade}학년 {student.class_num}반
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