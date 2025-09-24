/**
 * Admin Role Modal Component
 * Phase 3B.2a: 역할 배정 모달 UI 컴포넌트 마이그레이션
 * 원본: admin-rolesv2.js createRoleModal()
 */

import { useState, useEffect } from 'react';
import { 
  loadAdminSessions, 
  type AdminSession 
} from '../services/adminSessionService';
import { 
  loadAdminStudents, 
  type AdminStudent 
} from '../services/adminStudentService';
import { 
  loadAdminAssignments, 
  type AdminAssignment 
} from '../services/adminAssignmentService';

// ============ 타입 정의 ============

interface AdminRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'sessions' | 'assignment' | 'status';

// ============ 메인 컴포넌트 ============

export default function AdminRoleModal({ isOpen, onClose }: AdminRoleModalProps) {
  console.log('🎭 [AdminRoleModal] 컴포넌트 렌더링 - isOpen:', isOpen);
  
  const [activeTab, setActiveTab] = useState<TabType>('sessions');
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [assignments, setAssignments] = useState<AdminAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 데이터 로드
  useEffect(() => {
    console.log('🎭 [AdminRoleModal] useEffect 트리거 - isOpen:', isOpen);
    if (isOpen) {
      console.log('🚀 [AdminRoleModal] 모달이 열려서 데이터 로딩 시작');
      loadAllData();
    }
  }, [isOpen]);

  const loadAllData = async () => {
    console.log('📊 [AdminRoleModal] loadAllData 시작');
    setIsLoading(true);
    console.log('🎨 [AdminRoleModal] 모든 데이터 로드 시작');

    try {
      const [sessionsResult, studentsResult, assignmentsResult] = await Promise.all([
        loadAdminSessions(),
        loadAdminStudents(), 
        loadAdminAssignments()
      ]);

      if (sessionsResult.success) {
        setSessions(sessionsResult.data);
        console.log(`📋 [AdminRoleModal] ${sessionsResult.data.length}개 세션 로드 완료`);
      }

      if (studentsResult.success) {
        setStudents(studentsResult.data);
        console.log(`👥 [AdminRoleModal] ${studentsResult.data.length}명 학생 로드 완료`);
      }

      if (assignmentsResult.success) {
        setAssignments(assignmentsResult.data);
        console.log(`🎯 [AdminRoleModal] ${assignmentsResult.data.length}개 배정 로드 완료`);
      }

    } catch (error) {
      console.error('❌ [AdminRoleModal] 데이터 로드 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabSwitch = (tab: TabType) => {
    setActiveTab(tab);
    console.log(`🔄 [AdminRoleModal] 탭 전환: ${tab}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-6xl h-5/6 flex flex-col">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">
            <i className="fas fa-tasks text-purple-500 mr-3"></i>
            역할 배정 관리 v2.0 (React)
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl transition-colors"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex border-b bg-gray-50">
          <button 
            onClick={() => handleTabSwitch('sessions')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeTab === 'sessions' 
                ? 'bg-purple-500 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <i className="fas fa-cogs mr-2"></i>
            세션 관리
          </button>
          <button 
            onClick={() => handleTabSwitch('assignment')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeTab === 'assignment' 
                ? 'bg-purple-500 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <i className="fas fa-user-tag mr-2"></i>
            배정 관리
          </button>
          <button 
            onClick={() => handleTabSwitch('status')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeTab === 'status' 
                ? 'bg-purple-500 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <i className="fas fa-chart-bar mr-2"></i>
            배정 현황
          </button>
        </div>

        {/* 탭 콘텐츠 영역 */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <i className="fas fa-spinner fa-spin text-4xl text-purple-500 mb-4"></i>
                <p className="text-gray-600">데이터 로드 중...</p>
              </div>
            </div>
          ) : (
            <>
              {/* 세션 관리 탭 */}
              {activeTab === 'sessions' && (
                <SessionsTab sessions={sessions} onRefresh={loadAllData} />
              )}

              {/* 배정 관리 탭 */}
              {activeTab === 'assignment' && (
                <AssignmentTab 
                  sessions={sessions} 
                  students={students} 
                  assignments={assignments}
                  onRefresh={loadAllData} 
                />
              )}

              {/* 배정 현황 탭 */}
              {activeTab === 'status' && (
                <StatusTab 
                  sessions={sessions} 
                  students={students} 
                  assignments={assignments} 
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ 세션 관리 탭 컴포넌트 ============

function SessionsTab({ sessions, onRefresh }: { sessions: AdminSession[]; onRefresh: () => void }) {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-700">세션 관리</h3>
          <div className="space-x-2">
            <button 
              onClick={onRefresh}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              <i className="fas fa-refresh mr-2"></i>
              새로고침
            </button>
            <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors">
              <i className="fas fa-plus mr-2"></i>
              새 세션 생성
            </button>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
          <div className="flex items-center text-purple-700">
            <i className="fas fa-info-circle mr-2"></i>
            <span className="font-medium">총 {sessions.length}개 세션</span>
          </div>
        </div>

        {/* 세션 목록 */}
        <div className="grid gap-4">
          {sessions.map((session) => (
            <div key={session.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className={`inline-block w-3 h-3 rounded-full mr-3 ${
                      session.is_active ? 'bg-green-500' : 'bg-gray-400'
                    }`}></span>
                    <h4 className="font-medium text-gray-900">{session.session_name}</h4>
                  </div>
                  
                  <div className="mt-2 text-sm text-gray-600 space-y-1">
                    {session.description && (
                      <p><i className="fas fa-align-left mr-2"></i>{session.description}</p>
                    )}
                    {session.target_class && (
                      <p><i className="fas fa-users mr-2"></i>대상: {session.target_class}</p>
                    )}
                    <p><i className="fas fa-calendar mr-2"></i>생성: {new Date(session.created_at).toLocaleDateString()}</p>
                    {session.parsedMissions && session.parsedMissions.length > 0 && (
                      <p><i className="fas fa-tasks mr-2"></i>미션: {session.parsedMissions.length}개</p>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button className="text-blue-500 hover:text-blue-600 px-3 py-1">
                    <i className="fas fa-edit mr-1"></i>수정
                  </button>
                  <button className="text-purple-500 hover:text-purple-600 px-3 py-1">
                    <i className="fas fa-user-plus mr-1"></i>배정
                  </button>
                  <button className="text-red-500 hover:text-red-600 px-3 py-1">
                    <i className="fas fa-trash mr-1"></i>삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ 배정 관리 탭 컴포넌트 ============

function AssignmentTab({ sessions, students, assignments, onRefresh }: { 
  sessions: AdminSession[]; 
  students: AdminStudent[]; 
  assignments: AdminAssignment[];
  onRefresh: () => void;
}) {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-700">배정 관리</h3>
          <button 
            onClick={onRefresh}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            <i className="fas fa-refresh mr-2"></i>
            새로고침
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-blue-700">
              <i className="fas fa-tasks text-2xl mb-2"></i>
              <div className="font-medium">총 세션</div>
              <div className="text-2xl font-bold">{sessions.length}</div>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-green-700">
              <i className="fas fa-users text-2xl mb-2"></i>
              <div className="font-medium">총 학생</div>
              <div className="text-2xl font-bold">{students.length}</div>
            </div>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="text-purple-700">
              <i className="fas fa-user-tag text-2xl mb-2"></i>
              <div className="font-medium">총 배정</div>
              <div className="text-2xl font-bold">{assignments.length}</div>
            </div>
          </div>
        </div>

        <div className="text-center text-gray-500 py-12">
          <i className="fas fa-tools text-4xl mb-4"></i>
          <p>배정 관리 기능이 곧 추가될 예정입니다.</p>
          <p className="text-sm mt-2">세션을 선택하고 학생들에게 역할을 배정할 수 있습니다.</p>
        </div>
      </div>
    </div>
  );
}

// ============ 배정 현황 탭 컴포넌트 ============

function StatusTab({ sessions, students, assignments }: { 
  sessions: AdminSession[]; 
  students: AdminStudent[]; 
  assignments: AdminAssignment[] 
}) {
  const activeAssignments = assignments.filter(a => a.is_active);
  const activeSessions = sessions.filter(s => s.is_active);

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">배정 현황</h3>

        {/* 요약 통계 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4">
            <div className="text-center">
              <i className="fas fa-tasks text-2xl mb-2"></i>
              <div className="font-medium">활성 세션</div>
              <div className="text-2xl font-bold">{activeSessions.length}</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-4">
            <div className="text-center">
              <i className="fas fa-users text-2xl mb-2"></i>
              <div className="font-medium">등록 학생</div>
              <div className="text-2xl font-bold">{students.length}</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-4">
            <div className="text-center">
              <i className="fas fa-user-tag text-2xl mb-2"></i>
              <div className="font-medium">활성 배정</div>
              <div className="text-2xl font-bold">{activeAssignments.length}</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg p-4">
            <div className="text-center">
              <i className="fas fa-percentage text-2xl mb-2"></i>
              <div className="font-medium">배정률</div>
              <div className="text-2xl font-bold">
                {students.length > 0 ? Math.round((activeAssignments.length / students.length) * 100) : 0}%
              </div>
            </div>
          </div>
        </div>

        {/* 최근 배정 목록 */}
        {assignments.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">
              <i className="fas fa-clock mr-2"></i>
              최근 배정 현황
            </h4>
            
            <div className="space-y-2">
              {assignments.slice(0, 5).map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div className="flex items-center">
                    <span className={`inline-block w-2 h-2 rounded-full mr-3 ${
                      assignment.is_active ? 'bg-green-500' : 'bg-gray-400'
                    }`}></span>
                    <span className="font-medium">{assignment.student_name || assignment.student_id}</span>
                    <span className="mx-2 text-gray-400">→</span>
                    <span className="text-purple-600">{assignment.role_name || '역할'}</span>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    {assignment.session_name && (
                      <span>{assignment.session_name}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}