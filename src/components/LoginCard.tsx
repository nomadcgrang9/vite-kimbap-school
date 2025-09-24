/**
 * LoginCard Component (참치김밥)
 * 원본 index.html의 로그인 카드 레이아웃 완전 보존
 */

import { useState } from 'react';

interface LoginCardProps {
  isLoggedIn: boolean;
  onLogin: (studentId: string, studentName: string) => void;
}

export default function LoginCard({ isLoggedIn, onLogin }: LoginCardProps) {
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [showTeacherLogin, setShowTeacherLogin] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!studentId || !studentName) {
      alert('학번과 이름을 모두 입력해주세요.');
      return;
    }

    if (studentId.length !== 4 || !/^\d{4}$/.test(studentId)) {
      alert('학번은 4자리 숫자로 입력해주세요.');
      return;
    }

    console.log('🎓 [LoginCard] 로그인 시도:', studentId, studentName);
    onLogin(studentId, studentName);
  };

  const handleTeacherLogin = () => {
    console.log('👨‍🏫 [LoginCard] 선생님 로그인');
    // TODO: 선생님 로그인 로직 구현
    alert('선생님 로그인 기능은 곧 구현될 예정입니다.');
  };

  if (isLoggedIn) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-4 flex flex-col justify-center items-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <i className="fas fa-check text-3xl text-green-600"></i>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">로그인 완료</h2>
          <p className="text-gray-600 mb-6">역할 배정을 확인해주세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 flex flex-col justify-between">
      <div>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-3">
            <i className="fas fa-user-graduate text-3xl text-purple-600"></i>
          </div>
          <h2 className="text-xl font-bold text-gray-800">🐟 참치김밥</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-12">
            <label className="block text-base font-bold text-gray-700 mb-3">
              <i className="fas fa-id-card mr-2 text-purple-500"></i>학번
            </label>
            <input 
              type="text" 
              placeholder="예: 4103" 
              pattern="[0-9]{4}"
              maxLength={4}
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
              className="w-full px-4 py-4 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-xl text-center font-bold"
            />
          </div>

          <div className="mb-12">
            <label className="block text-base font-bold text-gray-700 mb-3">
              <i className="fas fa-user mr-2 text-purple-500"></i>이름
            </label>
            <input 
              type="text" 
              placeholder="예: 김선호" 
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              required
              className="w-full px-4 py-4 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-xl text-center font-bold"
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold py-4 rounded-lg hover:opacity-90 transition transform hover:scale-105 text-lg mb-12"
          >
            <i className="fas fa-arrow-right mr-2"></i>학생 로그인
          </button>
        </form>
      </div>

      {/* Teacher Login Button */}
      <div className="pt-4 border-t border-gray-200 text-center mb-0">
        <button 
          onClick={handleTeacherLogin}
          className="text-gray-500 hover:text-gray-700 text-xs underline"
        >
          <i className="fas fa-user-shield mr-1"></i>선생님 로그인
        </button>
      </div>
    </div>
  );
}