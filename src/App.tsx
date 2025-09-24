import { useEffect, useState } from 'react'
import './App.css'
import { testSupabaseConnection } from './lib/supabase'

function App() {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'failed'>('testing')

  useEffect(() => {
    const checkConnection = async () => {
      const isConnected = await testSupabaseConnection()
      setConnectionStatus(isConnected ? 'connected' : 'failed')
    }
    
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
        
        <div style={{ marginTop: '20px', textAlign: 'left' }}>
          <h4>Migration Plan Status:</h4>
          <ul>
            <li>✅ Phase 1.1: Environment Variables Setup (COMPLETED)</li>
            <li>⏳ Phase 1.2: Git Initialization & First Utility Migration</li>
            <li>⏳ Phase 2: Core Module Conversion (student.js → modules)</li>
            <li>⏳ Phase 3: Admin Modules Migration</li>
            <li>⏳ Phase 4: Database API Integration</li>
            <li>⏳ Phase 5: UI Component Migration</li>
          </ul>
        </div>
      </div>
    </>
  )
}

export default App