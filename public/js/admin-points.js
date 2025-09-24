/**
 * 관리자용 포인트 관리 모듈
 * 핵심 기능: 현황 조회, 개별 지급, 포인트 리셋
 */

console.log('[AdminPoints] 포인트 관리 모듈 로드됨');

// 전역 변수
let allStudentPoints = [];
let pointsRefreshInterval = null;

// ============ Supabase 연결 함수 (학생페이지와 동일) ============

function getSupabaseClient() {
    // 인라인 스크립트에서 초기화된 글로벌 클라이언트 사용
    if (typeof globalSupabaseClient !== 'undefined' && globalSupabaseClient) {
        return globalSupabaseClient;
    }
    
    // 폴백: 로컬에서 직접 초기화
    if (typeof window.supabase !== 'undefined') {
        const SUPABASE_URL = 'https://xzhbhrhihtfkuvcltpsw.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6aGJocmhpaHRma3V2Y2x0cHN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3NjYyNzEsImV4cCI6MjA3MzM0MjI3MX0.hvHQV0O6SjWgzDyI7WkZC74Mude9dtssqqA4B4_Iqcw';
        
        try {
            const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('[AdminPoints] 폴백 Supabase 초기화 성공');
            return client;
        } catch (error) {
            console.error('[AdminPoints] 폴백 Supabase 초기화 실패:', error);
            return null;
        }
    }
    
    return null;
}

// ============ 모듈 초기화 ============

async function initializePointsModule() {
    try {
        console.log('[AdminPoints] 포인트 모듈 초기화 시작');
        
        // 학생 포인트 현황 로드
        await loadAllStudentPoints();
        
        // 5초마다 자동 새로고침 시작
        startAutoRefresh();
        
        console.log('[AdminPoints] 포인트 모듈 초기화 완료');
        return true;
        
    } catch (error) {
        console.error('[AdminPoints] 모듈 초기화 실패:', error);
        throw error;
    }
}

// ============ 포인트 현황 조회 ============

async function loadAllStudentPoints() {
    try {
        console.log('[AdminPoints] 학생 포인트 현황 로딩 시작...');
        
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        
        // 🔥 supabaseAPI 래퍼 사용으로 전환
        if (typeof supabaseAPI !== 'undefined' && supabaseAPI.dailyPoints) {
            console.log('[AdminPoints] supabaseAPI 래퍼로 데이터 로드 시도...');
            
            // 오늘 날짜 포인트만 조회
            const allPoints = await supabaseAPI.dailyPoints.getAll(today);
            
            if (allPoints && allPoints.length >= 0) {
                allStudentPoints = allPoints;
                console.log(`[AdminPoints] supabaseAPI에서 ${allStudentPoints.length}개 학생 포인트 로드 완료`);
                
                // UI 업데이트
                displayPointsStatus();
                return allStudentPoints;
            } else {
                throw new Error('supabaseAPI에서 데이터 로드 실패');
            }
        }
        
        // Supabase 실패 시 REST API 폴백
        console.log('[AdminPoints] Supabase 연결 실패, REST API 폴백 시도...');
        
        const response = await fetch(`tables/daily_points?limit=1000&sort=student_id`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const restData = await response.json();
        
        if (restData && restData.data) {
            // 오늘 날짜 데이터만 필터링
            allStudentPoints = restData.data.filter(point => 
                point.date === today
            ).sort((a, b) => a.student_id.localeCompare(b.student_id));
            
            console.log(`[AdminPoints] REST API에서 ${allStudentPoints.length}개 학생 포인트 로드 완료`);
            
            // UI 업데이트
            displayPointsStatus();
            
            return allStudentPoints;
        } else {
            throw new Error('데이터 형식 오류');
        }
        
    } catch (error) {
        console.error('[AdminPoints] 포인트 로딩 실패:', error);
        showPointsStatus(`포인트 로딩 실패: ${error.message}`, 'error');
        throw error;
    }
}

// ============ UI 표시 함수 ============

function displayPointsStatus() {
    const pointsList = document.getElementById('studentPointsList');
    const pointsCount = document.getElementById('totalPointsCount');
    
    if (!pointsList) {
        console.warn('[AdminPoints] studentPointsList 요소를 찾을 수 없음');
        return;
    }
    
    // 총 학생 수 업데이트
    if (pointsCount) {
        pointsCount.textContent = allStudentPoints.length;
    }
    
    if (allStudentPoints.length === 0) {
        pointsList.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-users text-4xl mb-4"></i>
                <p>오늘 포인트를 획득한 학생이 없습니다.</p>
                <p class="text-sm mt-2">학생이 로그인하면 자동으로 표시됩니다.</p>
            </div>
        `;
        return;
    }
    
    // 포인트별로 정렬 (높은 순)
    const sortedPoints = [...allStudentPoints].sort((a, b) => (b.total_points || 0) - (a.total_points || 0));
    
    pointsList.innerHTML = sortedPoints.map((point, index) => {
        const totalPoints = point.total_points || 0;
        const isHighScore = totalPoints >= 8;
        const lastActivity = point.last_activity ? 
            new Date(point.last_activity).toLocaleTimeString('ko-KR') : '정보 없음';
            
        return `
            <div class="border rounded-lg p-4 ${isHighScore ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200 bg-white'} hover:shadow-md transition">
                <div class="flex justify-between items-start mb-3">
                    <div class="flex items-center">
                        <div class="w-8 h-8 rounded-full ${isHighScore ? 'bg-yellow-500' : 'bg-blue-500'} text-white flex items-center justify-center mr-3 font-bold text-sm">
                            ${index + 1}
                        </div>
                        <div>
                            <h4 class="font-semibold text-gray-800">${point.student_name || '이름 없음'}</h4>
                            <p class="text-xs text-gray-500">ID: ${point.student_id} | ${point.class_info || ''}</p>
                        </div>
                        ${isHighScore ? '<i class="fas fa-star text-yellow-500 ml-2"></i>' : ''}
                    </div>
                    <div class="text-right">
                        <div class="text-2xl font-bold ${isHighScore ? 'text-yellow-600' : 'text-blue-600'}">
                            ${totalPoints}
                        </div>
                        <div class="text-xs text-gray-500">/ 10점</div>
                    </div>
                </div>
                
                <div class="grid grid-cols-3 gap-2 mb-3 text-xs">
                    <div class="text-center bg-blue-100 rounded p-1">
                        <div class="font-medium">1단계</div>
                        <div class="text-blue-600">${point.stage1_count || 0}회</div>
                    </div>
                    <div class="text-center bg-green-100 rounded p-1">
                        <div class="font-medium">2단계</div>
                        <div class="text-green-600">${point.stage2_count || 0}회</div>
                    </div>
                    <div class="text-center bg-purple-100 rounded p-1">
                        <div class="font-medium">3단계</div>
                        <div class="text-purple-600">${point.stage3_count || 0}회</div>
                    </div>
                </div>
                
                <div class="flex justify-between items-center text-xs text-gray-500 mb-2">
                    <span>총합: ${totalPoints}점</span>
                    <span>마지막 활동: ${lastActivity}</span>
                </div>
                
                <button onclick="openGivePointSection('${point.student_id}', '${point.student_name}')" 
                        class="w-full bg-green-500 text-white py-2 px-3 rounded text-sm hover:bg-green-600 transition">
                    <i class="fas fa-plus mr-1"></i>포인트 지급
                </button>
            </div>
        `;
    }).join('');
}

// ============ 포인트 지급 기능 ============

function openGivePointSection(studentId, studentName) {
    const section = document.getElementById('givePointSection');
    if (!section) {
        console.error('[AdminPoints] givePointSection을 찾을 수 없음');
        return;
    }
    
    // 섹션 정보 설정
    document.getElementById('selectedStudentId').value = studentId;
    document.getElementById('selectedStudentName').textContent = studentName || '알 수 없음';
    document.getElementById('pointsToGive').value = 1;
    document.getElementById('pointMessage').value = '';
    document.getElementById('givePointStatus').innerHTML = '';
    
    // 섹션 표시
    section.classList.remove('hidden');
    
    // 부드러운 스크롤로 섹션으로 이동
    section.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function closeGivePointSection() {
    const section = document.getElementById('givePointSection');
    if (section) {
        section.classList.add('hidden');
    }
    
    // 입력 필드 초기화
    document.getElementById('selectedStudentId').value = '';
    document.getElementById('selectedStudentName').textContent = '-';
    document.getElementById('pointsToGive').value = 1;
    document.getElementById('pointMessage').value = '';
    document.getElementById('givePointStatus').innerHTML = '';
}

async function executeGivePointFromSection() {
    await executeGivePoint();
}

async function executeGivePoint() {
    const studentId = document.getElementById('selectedStudentId').value;
    const pointsToGive = parseInt(document.getElementById('pointsToGive').value);
    const message = document.getElementById('pointMessage').value.trim();
    const statusElement = document.getElementById('givePointStatus');
    
    if (!studentId || !pointsToGive || pointsToGive <= 0) {
        showGivePointStatus('올바른 학생과 포인트를 입력해주세요.', 'error');
        return;
    }
    
    if (!message) {
        showGivePointStatus('포인트 지급 사유를 입력해주세요.', 'error');
        return;
    }
    
    try {
        showGivePointStatus('포인트 지급 중...', 'info');
        
        // 오늘 날짜 먼저 선언
        const today = new Date().toISOString().split('T')[0];
        
        // Supabase 직접 연결로 포인트 이력 기록
        const client = getSupabaseClient();
        
        // 학생 이름 조회 (동명이인 구분을 위해 학번 포함)
        let studentName = 'Unknown';
        if (client) {
            try {
                const { data: studentData, error: studentError } = await client
                    .from('students')
                    .select('name, studentId')
                    .eq('studentId', studentId)
                    .single();
                
                if (studentData && !studentError) {
                    studentName = `${studentData.name} (${studentData.studentId})`;
                }
            } catch (error) {
                console.warn('[AdminPoints] 학생 정보 조회 오류, 기본값 사용:', error);
            }
        }
        
        if (client) {
            // 포인트 이력 기록
            const historyRecord = {
                id: `teacher_${Date.now()}_${studentId}`,
                student_id: studentId,
                student_name: studentName,
                date: today,
                stage: 0,
                points_earned: pointsToGive,
                activity_time: new Date().toISOString(),
                activity_description: '교사 포인트 지급',
                source_type: 'teacher',
                teacher_message: message,
                notification_sent: false,
                notification_read: false
            };
            
            const { data: historyData, error: historyError } = await client
                .from('point_history')
                .insert([historyRecord]);
                
            if (historyError) {
                console.error('[AdminPoints] 이력 저장 실패:', historyError);
                throw new Error(`이력 저장 실패: ${historyError.message}`);
            }
            
            console.log('[AdminPoints] 포인트 이력 저장 완료');
            
            // daily_points 업데이트 (today는 이미 위에서 선언됨)
            const currentPoint = allStudentPoints.find(p => p.student_id === studentId);
            
            if (currentPoint) {
                // 기존 포인트 업데이트 (최대 20점 제한)
                const newTotalPoints = Math.min(
                    (currentPoint.total_points || 0) + pointsToGive, 
                    20 // 최대 20점으로 제한
                );
                
                const { data: updateData, error: updateError } = await client
                    .from('daily_points')
                    .update({
                        total_points: newTotalPoints,
                        last_activity: new Date().toISOString()
                    })
                    .eq('id', currentPoint.id);
                    
                if (updateError) {
                    throw new Error(`포인트 업데이트 실패: ${updateError.message}`);
                }
                
                console.log('[AdminPoints] 기존 포인트 업데이트 완료');
            } else {
                // 새로운 포인트 레코드 생성
                const newPointRecord = {
                    student_id: studentId,
                    date: today,
                    total_points: pointsToGive,
                    stage1_count: 0,
                    stage2_count: 0,
                    stage3_count: 0,

                    last_activity: new Date().toISOString()
                };
                
                const { data: createData, error: createError } = await client
                    .from('daily_points')
                    .insert([newPointRecord]);
                    
                if (createError) {
                    throw new Error(`포인트 생성 실패: ${createError.message}`);
                }
                
                console.log('[AdminPoints] 새 포인트 레코드 생성 완료');
            }
        } else {
            // Supabase 연결 실패 시 REST API 폴백
            console.log('[AdminPoints] Supabase 연결 실패, REST API 폴백...');
            
            // REST API로 학생 정보 조회
            try {
                const studentResponse = await fetch(`tables/students?studentId=${studentId}`);
                if (studentResponse.ok) {
                    const studentData = await studentResponse.json();
                    if (studentData.data && studentData.data.length > 0) {
                        const student = studentData.data[0];
                        studentName = `${student.name} (${student.studentId})`;
                    }
                }
            } catch (error) {
                console.warn('[AdminPoints] REST API로 학생 정보 조회 오류, 기본값 사용:', error);
            }
            
            // 포인트 이력 기록
            const historyRecord = {
                id: `teacher_${Date.now()}_${studentId}`,
                student_id: studentId,
                student_name: studentName,
                date: today,
                stage: 0,
                points_earned: pointsToGive,
                activity_time: new Date().toISOString(),
                activity_description: '교사 포인트 지급',
                source_type: 'teacher',
                teacher_message: message,
                notification_sent: false,
                notification_read: false
            };
            
            const historyResponse = await fetch('tables/point_history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(historyRecord)
            });
            
            if (!historyResponse.ok) {
                throw new Error(`이력 저장 실패: HTTP ${historyResponse.status}`);
            }
            
            // daily_points 업데이트
            const today = new Date().toISOString().split('T')[0];
            const currentPoint = allStudentPoints.find(p => p.student_id === studentId);
            
            if (currentPoint) {
                // 기존 포인트 업데이트 (최대 20점 제한)
                const newTotalPoints = Math.min(
                    (currentPoint.total_points || 0) + pointsToGive, 
                    20 // 최대 20점으로 제한
                );
                
                const updateResponse = await fetch(`tables/daily_points/${currentPoint.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        total_points: newTotalPoints,
                        last_activity: new Date().toISOString()
                    })
                });
                
                if (!updateResponse.ok) {
                    throw new Error(`포인트 업데이트 실패: HTTP ${updateResponse.status}`);
                }
            } else {
                // 새로운 포인트 레코드 생성
                const newPointRecord = {
                    student_id: studentId,
                    date: today,
                    total_points: pointsToGive,
                    stage1_count: 0,
                    stage2_count: 0,
                    stage3_count: 0,

                    last_activity: new Date().toISOString()
                };
                
                const createResponse = await fetch('tables/daily_points', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newPointRecord)
                });
                
                if (!createResponse.ok) {
                    throw new Error(`포인트 생성 실패: HTTP ${createResponse.status}`);
                }
            }
        }
        
        showGivePointStatus(`${pointsToGive}점 지급 완료!`, 'success');
        
        // UI 새로고침
        setTimeout(async () => {
            await loadAllStudentPoints();
            closeGivePointModal();
        }, 1000);
        
    } catch (error) {
        console.error('[AdminPoints] 포인트 지급 실패:', error);
        showGivePointStatus(`포인트 지급 실패: ${error.message}`, 'error');
    }
}

// ============ 포인트 리셋 기능 ============

async function resetAllPoints() {
    if (!confirm('모든 학생의 오늘 포인트를 0으로 초기화하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
        return;
    }
    
    try {
        showPointsStatus('포인트 초기화 중...', 'info');
        
        const client = getSupabaseClient();
        const today = new Date().toISOString().split('T')[0];
        let resetCount = 0;
        
        if (client && allStudentPoints.length > 0) {
            // Supabase 직접 연결로 일괄 업데이트
            const studentIds = allStudentPoints.map(p => p.student_id);
            
            const { data, error } = await client
                .from('daily_points')
                .update({
                    total_points: 0,
                    stage1_count: 0,
                    stage2_count: 0,
                    stage3_count: 0,
                    last_activity: new Date().toISOString()
                })
                .eq('date', today)
                .in('student_id', studentIds);
                
            if (error) {
                console.error('[AdminPoints] Supabase 리셋 실패:', error);
                throw new Error(`Supabase 리셋 실패: ${error.message}`);
            }
            
            resetCount = allStudentPoints.length;
            console.log('[AdminPoints] Supabase로 포인트 리셋 완료');
        } else {
            // REST API 폴백
            console.log('[AdminPoints] Supabase 연결 실패, REST API 폴백...');
            
            for (const point of allStudentPoints) {
                const response = await fetch(`tables/daily_points/${point.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        total_points: 0,
                        stage1_count: 0,
                        stage2_count: 0,
                        stage3_count: 0,
                        last_activity: new Date().toISOString()
                    })
                });
                
                if (response.ok) {
                    resetCount++;
                }
            }
        }
        
        showPointsStatus(`${resetCount}명의 포인트가 초기화되었습니다.`, 'success');
        
        // UI 새로고침
        setTimeout(() => {
            loadAllStudentPoints();
        }, 1000);
        
    } catch (error) {
        console.error('[AdminPoints] 포인트 초기화 실패:', error);
        showPointsStatus(`포인트 초기화 실패: ${error.message}`, 'error');
    }
}

// ============ 자동 새로고침 ============

function startAutoRefresh() {
    // 기존 인터벌 정리
    if (pointsRefreshInterval) {
        clearInterval(pointsRefreshInterval);
    }
    
    // 5초마다 자동 새로고침
    pointsRefreshInterval = setInterval(async () => {
        try {
            await loadAllStudentPoints();
            console.log('[AdminPoints] 자동 새로고침 완료');
        } catch (error) {
            console.error('[AdminPoints] 자동 새로고침 실패:', error);
        }
    }, 5000);
    
    console.log('[AdminPoints] 자동 새로고침 시작됨 (5초 간격)');
}

function stopAutoRefresh() {
    if (pointsRefreshInterval) {
        clearInterval(pointsRefreshInterval);
        pointsRefreshInterval = null;
        console.log('[AdminPoints] 자동 새로고침 중지됨');
    }
}

// ============ 유틸리티 함수 ============

function showPointsStatus(message, type = 'info') {
    const statusElement = document.getElementById('pointsStatus');
    if (!statusElement) return;
    
    const colors = {
        success: 'text-green-600',
        error: 'text-red-600',
        info: 'text-blue-600'
    };
    
    statusElement.innerHTML = `<span class="${colors[type] || colors.info}">${message}</span>`;
    
    if (type !== 'info') {
        setTimeout(() => {
            if (statusElement) statusElement.innerHTML = '';
        }, 3000);
    }
}

function showGivePointStatus(message, type = 'info') {
    const statusElement = document.getElementById('givePointStatus');
    if (!statusElement) return;
    
    const colors = {
        success: 'text-green-600',
        error: 'text-red-600',
        info: 'text-blue-600'
    };
    
    statusElement.innerHTML = `<span class="${colors[type] || colors.info}">${message}</span>`;
}

// ============ 전역 모듈 노출 ============

console.log('[AdminPoints] 전역 모듈 노출 시작...');
console.log('[AdminPoints] initializePointsModule 함수:', typeof initializePointsModule);

window.pointsModule = {
    initialize: initializePointsModule,
    loadAllStudentPoints: loadAllStudentPoints,
    executeGivePoint: executeGivePoint,
    resetAllPoints: resetAllPoints,
    startAutoRefresh: startAutoRefresh,
    stopAutoRefresh: stopAutoRefresh,
    openGivePointSection: openGivePointSection,
    closeGivePointSection: closeGivePointSection,
    executeGivePointFromSection: executeGivePointFromSection
};

// 편의 함수 추가
async function givePointToStudent(studentId, points, message = '') {
    try {
        console.log(`[AdminPoints] givePointToStudent 호출: ${studentId}, ${points}점, "${message}"`);
        
        const client = getSupabaseClient();
        
        if (client) {
            // 포인트 이력 기록
            const today = new Date().toISOString().split('T')[0];
            
            // 학생 정보 조회 (동명이인 구분을 위해 학번 포함)
            const { data: studentData, error: studentError } = await client
                .from('students')
                .select('name, studentId')
                .eq('studentId', studentId)
                .single();
            
            const studentName = studentData ? `${studentData.name} (${studentData.studentId})` : 'Unknown';
            
            const historyRecord = {
                id: `teacher_${Date.now()}_${studentId}`,
                student_id: studentId,
                student_name: studentName,
                date: today,
                stage: 0,
                points_earned: points,
                activity_time: new Date().toISOString(),
                activity_description: '교사 포인트 지급',
                source_type: 'teacher',
                teacher_message: message,
                notification_sent: false,
                notification_read: false
            };
            
            const { data: historyData, error: historyError } = await client
                .from('point_history')
                .insert([historyRecord]);
                
            if (historyError) {
                throw new Error(`이력 저장 실패: ${historyError.message}`);
            }
            
            // daily_points 업데이트
            const currentPoint = allStudentPoints.find(p => p.student_id === studentId);
            
            if (currentPoint) {
                const newTotalPoints = Math.min(
                    (currentPoint.total_points || 0) + points, 
                    20
                );
                
                const { data: updateData, error: updateError } = await client
                    .from('daily_points')
                    .update({
                        total_points: newTotalPoints,
                        last_activity: new Date().toISOString()
                    })
                    .eq('id', currentPoint.id);
                    
                if (updateError) {
                    throw new Error(`포인트 업데이트 실패: ${updateError.message}`);
                }
            } else {
                // 새로운 포인트 레코드 생성
                const newPointRecord = {
                    student_id: studentId,
                    student_name: `학생 ${studentId}`,
                    class_info: '미확인',
                    date: today,
                    total_points: Math.min(points, 20),
                    stage1_count: 0,
                    stage2_count: 0,
                    stage3_count: 0,
                    last_activity: new Date().toISOString()
                };
                
                const { data: createData, error: createError } = await client
                    .from('daily_points')
                    .insert([newPointRecord]);
                    
                if (createError) {
                    throw new Error(`포인트 생성 실패: ${createError.message}`);
                }
            }
            
            console.log('[AdminPoints] 포인트 지급 완료');
            return true;
        } else {
            throw new Error('Supabase 연결 실패');
        }
    } catch (error) {
        console.error('[AdminPoints] 포인트 지급 실패:', error);
        throw error;
    }
}

// 모듈에 givePointToStudent 추가
window.pointsModule.givePointToStudent = givePointToStudent;

console.log('[AdminPoints] window.pointsModule 설정 완료:', !!window.pointsModule);
console.log('[AdminPoints] 사용 가능한 함수들:', Object.keys(window.pointsModule));
console.log('[AdminPoints] 전역 모듈 노출 완료');

// ============ 일일 자동 리셋 (자정) ============

function initializeDailyReset() {
    // 다음 자정까지의 시간 계산
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0); // 자정으로 설정
    
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    
    console.log(`[AdminPoints] 다음 자동 리셋까지: ${Math.round(timeUntilMidnight / 1000 / 60 / 60)}시간 ${Math.round((timeUntilMidnight / 1000 / 60) % 60)}분`);
    
    // 자정에 자동 리셋 실행
    setTimeout(() => {
        console.log('[AdminPoints] 일일 자동 포인트 리셋 실행');
        resetAllPoints();
        
        // 다음날을 위해 24시간 후 다시 설정
        setTimeout(() => {
            initializeDailyReset();
        }, 24 * 60 * 60 * 1000);
        
    }, timeUntilMidnight);
}

// ============ 모듈 익스포트 ============

// 🔥 오류 수정: 정의되지 않은 함수들 제거
// window.openGivePointModal = openGivePointModal; // 정의되지 않음
// window.closeGivePointModal = closeGivePointModal; // 정의되지 않음
window.executeGivePoint = executeGivePoint;

window.pointsModule = {
    initialize: initializePointsModule,
    loadPoints: loadAllStudentPoints,
    resetPoints: resetAllPoints,
    givePoint: executeGivePoint,
    startRefresh: startAutoRefresh,
    stopRefresh: stopAutoRefresh
};

console.log('[AdminPoints] 포인트 관리 모듈 준비 완료');