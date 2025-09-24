/**
 * EditSessionModal Component
 * Phase 3B.2c: 세션 편집 모달 컴포넌트
 * 원본: admin-rolesv2.js editSession()
 */

import type { AdminSession } from '../services/adminSessionService';

interface EditSessionModalProps {
  session: AdminSession;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function EditSessionModal({ session, isOpen, onClose, onSave }: EditSessionModalProps) {
  console.log('🛠️ [EditSessionModal] 렌더링 - 세션:', session.session_name);
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[70]">
      <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-4xl max-h-5/6 overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800">
            <i className="fas fa-edit mr-2 text-blue-500"></i>
            세션 편집: {session.session_name}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl transition-colors"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 기본 정보 */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-700 mb-4">
                <i className="fas fa-info-circle mr-2"></i>기본 정보
              </h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">세션 이름 *</label>
                <input 
                  type="text" 
                  defaultValue={session.session_name}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">활동 설명</label>
                <textarea 
                  rows={4}
                  defaultValue={session.description || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">대상 클래스</label>
                <select 
                  defaultValue={session.target_class || '전체'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="전체">전체</option>
                  <option value="1학년">1학년</option>
                  <option value="2학년">2학년</option>
                  <option value="3학년">3학년</option>
                  <option value="4학년">4학년</option>
                  <option value="5학년">5학년</option>
                  <option value="6학년">6학년</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
                <select 
                  defaultValue={session.is_active ? 'active' : 'inactive'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">활성</option>
                  <option value="inactive">비활성</option>
                </select>
              </div>
            </div>
            
            {/* 역할 관리 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-700">
                  <i className="fas fa-users-cog mr-2"></i>역할 관리
                </h4>
                <button 
                  type="button"
                  className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors"
                >
                  <i className="fas fa-plus mr-1"></i>역할 추가
                </button>
              </div>
              
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {session.parsedMissions && session.parsedMissions.length > 0 ? (
                  session.parsedMissions.map((mission, index) => (
                    <div key={index} className="bg-gray-50 border rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <input 
                          type="text" 
                          defaultValue={mission.name || `역할 ${index + 1}`}
                          className="font-medium bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-2"
                        />
                        <button 
                          type="button"
                          className="text-red-500 hover:text-red-700 text-sm transition-colors"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                      <select 
                        defaultValue={mission.type || 'text'}
                        className="w-full text-sm px-2 py-1 border rounded"
                      >
                        <option value="text">텍스트 역할</option>
                        <option value="image">이미지 역할</option>
                      </select>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <i className="fas fa-user-plus text-2xl mb-2"></i>
                    <p>아직 역할이 없습니다.</p>
                    <p className="text-sm">역할 추가 버튼을 클릭하세요.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* 하단 버튼 */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button 
              type="button"
              onClick={() => {
                console.log('💾 [EditSessionModal] 저장 버튼 클릭');
                // TODO: 실제 저장 로직 구현
                onSave();
                onClose();
              }}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              <i className="fas fa-save mr-2"></i>저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}