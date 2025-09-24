import { useEffect, useState } from 'react'
import './App.css'
import { testSupabaseConnection } from './lib/supabase'
import { runStudentUtilsTests } from './utils/__tests__/studentUtils.test'
import SupabaseTest from './components/SupabaseTest'
import AssignmentTest from './components/AssignmentTest'
import StudentInitializationTest from './components/StudentInitializationTest'
import StudentAuthTest from './components/StudentAuthTest'
import AssignmentCheckTest from './components/AssignmentCheckTest'
import RoleDisplayTest from './components/RoleDisplayTest'
import IntegratedRoleTest from './components/IntegratedRoleTest'
import AutoIntegrationTest from './components/AutoIntegrationTest'
import AdminSessionTest from './components/AdminSessionTest'
import DirectAdminSessionTest from './components/DirectAdminSessionTest'
import AdminStudentTest from './components/AdminStudentTest'
import DirectAdminStudentTest from './components/DirectAdminStudentTest'
import DirectAdminAssignmentTest from './components/DirectAdminAssignmentTest'
import AdminRoleModal from './components/AdminRoleModal'
import MainPage from './pages/MainPage'

function App() {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'failed'>('testing')
  const [utilsTestResults, setUtilsTestResults] = useState<any>(null)
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false)
  const [showMainPage, setShowMainPage] = useState(false)

  useEffect(() => {
    const checkConnection = async () => {
      const isConnected = await testSupabaseConnection()
      setConnectionStatus(isConnected ? 'connected' : 'failed')
    }
    
    // Run utility function tests
    const testResults = runStudentUtilsTests()
    setUtilsTestResults(testResults)
    
    checkConnection()
  }, [])

  // MainPage 모드일 때는 테스트 컴포넌트들 대신 메인 페이지 표시
  if (showMainPage) {
    return <MainPage />
  }

  return (
    <>
      <div className="card">
        <h1>Classroom Management System</h1>
        <h2>Migration Progress</h2>
        
        <div style={{ 
          padding: '20px', 
          border: '2px solid', 
          borderColor: connectionStatus === 'connected' ? 'green' : 
                      connectionStatus === 'failed' ? 'red' : 'orange',
          borderRadius: '8px',
          marginTop: '20px'
        }}>
          <h3>Phase 1.1: Environment Variables Setup</h3>
          <p>Supabase Connection Status: 
            <strong style={{ 
              color: connectionStatus === 'connected' ? 'green' : 
                     connectionStatus === 'failed' ? 'red' : 'orange'
            }}>
              {connectionStatus === 'testing' && ' Testing...'}
              {connectionStatus === 'connected' && ' ✅ Connected'}
              {connectionStatus === 'failed' && ' ❌ Failed'}
            </strong>
          </p>
          
          {connectionStatus === 'connected' && (
            <div style={{ marginTop: '10px', color: 'green' }}>
              ✅ 환경변수 설정이 성공적으로 작동합니다!<br/>
              ✅ Supabase 연결이 정상적으로 이루어졌습니다.<br/>
              ✅ 보안 취약점이 해결되었습니다 (하드코딩된 키 제거).
            </div>
          )}
          
          {connectionStatus === 'failed' && (
            <div style={{ marginTop: '10px', color: 'red' }}>
              ❌ Supabase 연결에 실패했습니다.<br/>
              .env 파일과 환경변수를 확인해주세요.
            </div>
          )}
        </div>
        
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          border: '1px solid #ddd', 
          borderRadius: '8px' 
        }}>
          <h4>Phase 1.2: First Utility Migration Test</h4>
          {utilsTestResults && (
            <div>
              <p><strong>Student Utils Test Results:</strong></p>
              <div style={{ 
                backgroundColor: utilsTestResults.allPassed ? '#d4edda' : '#f8d7da',
                color: utilsTestResults.allPassed ? '#155724' : '#721c24',
                padding: '10px',
                borderRadius: '5px',
                marginBottom: '10px'
              }}>
                {utilsTestResults.allPassed ? '✅ All utility tests passed!' : '❌ Some utility tests failed'}
              </div>
              <details style={{ fontSize: '14px' }}>
                <summary>View Test Details</summary>
                <pre style={{ 
                  backgroundColor: '#f8f9fa', 
                  padding: '10px', 
                  borderRadius: '5px',
                  fontSize: '12px',
                  overflow: 'auto'
                }}>
                  {JSON.stringify(utilsTestResults, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>

        <div style={{ marginTop: '20px', textAlign: 'left' }}>
          <h4>Migration Plan Status:</h4>
          <ul>
            <li>✅ Phase 1.1: Environment Variables Setup (COMPLETED)</li>
            <li>✅ Phase 1.2: Git Initialization & First Utility Migration (COMPLETED)</li>
            <li>✅ Phase 2A: Core Function Migration (student.js → modules)</li>
            <li>✅ Phase 2B: Student Login System Migration</li>
            <li>✅ Phase 3A: Role Display System Migration (COMPLETED)</li>
            <li>🔄 Phase 3B.2a: Admin UI Component Migration (IN PROGRESS)</li>
            <li>⏳ Phase 4: UI Component Migration</li>
          </ul>
        </div>

        {/* Step 2A.1 Test Component */}
        <SupabaseTest />

        {/* Step 2A.2b Test Component */}
        <AssignmentTest />

        {/* Step 2A.2d Test Component */}
        <StudentInitializationTest />

        {/* Step 2B.2 Test Component */}
        <StudentAuthTest />

        {/* Step 2B.4 Test Component */}
        <AssignmentCheckTest />

        {/* Step 3A.2 Test Component */}
        <RoleDisplayTest />

        {/* Step 3A.3 Integration Test Component */}
        <IntegratedRoleTest />

        {/* Step 3A.3 Auto Integration Test */}
        <AutoIntegrationTest />

        {/* Step 3B.1a Test Component */}
        <AdminSessionTest />
        
        {/* Direct Admin Session Test */}
        <DirectAdminSessionTest />

        {/* Step 3B.1b Test Component */}
        <AdminStudentTest />

        {/* Direct Admin Student Test */}
        <DirectAdminStudentTest />

        {/* Step 3B.1c Test Component */}
        <DirectAdminAssignmentTest />

        {/* Phase 4: Main Page Integration Test */}
        <div style={{ 
          marginTop: '30px', 
          padding: '20px', 
          border: '2px solid #28a745', 
          borderRadius: '8px',
          backgroundColor: '#f8fff9'
        }}>
          <h3 style={{ color: '#28a745', marginBottom: '15px' }}>
            🎯 Phase 4: 메인 페이지 통합 (크롬북 13인치 최적화)
          </h3>
          <p style={{ marginBottom: '15px' }}>
            원본 index.html의 레이아웃을 완전 보존한 React 메인 페이지
          </p>
          <button
            onClick={() => setShowMainPage(true)}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              marginRight: '10px'
            }}
            onMouseOver={(e) => (e.target as HTMLElement).style.backgroundColor = '#218838'}
            onMouseOut={(e) => (e.target as HTMLElement).style.backgroundColor = '#28a745'}
          >
            🚀 메인 페이지 (React)
          </button>
          <button
            onClick={() => window.location.href = '?page=original'}
            style={{
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              marginRight: '10px'
            }}
            onMouseOver={(e) => (e.target as HTMLElement).style.backgroundColor = '#c82333'}
            onMouseOut={(e) => (e.target as HTMLElement).style.backgroundColor = '#dc3545'}
          >
            🎯 메인 페이지 (원본)
          </button>
          <button
            onClick={() => window.location.href = '?page=student'}
            style={{
              backgroundColor: '#6f42c1',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              marginRight: '10px'
            }}
            onMouseOver={(e) => (e.target as HTMLElement).style.backgroundColor = '#5a32a3'}
            onMouseOut={(e) => (e.target as HTMLElement).style.backgroundColor = '#6f42c1'}
          >
            👤 학생 페이지 (원본)
          </button>
          <button
            onClick={() => window.location.href = '?page=admin'}
            style={{
              backgroundColor: '#fd7e14',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
            onMouseOver={(e) => (e.target as HTMLElement).style.backgroundColor = '#e8690b'}
            onMouseOut={(e) => (e.target as HTMLElement).style.backgroundColor = '#fd7e14'}
          >
            🔧 관리자 페이지 (원본)
          </button>
          <div style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
            📱 <strong>크롬북 13인치 최적화</strong>: 모든 페이지가 원본 레이아웃을 100% 보존합니다<br/>
            🎯 <strong>메인페이지</strong>: 타이머 + 로그인 + 돌림판 3분할 레이아웃<br/>
            👤 <strong>학생페이지</strong>: 역할배정 + 포인트 + 쪽지함 6영역 그리드<br/>
            🔧 <strong>관리자페이지</strong>: 포인트/학생/역할/메시지 관리 시스템
          </div>
        </div>

        {/* Step 3B.2a: Admin UI Component Test */}
        <div style={{ 
          marginTop: '30px', 
          padding: '20px', 
          border: '2px solid #007bff', 
          borderRadius: '8px',
          backgroundColor: '#f8f9ff'
        }}>
          <h3 style={{ color: '#007bff', marginBottom: '15px' }}>
            ✅ Phase 3B.2a: Admin UI Component Migration Test (완료)
          </h3>
          <p style={{ marginBottom: '15px' }}>
            AdminRoleModal 컴포넌트 통합 테스트 - 관리자 역할 관리 모달 UI
          </p>
          <button
            onClick={() => setIsAdminModalOpen(true)}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
            onMouseOver={(e) => (e.target as HTMLElement).style.backgroundColor = '#0056b3'}
            onMouseOut={(e) => (e.target as HTMLElement).style.backgroundColor = '#007bff'}
          >
            🚀 관리자 역할 관리 모달 열기
          </button>
          <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
            📋 모달에서 세션 관리, 과제 관리, 상태 개요 탭을 테스트할 수 있습니다.
          </div>
        </div>

        {/* Admin Role Modal Component */}
        <AdminRoleModal 
          isOpen={isAdminModalOpen} 
          onClose={() => setIsAdminModalOpen(false)} 
        />
      </div>
    </>
  )
}

export default App