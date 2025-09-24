/**
 * EditSessionModal Component
 * Phase 3B.2c: 세션 편집 모달 컴포넌트
 * 원본: admin-rolesv2.js editSession()
 */

import { useState, useRef } from 'react';
import type { AdminSession } from '../services/adminSessionService';
import { updateAdminSession } from '../services/adminSessionService';

interface EditSessionModalProps {
  session: AdminSession;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function EditSessionModal({ session, isOpen, onClose, onSave }: EditSessionModalProps) {
  console.log('🛠️ [EditSessionModal] 렌더링 - 세션:', session.session_name);
  
  // 역할 관리 상태
  const [missions, setMissions] = useState(session.parsedMissions || []);
  
  // 폼 데이터 ref들
  const sessionNameRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const targetClassRef = useRef<HTMLSelectElement>(null);
  const statusRef = useRef<HTMLSelectElement>(null);
  
  // ============ 역할 관리 함수들 ============
  
  const addNewRole = () => {
    console.log('➕ [EditSessionModal] 새 역할 추가 시작');
    
    const newRole = {
      name: `새 역할 ${missions.length + 1}`,
      type: 'text' as const
    };
    
    const updatedMissions = [...missions, newRole];
    setMissions(updatedMissions);
    
    console.log('✅ [EditSessionModal] 새 역할 추가 완료:', newRole.name);
    console.log('📋 [EditSessionModal] 현재 역할 수:', updatedMissions.length);
  };
  
  const removeRole = (indexToRemove: number) => {
    console.log('🗑️ [EditSessionModal] 역할 삭제 시작 - 인덱스:', indexToRemove);
    
    if (indexToRemove < 0 || indexToRemove >= missions.length) {
      console.error('❌ [EditSessionModal] 잘못된 인덱스:', indexToRemove);
      return;
    }
    
    const roleToRemove = missions[indexToRemove];
    const confirmed = window.confirm(`정말 "${roleToRemove.name}" 역할을 삭제하시겠습니까?`);
    
    if (!confirmed) {
      console.log('🚫 [EditSessionModal] 역할 삭제 취소됨');
      return;
    }
    
    const updatedMissions = missions.filter((_, index) => index !== indexToRemove);
    setMissions(updatedMissions);
    
    console.log('✅ [EditSessionModal] 역할 삭제 완료:', roleToRemove.name);
    console.log('📋 [EditSessionModal] 현재 역할 수:', updatedMissions.length);
  };
  
  const updateRoleName = (index: number, newName: string) => {
    console.log('✏️ [EditSessionModal] 역할명 변경:', index, newName);
    
    const updatedMissions = missions.map((mission, i) => 
      i === index ? { ...mission, name: newName } : mission
    );
    setMissions(updatedMissions);
  };
  
  const updateRoleType = (index: number, newType: 'text' | 'image') => {
    console.log('🔄 [EditSessionModal] 역할 타입 변경:', index, newType);
    
    const updatedMissions = missions.map((mission, i) => 
      i === index ? { ...mission, type: newType } : mission
    );
    setMissions(updatedMissions);
  };

  // ============ 세션 저장 함수 ============
  
  const submitEditSession = async () => {
    console.log('💾 [EditSessionModal] 세션 저장 시작');
    
    // 폼 데이터 수집
    const sessionName = sessionNameRef.current?.value || session.name;
    const description = descriptionRef.current?.value || '';
    const targetClass = targetClassRef.current?.value || '전체';
    const status = statusRef.current?.value || 'active';
    
    // 역할 데이터를 JSON 문자열로 변환
    const missionsJson = JSON.stringify(missions);
    
    console.log('📋 [EditSessionModal] 저장할 데이터:', {
      sessionName,
      description,
      targetClass,
      status,
      missionsCount: missions.length
    });
    
    try {
      const updates = {
        name: sessionName,
        activity_instructions: description,
        target_class: targetClass,
        status: status,
        missions: missionsJson
      };
      
      console.log('🔄 [EditSessionModal] updateAdminSession 호출 중...');
      const result = await updateAdminSession(session.id, updates);
      
      if (result.success) {
        console.log('✅ [EditSessionModal] 세션 저장 성공');
        alert(`세션 "${sessionName}" 저장이 완료되었습니다.`);
        onSave(); // 부모 컴포넌트 데이터 새로고침
        onClose(); // 모달 닫기
      } else {
        console.error('❌ [EditSessionModal] 세션 저장 실패:', result.message);
        alert(`세션 저장 실패: ${result.message}`);
      }
      
    } catch (error) {
      console.error('❌ [EditSessionModal] 세션 저장 오류:', error);
      alert('세션 저장 중 오류가 발생했습니다.');
    }
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[70]">
      <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-4xl max-h-5/6 overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800">
            <i className="fas fa-edit mr-2 text-blue-500"></i>
            세션 편집: {session.session_name || session.name}
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
                  ref={sessionNameRef}
                  type="text" 
                  defaultValue={session.session_name || session.name}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">활동 설명</label>
                <textarea 
                  ref={descriptionRef}
                  rows={4}
                  defaultValue={session.description || session.activity_instructions || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">대상 클래스</label>
                <select 
                  ref={targetClassRef}
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
                  ref={statusRef}
                  defaultValue={session.is_active || (session.status === 'active') ? 'active' : 'inactive'}
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
                  onClick={addNewRole}
                  className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors"
                >
                  <i className="fas fa-plus mr-1"></i>역할 추가
                </button>
              </div>
              
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {missions && missions.length > 0 ? (
                  missions.map((mission, index) => (
                    <div key={`role-${index}`} className="bg-gray-50 border rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <input 
                          type="text" 
                          value={mission.name || `역할 ${index + 1}`}
                          onChange={(e) => updateRoleName(index, e.target.value)}
                          className="font-medium bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-2 flex-1"
                        />
                        <button 
                          type="button"
                          onClick={() => removeRole(index)}
                          className="text-red-500 hover:text-red-700 text-sm transition-colors ml-2"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                      <select 
                        value={mission.type || 'text'}
                        onChange={(e) => updateRoleType(index, e.target.value as 'text' | 'image')}
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
              onClick={submitEditSession}
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