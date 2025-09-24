/**
 * Admin Session Service Test Component
 * Step 3B.1a 검증용 컴포넌트
 */

import { useState } from 'react';
import { 
  loadAdminSessions, 
  cacheAdminSessions,
  filterActiveSessions,
  filterSessionsByClass,
  type AdminSession,
  type AdminSessionLoadResult
} from '../services/adminSessionService';

export default function AdminSessionTest() {
  const [testResult, setTestResult] = useState<AdminSessionLoadResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState<AdminSession | null>(null);
  const [filterClass, setFilterClass] = useState<string>('');

  // 세션 로드 테스트
  const testLoadSessions = async () => {
    setIsLoading(true);
    console.log('🧪 [Step 3B.1a] Admin Session 로드 테스트 시작...');
    
    try {
      const result = await loadAdminSessions();
      setTestResult(result);
      
      console.log('📋 [Step 3B.1a] 로드 결과:', result);
      
      // 성공적으로 로드된 경우 캐시 저장
      if (result.success && result.data.length > 0) {
        cacheAdminSessions(result.data);
      }
      
    } catch (error) {
      console.error('❌ [Step 3B.1a] 테스트 오류:', error);
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

  // 세션 상세 정보 보기
  const viewSessionDetails = (session: AdminSession) => {
    setSelectedSession(session);
    console.log('🔍 [Step 3B.1a] 세션 상세 정보:', {
      id: session.id,
      name: session.session_name,
      targetClass: session.target_class,
      missionsCount: session.parsedMissions?.length || 0,
      isActive: session.is_active,
      createdAt: session.created_at
    });
  };

  // 활성 세션 필터링
  const getActiveSessions = () => {
    if (!testResult?.data) return [];
    return filterActiveSessions(testResult.data);
  };

  // 반별 세션 필터링
  const getFilteredSessions = () => {
    if (!testResult?.data) return [];
    if (!filterClass.trim()) return testResult.data;
    return filterSessionsByClass(testResult.data, filterClass.trim());
  };

  return (
    <div style={{ 
      padding: '15px', 
      border: '2px solid #17a2b8', 
      borderRadius: '8px',
      marginTop: '15px'
    }}>
      <h4>Step 3B.1a: Admin Session Service 테스트</h4>
      
      {/* 테스트 컨트롤 */}
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testLoadSessions}
          style={{
            padding: '10px 20px',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
          disabled={isLoading}
        >
          {isLoading ? '로딩 중...' : '관리자 세션 로드 테스트'}
        </button>
        
        <span style={{ fontSize: '12px', color: '#6c757d' }}>
          (admin-rolesv2.js loadSessions 함수 마이그레이션 검증)
        </span>
      </div>

      {/* 필터링 컨트롤 */}
      {testResult && testResult.success && (
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h5 style={{ margin: '0 0 10px 0' }}>세션 필터링</h5>
          
          <div style={{ marginBottom: '10px' }}>
            <label style={{ marginRight: '10px' }}>반별 필터:</label>
            <input 
              type="text" 
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              placeholder="예: 3학년, 1-2"
              style={{
                padding: '5px 8px',
                border: '1px solid #ccc',
                borderRadius: '3px',
                marginRight: '10px'
              }}
            />
            <button
              onClick={() => setFilterClass('')}
              style={{
                padding: '5px 10px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              초기화
            </button>
          </div>
          
          <div style={{ fontSize: '13px', color: '#495057' }}>
            <span><strong>전체 세션:</strong> {testResult.count}개</span>
            <span style={{ marginLeft: '20px' }}><strong>활성 세션:</strong> {getActiveSessions().length}개</span>
            <span style={{ marginLeft: '20px' }}><strong>필터 결과:</strong> {getFilteredSessions().length}개</span>
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
              <strong>세션 개수:</strong> {testResult.count}개
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

            {/* 세션 목록 */}
            {testResult.success && testResult.data.length > 0 && (
              <div>
                <h6>📋 로드된 세션 목록:</h6>
                <div style={{
                  maxHeight: '300px',
                  overflowY: 'auto',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px'
                }}>
                  {getFilteredSessions().map((session) => (
                    <div 
                      key={session.id}
                      style={{
                        padding: '10px',
                        borderBottom: '1px solid #f0f0f0',
                        cursor: 'pointer',
                        backgroundColor: selectedSession?.id === session.id ? '#e7f3ff' : 'white'
                      }}
                      onClick={() => viewSessionDetails(session)}
                    >
                      <div style={{ fontWeight: 'bold', color: session.is_active ? '#28a745' : '#6c757d' }}>
                        {session.is_active ? '🟢' : '⚫'} {session.session_name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '2px' }}>
                        {session.target_class && `👥 ${session.target_class}`}
                        {session.parsedMissions && session.parsedMissions.length > 0 && 
                          ` | 🎯 ${session.parsedMissions.length}개 미션`
                        }
                        {session.created_at && ` | 📅 ${new Date(session.created_at).toLocaleDateString()}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 선택된 세션 상세 정보 */}
      {selectedSession && (
        <div style={{
          marginTop: '20px',
          border: '2px solid #007bff',
          borderRadius: '8px',
          backgroundColor: '#f8f9fa'
        }}>
          <div style={{
            padding: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            fontWeight: 'bold'
          }}>
            🔍 세션 상세 정보: {selectedSession.session_name}
          </div>
          
          <div style={{ padding: '15px' }}>
            <div style={{ marginBottom: '8px' }}>
              <strong>ID:</strong> {selectedSession.id}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>상태:</strong> {selectedSession.is_active ? '🟢 활성' : '⚫ 비활성'}
            </div>
            {selectedSession.description && (
              <div style={{ marginBottom: '8px' }}>
                <strong>설명:</strong> {selectedSession.description}
              </div>
            )}
            {selectedSession.target_class && (
              <div style={{ marginBottom: '8px' }}>
                <strong>대상 반:</strong> {selectedSession.target_class}
              </div>
            )}
            <div style={{ marginBottom: '8px' }}>
              <strong>생성일:</strong> {new Date(selectedSession.created_at).toLocaleString()}
            </div>
            
            {selectedSession.parsedMissions && selectedSession.parsedMissions.length > 0 && (
              <div style={{ marginTop: '15px' }}>
                <strong>🎯 미션 목록 ({selectedSession.parsedMissions.length}개):</strong>
                <div style={{
                  marginTop: '8px',
                  maxHeight: '150px',
                  overflowY: 'auto',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  backgroundColor: 'white'
                }}>
                  {selectedSession.parsedMissions.map((mission, index) => (
                    <div key={mission.id || index} style={{
                      padding: '8px',
                      borderBottom: index < selectedSession.parsedMissions!.length - 1 ? '1px solid #f0f0f0' : 'none'
                    }}>
                      <div style={{ fontWeight: 'bold' }}>
                        {index + 1}. {mission.name}
                      </div>
                      {mission.description && (
                        <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '2px' }}>
                          {mission.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
        원본 admin-rolesv2.js loadSessions() 함수 → TypeScript adminSessionService 마이그레이션 검증
      </div>
    </div>
  );
}