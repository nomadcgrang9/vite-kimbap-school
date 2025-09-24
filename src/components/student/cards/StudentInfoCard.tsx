import React from 'react';

interface StudentInfoCardProps {
  studentId: string;
  studentName: string;
  school: string;
  grade: string;
}

const StudentInfoCard: React.FC<StudentInfoCardProps> = ({
  studentId,
  studentName,
  school,
  grade
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col items-center">
      {/* 헤더 */}
      <h3 className="text-gray-700 font-medium mb-4 self-start">👤 학생 정보</h3>
      
      {/* 아이콘 */}
      <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mb-3">
        <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
      </div>
      
      {/* 사용자 정보 */}
      <p className="text-gray-500 text-sm mb-1">현재 로그인</p>
      <p className="text-gray-800 font-medium mb-1">{studentId} {studentName}</p>
      <p className="text-gray-600 text-sm">{school} {grade}</p>
    </div>
  );
};

export default StudentInfoCard;