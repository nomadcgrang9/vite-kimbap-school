import React from 'react';

interface LearningGuideCardProps {
  hasAnnouncements?: boolean;
  announcements?: string[];
  onViewGuide?: () => void;
}

const LearningGuideCard: React.FC<LearningGuideCardProps> = ({
  hasAnnouncements = false,
  announcements = [],
  onViewGuide
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col min-h-[200px]">
      {/* 헤더 */}
      <h3 className="text-gray-700 font-medium mb-6 flex items-center">
        <span className="mr-2">📊</span>
        학습안내
      </h3>
      
      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 flex items-center justify-center">
        {!hasAnnouncements && (
          <p className="text-gray-500 text-center">공지사항이 없습니다.</p>
        )}
        
        {hasAnnouncements && (
          <div className="w-full">
            <div className="space-y-2 mb-4">
              {announcements.map((announcement, index) => (
                <div key={index} className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
                  <p className="text-blue-700 text-sm">{announcement}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* 하단 버튼 영역 */}
      {hasAnnouncements && onViewGuide && (
        <button
          onClick={onViewGuide}
          className="w-full bg-gray-700 text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors mt-4"
        >
          자세히 보기
        </button>
      )}
    </div>
  );
};

export default LearningGuideCard;