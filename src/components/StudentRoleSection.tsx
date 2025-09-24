/**
 * StudentRoleSection Component
 * 학생 로그인 후 표시되는 역할 섹션
 * 원본 index.html의 roleSection 레이아웃 보존
 */

import { useState, useEffect } from 'react';

interface StudentInfo {
  id: string;
  name: string;
}

interface StudentRoleSectionProps {
  studentInfo: StudentInfo;
  onLogout: () => void;
}

export default function StudentRoleSection({ studentInfo, onLogout }: StudentRoleSectionProps) {
  const [roleAssignment, setRoleAssignment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: 실제 역할 배정 데이터 로드
    // 현재는 모커ㅜ 데이터로 테스트
    setTimeout(() => {
      setRoleAssignment({
        roleName: '팀장',
        roleDescription: '팀을 이끌어가는 역할입니다.',
        sessionName: '협동학습 세션'
      });
      setIsLoading(false);
    }, 1000);
  }, [studentInfo]);

  if (isLoading) {
    return (
      <div className="mt-6">
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-center py-8">
            <i className="fas fa-spinner fa-spin text-2xl text-purple-500 mr-3"></i>
            <span className="text-gray-600">역할 배정 확인 중...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {/* Student Info Header */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-purple-100 rounded-full p-3">
              <i className="fas fa-user text-purple-600 text-xl"></i>
            </div>
            <div>
              <p className="text-sm text-gray-500">학생 정보</p>
              <p className="text-lg font-semibold">
                <span className="text-purple-600">{studentInfo.id}</span> 
                <span className="text-gray-800 ml-2">{studentInfo.name}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="text-gray-500 hover:text-gray-700"
          >
            <i className="fas fa-sign-out-alt mr-1"></i>로그아웃
          </button>
        </div>
      </div>

      {/* Role Assignment Card */}
      {roleAssignment ? (
        <div className="role-card bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl shadow-lg p-6 border border-purple-200">
          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mb-4">
              <i className="fas fa-star text-4xl text-purple-600"></i>
            </div>
            <h3 className="text-2xl font-bold text-purple-800 mb-2">
              당신의 역할: {roleAssignment.roleName}
            </h3>
            <p className="text-gray-600 mb-4">{roleAssignment.roleDescription}</p>
            <div className="bg-white rounded-lg p-3 inline-block">
              <span className="text-sm text-gray-500">세션: </span>
              <span className="font-semibold text-purple-600">{roleAssignment.sessionName}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 mt-6">
            <button className="flex-1 bg-purple-500 text-white font-bold py-3 rounded-lg hover:bg-purple-600 transition">
              <i className="fas fa-play mr-2"></i>역할 시작하기
            </button>
            <button className="flex-1 bg-gray-500 text-white font-bold py-3 rounded-lg hover:bg-gray-600 transition">
              <i className="fas fa-question-circle mr-2"></i>도움말
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 rounded-xl shadow-lg p-6 border border-yellow-200">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-4">
              <i className="fas fa-clock text-4xl text-yellow-600"></i>
            </div>
            <h3 className="text-xl font-bold text-yellow-800 mb-2">
              아직 역할이 배정되지 않았습니다
            </h3>
            <p className="text-gray-600 mb-4">
              선생님이 역할을 배정할 때까지 기다려주세요.
            </p>
            <button className="bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-yellow-600 transition">
              <i className="fas fa-refresh mr-2"></i>새로고침
            </button>
          </div>
        </div>
      )}
    </div>
  );
}