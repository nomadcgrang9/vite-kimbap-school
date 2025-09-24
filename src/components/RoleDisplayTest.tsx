/**
 * Role Display Test Component
 * Step 3A.2 검증용 컴포넌트
 */

import { useState } from 'react';
import RoleDisplay from './RoleDisplay';
import { loadStudentSession } from '../services/studentAuthService';
import { checkStudentAssignment } from '../services/assignmentCheckService';
import type { StudentInfo } from '../services/studentAuthService';
import type { StudentAssignment } from '../services/assignmentCheckService';

export default function RoleDisplayTest() {
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [assignment, setAssignment] = useState<StudentAssignment | null>(null);
  const [isRoleVisible, setIsRoleVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [_testMode, setTestMode] = useState<'no-role' | 'text-role' | 'image-role'>('no-role');

  // 실제 데이터로 테스트 (기존 로그인 + 배정 확인)
  const loadRealData = async () => {
    setIsLoading(true);
    console.log('🧪 [Step 3A.2] 실제 데이터로 역할 표시 테스트 시작...');

    try {
      // 1. 세션에서 학생 정보 로드
      const sessionStudent = loadStudentSession();
      if (!sessionStudent) {
        console.warn('❌ 로그인된 학생이 없습니다');
        alert('먼저 Student Auth 테스트에서 로그인해주세요.');
        return;
      }

      setStudent(sessionStudent);
      console.log('📋 학생 정보 로드:', sessionStudent);

      // 2. 학생 배정 확인
      const assignmentResult = await checkStudentAssignment(sessionStudent);
      console.log('📋 배정 확인 결과:', assignmentResult);

      if (assignmentResult.success && assignmentResult.hasAssignment && assignmentResult.assignment) {
        setAssignment(assignmentResult.assignment);
        console.log('✅ 배정 발견:', assignmentResult.assignment);
      } else {
        setAssignment(null);
        console.log('ℹ️ 배정 없음');
      }

      // 3. 역할 표시 활성화
      setIsRoleVisible(true);
      
    } catch (error) {
      console.error('❌ [Step 3A.2] 실제 데이터 로드 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 모의 데이터로 테스트
  const loadMockData = (mode: 'no-role' | 'text-role' | 'image-role') => {
    console.log('🧪 [Step 3A.2] 모의 데이터 테스트:', mode);

    // 모의 학생 정보
    const mockStudent: StudentInfo = {
      id: '1234',
      studentId: '1234',
      name: '테스트학생',
      grade: 1,
      classNum: 2,
      number: 34,
      fullClass: '1-2'
    };

    setStudent(mockStudent);

    // 모드별 모의 배정 데이터
    let mockAssignment: StudentAssignment | null = null;

    if (mode === 'text-role') {
      mockAssignment = {
        id: 'mock-text-assignment',
        studentId: '1234',
        studentName: '테스트학생',
        roleName: '모의 텍스트 역할',
        roleContent: '이것은 텍스트 기반 역할의 예시입니다.\n\n역할 설명이 여기에 표시되며,\n줄바꿈도 지원됩니다.',
        roleDescription: '텍스트 역할 설명',
        roleType: 'text',
        sessionName: '모의 세션 이름'
      };
    } else if (mode === 'image-role') {
      mockAssignment = {
        id: 'mock-image-assignment',
        studentId: '1234',
        studentName: '테스트학생',
        roleName: '모의 이미지 역할',
        roleContent: '이미지 기반 역할입니다.',
        roleDescription: '이미지와 함께 표시되는 역할입니다.\n\n추후 실제 이미지 표시 기능이 구현될 예정입니다.',
        role_type: 'image', // Supabase 필드명 테스트
        sessionName: '이미지 세션'
      };
    }

    setAssignment(mockAssignment);
    setTestMode(mode);
    setIsRoleVisible(true);
  };

  // 역할 표시 숨기기
  const hideRole = () => {
    setIsRoleVisible(false);
    setStudent(null);
    setAssignment(null);
  };

  // 포인트 시스템 초기화 모의 함수
  const handlePointSystemInit = () => {
    console.log('🎯 [RoleDisplay] 포인트 시스템 초기화 호출됨');
  };

  // 스테이지 설정 시작 모의 함수
  const handleStageSettingsStart = () => {
    console.log('⚙️ [RoleDisplay] 스테이지 설정 자동 새로고침 시작됨');
  };

  return (
    <div style={{ 
      padding: '15px', 
      border: '2px solid #007bff', 
      borderRadius: '8px',
      marginTop: '15px'
    }}>
      <h4>Step 3A.2: Role Display Component 테스트</h4>
      
      {/* 테스트 컨트롤 패널 */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h5 style={{ margin: '0 0 15px 0' }}>테스트 컨트롤</h5>
        
        <div style={{ marginBottom: '10px' }}>
          <button 
            onClick={loadRealData}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '8px'
            }}
            disabled={isLoading}
          >
            {isLoading ? '로딩 중...' : '실제 데이터로 테스트'}
          </button>
          
          <span style={{ fontSize: '12px', color: '#6c757d' }}>
            (Student Auth에서 로그인 + Assignment Check 연동)
          </span>
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <span style={{ marginRight: '10px', fontSize: '14px' }}>모의 데이터 테스트:</span>
          
          <button 
            onClick={() => loadMockData('no-role')}
            style={{
              padding: '6px 12px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '8px',
              fontSize: '13px'
            }}
          >
            배정 없음
          </button>
          
          <button 
            onClick={() => loadMockData('text-role')}
            style={{
              padding: '6px 12px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '8px',
              fontSize: '13px'
            }}
          >
            텍스트 역할
          </button>
          
          <button 
            onClick={() => loadMockData('image-role')}
            style={{
              padding: '6px 12px',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '8px',
              fontSize: '13px'
            }}
          >
            이미지 역할
          </button>
          
          <button 
            onClick={hideRole}
            style={{
              padding: '6px 12px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            숨기기
          </button>
        </div>

        {/* 현재 상태 표시 */}
        <div style={{ fontSize: '13px', color: '#495057', marginTop: '10px' }}>
          <div><strong>표시 상태:</strong> {isRoleVisible ? '✅ 보임' : '❌ 숨김'}</div>
          <div><strong>학생 정보:</strong> {student ? `${student.name} (${student.studentId})` : '없음'}</div>
          <div><strong>배정 정보:</strong> {assignment ? `${assignment.roleName || '역할'} (${assignment.roleType || 'text'})` : '없음'}</div>
        </div>
      </div>

      {/* RoleDisplay 컴포넌트 */}
      <div style={{
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        backgroundColor: '#ffffff'
      }}>
        {isRoleVisible ? (
          <RoleDisplay 
            student={student}
            assignment={assignment}
            isVisible={isRoleVisible}
            onPointSystemInit={handlePointSystemInit}
            onStageSettingsStart={handleStageSettingsStart}
          />
        ) : (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#6c757d'
          }}>
            <p>위의 테스트 버튼을 클릭하여 역할 표시를 확인해보세요.</p>
          </div>
        )}
      </div>

      <div style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
        원본 showRole() + displayRole() 함수 → React RoleDisplay 컴포넌트 마이그레이션 검증
      </div>
    </div>
  );
}