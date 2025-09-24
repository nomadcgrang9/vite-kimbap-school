/**
 * Admin Student Service Test Component
 * Step 3B.1b 검증용 컴포넌트
 */

import { useState } from 'react';
import { 
  loadAdminStudents,
  cacheAdminStudents,
  filterActiveStudents,
  filterStudentsByGrade,
  filterStudentsByClass,
  findStudentsByName,
  getStudentStats,
  sortStudentsByClass,
  sortStudentsByName,

  type AdminStudentLoadResult,
  type StudentStats
} from '../services/adminStudentService';

export default function AdminStudentTest() {
  const [testResult, setTestResult] = useState<AdminStudentLoadResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<number>(0);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [searchName, setSearchName] = useState<string>('');
  const [sortBy, setSortBy] = useState<'class' | 'name'>('class');
  const [stats, setStats] = useState<StudentStats | null>(null);

  // 학생 로드 테스트
  const testLoadStudents = async () => {
    setIsLoading(true);
    console.log('🧪 [Step 3B.1b] Admin Student 로드 테스트 시작...');
    
    try {
      const result = await loadAdminStudents();
      setTestResult(result);
      
      console.log('👥 [Step 3B.1b] 로드 결과:', result);
      
      // 성공적으로 로드된 경우 통계 생성 및 캐시 저장
      if (result.success && result.data.length > 0) {
        const studentStats = getStudentStats(result.data);
        setStats(studentStats);
        cacheAdminStudents(result.data);
        
        console.log('📊 [Step 3B.1b] 학생 통계:', studentStats);
      }
      
    } catch (error) {
      console.error('❌ [Step 3B.1b] 테스트 오류:', error);
      setTestResult({
        success: false,
        data: [],
        count: 0,
        error: error instanceof Error ? error.message : '테스트 실행 오류',
        source: 'supabase'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 필터링된 학생 목록 가져오기
  const getFilteredStudents = () => {
    if (!testResult?.data) return [];
    
    let filtered = testResult.data;
    
    // 이름으로 검색
    if (searchName.trim()) {
      filtered = findStudentsByName(filtered, searchName.trim());
    }
    
    // 학년으로 필터링
    if (selectedGrade > 0) {
      filtered = filterStudentsByGrade(filtered, selectedGrade);
    }
    
    // 반으로 필터링
    if (selectedClass) {
      const [grade, classNum] = selectedClass.split('-').map(Number);
      if (grade && classNum) {
        filtered = filterStudentsByClass(filtered, grade, classNum);
      }
    }
    
    // 활성 학생만
    filtered = filterActiveStudents(filtered);
    
    // 정렬
    if (sortBy === 'name') {
      return sortStudentsByName(filtered);
    } else {
      return sortStudentsByClass(filtered);
    }
  };

  // 반 목록 생성
  const getClassOptions = () => {
    if (!testResult?.byClass) return [];
    return Object.keys(testResult.byClass).sort();
  };

  return (
    <div style={{ 
      padding: '15px', 
      border: '2px solid #28a745', 
      borderRadius: '8px',
      marginTop: '15px'
    }}>
      <h4>Step 3B.1b: Admin Student Service 테스트</h4>
      
      {/* 테스트 컨트롤 */}
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testLoadStudents}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
          disabled={isLoading}
        >
          {isLoading ? '로딩 중...' : '관리자 학생 로드 테스트'}
        </button>
        
        <span style={{ fontSize: '12px', color: '#6c757d' }}>
          (admin-rolesv2.js loadStudents 함수 마이그레이션 검증)
        </span>
      </div>

      {/* 통계 표시 */}
      {stats && (
        <div style={{
          backgroundColor: '#d4edda',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #c3e6cb'
        }}>
          <h5 style={{ margin: '0 0 10px 0', color: '#155724' }}>📊 학생 통계</h5>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
            <div>
              <strong>전체 학생:</strong> {stats.totalStudents}명
            </div>
            <div>
              <strong>활성 학생:</strong> {stats.activeStudents}명
            </div>
          </div>
          
          <div style={{ marginTop: '10px' }}>
            <strong>학년별 분포:</strong>
            <div style={{ fontSize: '13px', marginTop: '5px' }}>
              {Object.entries(stats.byGrade).map(([grade, count]) => (
                <span key={grade} style={{ marginRight: '15px' }}>
                  {grade}학년: {count}명
                </span>
              ))}
            </div>
          </div>
          
          <div style={{ marginTop: '10px' }}>
            <strong>반별 분포:</strong>
            <div style={{ fontSize: '12px', marginTop: '5px', maxHeight: '80px', overflowY: 'auto' }}>
              {Object.entries(stats.byClass).map(([classKey, count]) => (
                <span key={classKey} style={{ marginRight: '10px', display: 'inline-block', marginBottom: '2px' }}>
                  {classKey}반: {count}명
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 필터링 및 정렬 컨트롤 */}
      {testResult && testResult.success && (
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h5 style={{ margin: '0 0 15px 0' }}>학생 필터링 및 정렬</h5>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '10px',
            marginBottom: '10px'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px' }}>이름 검색:</label>
              <input 
                type="text" 
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="학생 이름"
                style={{
                  width: '100%',
                  padding: '5px 8px',
                  border: '1px solid #ccc',
                  borderRadius: '3px'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px' }}>학년 선택:</label>
              <select 
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '5px 8px',
                  border: '1px solid #ccc',
                  borderRadius: '3px'
                }}
              >
                <option value={0}>전체 학년</option>
                {[1,2,3,4,5,6].map(grade => (
                  <option key={grade} value={grade}>{grade}학년</option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px' }}>반 선택:</label>
              <select 
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                style={{
                  width: '100%',
                  padding: '5px 8px',
                  border: '1px solid #ccc',
                  borderRadius: '3px'
                }}
              >
                <option value="">전체 반</option>
                {getClassOptions().map(classKey => (
                  <option key={classKey} value={classKey}>{classKey}반</option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px' }}>정렬 기준:</label>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'class' | 'name')}
                style={{
                  width: '100%',
                  padding: '5px 8px',
                  border: '1px solid #ccc',
                  borderRadius: '3px'
                }}
              >
                <option value="class">학급순</option>
                <option value="name">이름순</option>
              </select>
            </div>
          </div>
          
          <div style={{ fontSize: '13px', color: '#495057' }}>
            <span><strong>필터 결과:</strong> {getFilteredStudents().length}명</span>
            <button
              onClick={() => {
                setSearchName('');
                setSelectedGrade(0);
                setSelectedClass('');
                setSortBy('class');
              }}
              style={{
                marginLeft: '15px',
                padding: '5px 10px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              필터 초기화
            </button>
          </div>
        </div>
      )}

      {/* 테스트 결과 표시 */}
      {testResult && (
        <div style={{
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          backgroundColor: testResult.success ? '#d4edda' : '#f8d7da'
        }}>
          <div style={{
            padding: '10px',
            backgroundColor: testResult.success ? '#c3e6cb' : '#f5c6cb',
            borderBottom: '1px solid #dee2e6',
            fontWeight: 'bold',
            color: testResult.success ? '#155724' : '#721c24'
          }}>
            {testResult.success ? '✅ 로드 성공' : '❌ 로드 실패'} 
            ({testResult.source} 소스)
          </div>
          
          <div style={{ padding: '15px' }}>
            <div style={{ marginBottom: '10px' }}>
              <strong>학생 수:</strong> {testResult.count}명
            </div>
            
            {testResult.error && (
              <div style={{ 
                color: '#721c24', 
                backgroundColor: '#f8d7da',
                padding: '10px',
                borderRadius: '4px',
                marginBottom: '10px'
              }}>
                <strong>오류:</strong> {testResult.error}
              </div>
            )}

            {/* 학생 목록 */}
            {testResult.success && testResult.data.length > 0 && (
              <div>
                <h6>👥 로드된 학생 목록 ({getFilteredStudents().length}명):</h6>
                <div style={{
                  maxHeight: '400px',
                  overflowY: 'auto',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px'
                }}>
                  {getFilteredStudents().map((student) => (
                    <div 
                      key={student.id}
                      style={{
                        padding: '8px 12px',
                        borderBottom: '1px solid #f0f0f0',
                        backgroundColor: student.is_active ? 'white' : '#f8f9fa'
                      }}
                    >
                      <div style={{ 
                        fontWeight: 'bold', 
                        color: student.is_active ? '#28a745' : '#6c757d' 
                      }}>
                        {student.is_active ? '🟢' : '⚫'} {student.name} ({student.student_id})
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#6c757d', 
                        marginTop: '2px' 
                      }}>
                        📚 {student.grade}학년 {student.class_num}반 {student.number}번
                        {student.email && ` | 📧 ${student.email}`}
                        {student.phone && ` | 📞 ${student.phone}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
        원본 admin-rolesv2.js loadStudents() 함수 → TypeScript adminStudentService 마이그레이션 검증
      </div>
    </div>
  );
}