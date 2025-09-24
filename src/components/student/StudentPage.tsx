import React, { useState } from 'react';
import StudentInfoCard from './cards/StudentInfoCard';
import DailyPointsCard from './cards/DailyPointsCard';
import TodoListCard from './cards/TodoListCard';
import RoleAssignmentCard from './cards/RoleAssignmentCard';
import LearningGuideCard from './cards/LearningGuideCard';
import TeacherMessagesCard from './cards/TeacherMessagesCard';

const StudentPage: React.FC = () => {
  // 상태 관리
  const [todos] = useState([
    { id: '1', stage: 1, title: '1단계', completed: true },
    { id: '2', stage: 2, title: '2단계', completed: true },
    { id: '3', stage: 3, title: '3단계', completed: false }
  ]);

  const [messages] = useState([
    // 메시지가 없는 상태로 설정
  ]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 - 남색에서 보라색으로 그라데이션 */}
      <header className="w-full h-20 bg-gradient-to-r from-indigo-600 via-purple-500 to-purple-600 flex items-center justify-between px-8 shadow-lg">
        {/* 왼쪽: 앱 제목 - 큼직하고 깔끔한 폰트 */}
        <h1 className="text-white text-3xl font-bold tracking-wide">
          참치김밥
        </h1>
        
        {/* 오른쪽: 사용자 정보 + 깔끔한 홈 아이콘 */}
        <div className="flex items-center space-x-4 text-white">
          <span className="text-xl font-semibold tracking-wide">3127 테스트</span>
          <button className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </button>
        </div>
      </header>

      {/* 메인 콘텐츠 영역 */}
      <main className="p-6">
        {/* 6개 카드 그리드 - 2x3 레이아웃 (가로 2개, 세로 3개) */}
        <div className="grid grid-cols-2 grid-rows-3 gap-6 max-w-4xl mx-auto">
          
          {/* 학생 정보 카드 */}
          <StudentInfoCard
            studentId="3127"
            studentName="테스트"
            school="선재 중"
            grade="1학년"
          />

          {/* 오늘의 포인트 카드 */}
          <DailyPointsCard
            currentPoints={3}
            maxPoints={10}
            date="2025년 9월 24일"
          />

          {/* 오늘의 할일 카드 */}
          <TodoListCard
            todos={todos}
            onToggleComplete={(todoId) => console.log('Toggle todo:', todoId)}
            onAddStage={(stage) => console.log('Add stage:', stage)}
          />

          {/* 역할 배정 카드 */}
          <RoleAssignmentCard
            onCheckRole={() => console.log('Check role clicked')}
          />

          {/* 학습안내 카드 */}
          <LearningGuideCard
            onViewGuide={() => console.log('View guide clicked')}
          />

          {/* 선생님 쪽지함 카드 */}
          <TeacherMessagesCard
            messages={messages}
            unreadCount={0}
            onViewMessages={() => console.log('View messages clicked')}
            onMarkAsRead={(messageId) => console.log('Mark as read:', messageId)}
          />

        </div>
      </main>
    </div>
  );
};

export default StudentPage;