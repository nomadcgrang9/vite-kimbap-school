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

function App() {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'failed'>('testing')
  const [utilsTestResults, setUtilsTestResults] = useState<any>(null)
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false)

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

        {/* Step 3B.2a: Admin UI Component Test */}
        <div style={{ 
          marginTop: '30px', 
          padding: '20px', 
          border: '2px solid #007bff', 
          borderRadius: '8px',
          backgroundColor: '#f8f9ff'
        }}>
          <h3 style={{ color: '#007bff', marginBottom: '15px' }}>
            🔄 Phase 3B.2a: Admin UI Component Migration Test
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