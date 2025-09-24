/**
 * MainPage Component
 * Phase 4-1: 원본 index.html의 크롬북 13인치 최적화 레이아웃 완전 보존
 * 
 * 핵심 레이아웃 요소:
 * - zoom: 0.53 (크롬북 최적화)
 * - 3분할 그리드 (야채김밥, 참치김밥, 치즈김밥)
 * - 정확한 카드 크기와 간격 유지
 */

import { useState, useEffect } from 'react';
import TimerCard from '../components/TimerCard';
import LoginCard from '../components/LoginCard';
import WheelCard from '../components/WheelCard';
import StudentRoleSection from '../components/StudentRoleSection';

export default function MainPage() {
  const [currentTime, setCurrentTime] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [studentInfo, setStudentInfo] = useState({ id: '', name: '' });

  // 시계 업데이트
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      setCurrentTime(timeString);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleStudentLogin = (studentId: string, studentName: string) => {
    console.log('🎓 [MainPage] 학생 로그인:', studentId, studentName);
    setStudentInfo({ id: studentId, name: studentName });
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    console.log('🚪 [MainPage] 로그아웃');
    setIsLoggedIn(false);
    setStudentInfo({ id: '', name: '' });
  };

  return (
    <>
      {/* 크롬북 13인치 최적화 CSS - 원본과 완전 동일 */}
      <style>{`
        .gradient-bg {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .role-card {
          animation: fadeIn 0.5s ease-in-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* 타이머 스타일 */
        .timer-display {
          font-family: 'Courier New', monospace;
          font-size: 3.5rem;
          font-weight: bold;
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        
        .timer-ending {
          animation: pulse 1s infinite;
          color: #ef4444;
        }
        
        /* 돌림판 스타일 */
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .spinning {
          animation: spin 3s cubic-bezier(0.17, 0.67, 0.83, 0.67);
        }
        
        /* 13인치 크롬북 최적화 - 한 화면에 3개 카드 표시 */
        body {
          font-size: 100%;
          zoom: 0.53;  /* 53% 크기로 조정 - 크롬북에서 최적의 가독성과 화면 활용 */
          transform-origin: top left;
        }
        
        /* 브라우저 호환성을 위한 추가 설정 */
        @media screen {
          html {
            zoom: 1.35;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        {/* Navigation - 원본과 완전 동일한 구조 */}
        <nav className="gradient-bg text-white shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <i className="fas fa-sushi text-3xl"></i>
                <h1 className="text-2xl font-bold">창건샘의 김밥교실</h1>
              </div>
              <div className="text-sm opacity-90">
                <span>{currentTime}</span>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content - 원본과 완전 동일한 3분할 레이아웃 */}
        <div className="w-full px-2 py-1">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-stretch max-w-7xl mx-auto">
            
            {/* 야채김밥 (타이머) - 왼쪽 */}
            <TimerCard />

            {/* 참치김밥 (학생 로그인) - 가운데 */}
            <LoginCard 
              isLoggedIn={isLoggedIn}
              onLogin={handleStudentLogin}
            />

            {/* 치즈김밥 (돌림판) - 오른쪽 */}
            <WheelCard />

          </div>

          {/* Student Role Section - 로그인 후 표시 */}
          {isLoggedIn && (
            <StudentRoleSection 
              studentInfo={studentInfo}
              onLogout={handleLogout}
            />
          )}
        </div>
      </div>
    </>
  );
}