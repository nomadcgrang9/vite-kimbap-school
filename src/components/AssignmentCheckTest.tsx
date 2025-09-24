/**
 * Assignment Check Service Test Component
 * Step 2B.4 검증용 컴포넌트
 */

import { useState } from 'react';
import { checkStudentAssignment, markAssignmentAsChecked } from '../services/assignmentCheckService';
import type { AssignmentCheckResult } from '../services/assignmentCheckService';
import { loadStudentSession } from '../services/studentAuthService';
import type { StudentInfo } from '../services/studentAuthService';

export default function AssignmentCheckTest() {
  const [checkResult, setCheckResult] = useState<AssignmentCheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<StudentInfo | null>(null);

  // 저장된 학생 세션 확인
  const loadCurrentStudent = () => {
    const student = loadStudentSession();
    setCurrentStudent(student);
    console.log('📖 Current Student Session:', student);
  };

  // 배정 확인 테스트 실행
  const runAssignmentCheck = async () => {
    if (!currentStudent) {
      console.warn('❌ 로그인된 학생이 없습니다');
      setCheckResult({
        success: false,
        hasAssignment: false,
        error: '로그인된 학생 정보가 없습니다. 먼저 로그인해주세요.'
      });
      return;
    }

    setIsLoading(true);
    console.log('🧪 [Step 2B.4] Assignment Check 테스트 시작...');

    try {
      const result = await checkStudentAssignment(currentStudent);
      
      console.log('📋 Assignment Check Result:', result);
      setCheckResult(result);
      
      if (result.success && result.hasAssignment && result.assignment) {
        console.log('✅ 배정 발견:', result.assignment);
      }
      
    } catch (error) {
      console.error('❌ [Step 2B.4] 테스트 실행 오류:', error);
      setCheckResult({
        success: false,
        hasAssignment: false,
        error: error instanceof Error ? error.message : '테스트 실행 오류'
      });
      
    } finally {
      setIsLoading(false);
    }
  };

  // 배정 확인 표시 테스트
  const markAsChecked = async () => {
    if (checkResult?.assignment?.id) {
      const success = await markAssignmentAsChecked(checkResult.assignment.id);
      console.log('📋 Mark as Checked:', success);
    }
  };

  const getStatusColor = () => {
    if (isLoading) return 'orange';
    if (!checkResult) return 'gray';
    if (!checkResult.success) return 'red';
    return checkResult.hasAssignment ? 'green' : 'blue';
  };

  const getStatusText = () => {
    if (isLoading) return `🔄 배정 확인 중...`;
    if (!checkResult) return '⏳ 테스트 대기 중';
    if (!checkResult.success) return `❌ 실패: ${checkResult.error}`;
    
    if (checkResult.hasAssignment) {
      return `✅ 배정 있음 (${checkResult.assignmentType})`;
    } else {
      return '🔵 배정 없음';
    }
  };

  const statusColor = getStatusColor();

  return (
    <div style={{ 
      padding: '15px', 
      border: `2px solid ${statusColor}`, 
      borderRadius: '8px',
      marginTop: '15px'
    }}>
      <h4>Step 2B.4: Assignment Check Service 테스트</h4>
      <p style={{ color: statusColor, fontWeight: 'bold' }}>
        상태: {getStatusText()}
      </p>
      
      {/* 현재 학생 정보 */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ fontSize: '14px', marginBottom: '8px' }}>
          <strong>현재 로그인된 학생:</strong>
          {currentStudent ? (
            <span style={{ color: 'green', marginLeft: '8px' }}>
              {currentStudent.name} ({currentStudent.studentId}) - {currentStudent.fullClass} {currentStudent.number}번
            </span>
          ) : (
            <span style={{ color: 'red', marginLeft: '8px' }}>없음</span>
          )}
        </div>
        
        <button 
          onClick={loadCurrentStudent}
          style={{
            padding: '6px 12px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
            marginRight: '8px'
          }}
        >
          세션에서 학생 정보 로드
        </button>
      </div>
      
      {/* 테스트 버튼들 */}
      <div style={{ marginBottom: '15px' }}>
        <button 
          onClick={runAssignmentCheck}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '8px'
          }}
          disabled={isLoading || !currentStudent}
        >
          {isLoading ? '확인 중...' : '배정 확인 실행'}
        </button>
        
        {checkResult?.hasAssignment && (
          <button 
            onClick={markAsChecked}
            style={{
              padding: '6px 12px',
              backgroundColor: '#6f42c1',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            확인 표시
          </button>
        )}
      </div>
      
      {/* 결과 표시 */}
      {checkResult && (
        <div style={{ fontSize: '14px', marginTop: '10px' }}>
          <div><strong>처리 결과:</strong> {checkResult.success ? '✅ 성공' : '❌ 실패'}</div>
          <div><strong>배정 여부:</strong> {checkResult.hasAssignment ? '✅ 있음' : '❌ 없음'}</div>
          
          {checkResult.assignmentType && (
            <div><strong>배정 타입:</strong> {
              checkResult.assignmentType === 'direct' ? '직접 배정' : '반별 배정'
            }</div>
          )}
          
          {checkResult.error && (
            <div style={{ color: 'red', marginTop: '5px' }}>
              <strong>오류:</strong> {checkResult.error}
            </div>
          )}
          
          {/* 디버그 정보 */}
          {checkResult.debugInfo && (
            <div style={{ marginTop: '10px' }}>
              <div><strong>디버그 정보:</strong></div>
              <div style={{ marginLeft: '15px', fontSize: '13px' }}>
                <div>• 전체 배정 수: {checkResult.debugInfo.totalAssignments}개</div>
                <div>• 직접 배정 매칭: {checkResult.debugInfo.directMatches}개</div>
                <div>• 반별 배정 매칭: {checkResult.debugInfo.classMatches}개</div>
                <div>• 학생 ID: {checkResult.debugInfo.studentId}</div>
                <div>• 학생 반: {checkResult.debugInfo.fullClass}</div>
              </div>
            </div>
          )}
          
          {/* 배정 세부 정보 */}
          {checkResult.hasAssignment && checkResult.assignment && (
            <details style={{ marginTop: '10px' }}>
              <summary style={{ cursor: 'pointer', color: '#007bff', fontSize: '14px' }}>
                배정 세부 정보 보기
              </summary>
              <div style={{ 
                marginTop: '8px', 
                padding: '10px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '4px',
                fontSize: '13px'
              }}>
                <div><strong>ID:</strong> {checkResult.assignment.id}</div>
                <div><strong>역할명:</strong> {checkResult.assignment.roleName || 'N/A'}</div>
                <div><strong>역할 타입:</strong> {checkResult.assignment.roleType || 'N/A'}</div>
                <div><strong>세션명:</strong> {checkResult.assignment.sessionName || 'N/A'}</div>
                {checkResult.assignment.roleContent && (
                  <div><strong>역할 내용:</strong> {
                    checkResult.assignment.roleContent.length > 100 
                      ? checkResult.assignment.roleContent.substring(0, 100) + '...'
                      : checkResult.assignment.roleContent
                  }</div>
                )}
                {checkResult.assignment.roleDescription && (
                  <div><strong>역할 설명:</strong> {checkResult.assignment.roleDescription}</div>
                )}
              </div>
            </details>
          )}
        </div>
      )}
      
      <div style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
        원본 checkStudentAssignment() 함수 → TypeScript AssignmentCheckService 마이그레이션 검증<br/>
        ⚠️ 주의: 먼저 Student Auth 테스트에서 로그인 후 테스트해주세요.
      </div>
    </div>
  );
}