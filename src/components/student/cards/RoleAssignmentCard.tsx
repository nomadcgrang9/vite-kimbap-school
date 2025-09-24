import React from 'react';

interface Role {
  id: string;
  name: string;
  description?: string;
  type: 'text' | 'image';
  content?: string;
}

interface RoleAssignmentCardProps {
  role?: Role;
  isLoading?: boolean;
  onCheckRole?: () => void;
}

const RoleAssignmentCard: React.FC<RoleAssignmentCardProps> = () => {
  return (
    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col items-center justify-center text-white min-h-[200px]">
      {/* 헤더 */}
      <h3 className="text-white font-medium mb-6 self-start flex items-center">
        <span className="mr-2">🎭</span>
        역할 배정
      </h3>
      
      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 flex items-center justify-center">
        <p className="text-white text-lg font-medium">역할 설명 없음</p>
      </div>
    </div>
  );
};

export default RoleAssignmentCard;