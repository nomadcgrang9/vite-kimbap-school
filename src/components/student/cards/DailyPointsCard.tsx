import React from 'react';

interface DailyPointsCardProps {
  currentPoints: number;
  maxPoints: number;
  date?: string;
}

const DailyPointsCard: React.FC<DailyPointsCardProps> = ({
  currentPoints,
  maxPoints,
  date = new Date().toLocaleDateString('ko-KR')
}) => {
  const progressPercentage = (currentPoints / maxPoints) * 100;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col">
      {/* 헤더 */}
      <h3 className="text-gray-700 font-medium mb-4 flex items-center">
        <span className="mr-2">🪙</span>
        오늘의 포인트
      </h3>
      
      {/* 날짜 */}
      <p className="text-gray-400 text-sm mb-4">{date}</p>
      
      {/* 포인트 표시 */}
      <div className="flex items-center mb-4">
        <span className="text-yellow-500 text-2xl mr-2">🪙</span>
        <span className="text-3xl font-bold text-gray-800">{currentPoints}</span>
      </div>
      
      {/* 현재 포인트 라벨 */}
      <p className="text-gray-500 text-sm mb-4">현재 포인트</p>
      
      {/* 프로그레스 바 */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div 
          className="bg-yellow-400 h-2 rounded-full transition-all duration-300" 
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      
      {/* 포인트 비율 */}
      <p className="text-gray-500 text-sm text-center">{currentPoints} / {maxPoints} 포인트</p>
    </div>
  );
};

export default DailyPointsCard;