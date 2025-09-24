// Admin Messages Module for Teacher Message System
// 관리자 메시지 전송 및 관리 모듈

// ============ GLOBAL VARIABLES ============
let currentStudentsMessagesMessages = []; // 현재 로드된 학생 목록 (메시지용)
let messageHistory = []; // 메시지 이력
let replyHistory = []; // 답장 이력

// ============ MODULE INITIALIZATION ============
async function initializeMessagesModule() {
    console.log('[Messages] 모듈 초기화 시작');
    
    try {
        // 학생 목록 로드
        await loadStudentsList();
        
        // 메시지 이력 로드
        await loadMessageHistory();
        
        console.log('[Messages] 모듈 초기화 완료');
        return true;
    } catch (error) {
        console.error('[Messages] 모듈 초기화 실패:', error);
        return false;
    }
}

// ============ STUDENT LIST MANAGEMENT ============
async function loadStudentsList() {
    console.log('[Messages] 학생 목록 로드 시작');
    try {
        // 🔄 임시 복구: supabaseAPI 사용 가능할 때만 시도
        if (typeof supabaseAPI !== 'undefined' && supabaseAPI.students) {
            console.log('[Messages] Supabase API 호출: supabaseAPI.students.getAll()');
            currentStudentsMessages = await supabaseAPI.students.getAll();
            console.log(`[Messages] Supabase로 학생 목록 로드 완료: ${currentStudentsMessages.length}명`);
        } else {
            // 폴백: 기존 REST API 방식 사용
            console.log('[Messages] supabaseAPI 없음, REST API 폴백 사용');
            const response = await fetch('tables/students?limit=1000');
            console.log(`[Messages] REST API 응답 상태: ${response.status}`);
            
            if (response.ok) {
                const result = await response.json();
                currentStudentsMessages = result.data || [];
                console.log(`[Messages] REST API로 학생 목록 로드 완료: ${currentStudentsMessages.length}명`);
            } else {
                throw new Error(`REST API 오류: ${response.status}`);
            }
        }
        
        console.log('[Messages] 첫 번째 학생 예시:', currentStudentsMessages[0]);
        
        if (currentStudentsMessages.length > 0) {
            // 학급 정보도 확인  
            const sampleStudent = currentStudentsMessages[0];
            console.log(`[Messages] 학생 필드 확인 - student_id: ${sampleStudent.student_id}, studentId: ${sampleStudent.studentId}, id: ${sampleStudent.id}`);
            console.log(`[Messages] 학급 필드 확인 - full_class: ${sampleStudent.full_class}, fullClass: ${sampleStudent.fullClass}, grade-classNum: ${sampleStudent.grade}-${sampleStudent.classNum}`);
        }
    } catch (error) {
        console.error('[Messages] 학생 목록 로드 실패:', error);
        // 폴백: localStorage에서 로드
        const localStudents = localStorage.getItem('students');
        console.log(`[Messages] localStorage에서 폴백 시도: ${localStudents ? '있음' : '없음'}`);
        currentStudentsMessages = JSON.parse(localStudents || '[]');
        console.log(`[Messages] 폴백 후 학생 수: ${currentStudentsMessages.length}`);
    }
    
    // 학생 목록 UI 업데이트
    console.log('[Messages] UI 업데이트 시작...');
    updateStudentSelectionUI();
}

// ============ MESSAGE SENDING FUNCTIONS ============

// 개별 학생에게 메시지 전송
async function sendIndividualMessage(studentId, studentName, message) {
    const messageData = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sender_type: 'teacher',
        sender_id: 'admin',
        sender_name: '선생님',
        recipient_id: studentId,
        recipient_name: studentName,
        message: message,
        sent_at: new Date().toISOString(),
        read_at: null,
        is_read: false,
        reply_to: null
    };

    try {
        // 🔥 Supabase 직접 호출로 전환
        if (typeof supabaseClient !== 'undefined') {
            const { data, error } = await supabaseClient
                .from('teacher_messages')
                .insert([messageData])
                .select()
                .single();
                
            if (error) throw error;
            console.log(`[Messages] Supabase로 개별 메시지 전송 성공: ${studentName}(${studentId})`);
            return true;
        } else {
            // 폴백: smartFetch 사용
            const response = await smartFetch('tables/teacher_messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(messageData)
            });

            if (response.ok) {
                console.log(`[Messages] REST API로 개별 메시지 전송 성공: ${studentName}(${studentId})`);
                return true;
            } else {
                throw new Error(`메시지 전송 API 오류: ${response.status}`);
            }
        }
    } catch (error) {
        console.error(`[Messages] 개별 메시지 전송 실패: ${error.message}`);
        return false;
    }
}

// 학급별 일괄 메시지 전송
async function sendClassMessage(targetClass, message) {
    const classStudents = currentStudentsMessages.filter(student => {
        const studentClass = student.full_class || student.fullClass || `${student.grade}-${student.classNum}`;
        return studentClass === targetClass;
    });

    if (classStudents.length === 0) {
        throw new Error(`${targetClass} 학급에 등록된 학생이 없습니다.`);
    }

    let successCount = 0;
    let failCount = 0;

    for (const student of classStudents) {
        const success = await sendIndividualMessage(
            student.student_id || student.studentId || student.id,
            student.name,
            message
        );
        
        if (success) {
            successCount++;
        } else {
            failCount++;
        }
        
        // API 과부하 방지를 위한 짧은 지연
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`[Messages] 학급별 전송 완료: 성공 ${successCount}명, 실패 ${failCount}명`);
    return { successCount, failCount, totalCount: classStudents.length };
}

// 전체 학생 일괄 메시지 전송
async function sendAllStudentsMessage(message) {
    if (currentStudentsMessages.length === 0) {
        throw new Error('등록된 학생이 없습니다.');
    }

    let successCount = 0;
    let failCount = 0;

    for (const student of currentStudentsMessages) {
        const success = await sendIndividualMessage(
            student.student_id || student.studentId || student.id,
            student.name,
            message
        );
        
        if (success) {
            successCount++;
        } else {
            failCount++;
        }
        
        // API 과부하 방지를 위한 짧은 지연
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`[Messages] 전체 전송 완료: 성공 ${successCount}명, 실패 ${failCount}명`);
    return { successCount, failCount, totalCount: currentStudentsMessages.length };
}

// ============ MESSAGE HISTORY MANAGEMENT ============
async function loadMessageHistory() {
    try {
        // 🔥 Supabase 직접 호출로 전환
        if (typeof supabaseClient !== 'undefined') {
            const { data, error } = await supabaseClient
                .from('teacher_messages')
                .select('*')
                .order('sent_at', { ascending: false })
                .limit(100);
                
            if (error) throw error;
            messageHistory = data || [];
            console.log(`[Messages] Supabase로 메시지 이력 로드 완료: ${messageHistory.length}개`);
        } else {
            // 폴백: smartFetch 사용
            const response = await smartFetch('tables/teacher_messages?limit=100');
        
            if (response.ok) {
                const result = await response.json();
                messageHistory = result.data || [];
                console.log(`[Messages] REST API로 메시지 이력 로드 완료: ${messageHistory.length}개`);
            } else {
                throw new Error(`메시지 이력 API 오류: ${response.status}`);
            }
        }
    } catch (error) {
        console.error('[Messages] 메시지 이력 로드 실패:', error);
        messageHistory = [];
    }
}

// ============ UI UPDATE FUNCTIONS ============
function updateStudentSelectionUI() {
    console.log(`[Messages] UI 업데이트 시작 - 학생 수: ${currentStudentsMessages.length}`);
    
    // 개별 학생 선택 드롭다운 업데이트
    const individualSelect = document.getElementById('individualStudentSelect');
    console.log(`[Messages] individualSelect 요소:`, individualSelect);
    if (individualSelect) {
        const options = currentStudentsMessages.map(student => {
            const studentId = student.student_id || student.studentId || student.id;
            console.log(`[Messages] 학생 데이터: ID=${studentId}, Name=${student.name}`);
            return `<option value="${studentId}" data-name="${student.name}">${student.name} (${studentId})</option>`;
        });
        individualSelect.innerHTML = '<option value="">학생을 선택하세요</option>' + options.join('');
        console.log(`[Messages] 개별 학생 드롭다운 업데이트 완료: ${options.length}개 옵션`);
    } else {
        console.warn('[Messages] individualStudentSelect 요소를 찾을 수 없음');
    }

    // 학급별 선택 드롭다운 업데이트
    const classSelect = document.getElementById('classSelect');
    console.log(`[Messages] classSelect 요소:`, classSelect);
    if (classSelect) {
        // 학급 목록 추출 (중복 제거)
        const classes = [...new Set(currentStudentsMessages.map(student => {
            const fullClass = student.full_class || student.fullClass || `${student.grade}-${student.classNum}`;
            console.log(`[Messages] 학생 ${student.name}의 학급: ${fullClass}`);
            return fullClass;
        }))].filter(cls => cls && cls !== 'undefined-undefined').sort();

        console.log(`[Messages] 추출된 학급 목록:`, classes);
        classSelect.innerHTML = '<option value="">학급을 선택하세요</option>' +
            classes.map(cls => `<option value="${cls}">${cls}</option>`).join('');
        console.log(`[Messages] 학급 드롭다운 업데이트 완료: ${classes.length}개 학급`);
    } else {
        console.warn('[Messages] classSelect 요소를 찾을 수 없음');
    }

    // 전체 학생 수 업데이트
    const totalStudentsCount = document.getElementById('totalStudentsCount');
    console.log(`[Messages] totalStudentsCount 요소:`, totalStudentsCount);
    if (totalStudentsCount) {
        totalStudentsCount.textContent = currentStudentsMessages.length;
        console.log(`[Messages] 전체 학생 수 업데이트: ${currentStudentsMessages.length}명`);
    } else {
        console.warn('[Messages] totalStudentsCount 요소를 찾을 수 없음');
    }
    
    console.log('[Messages] UI 업데이트 완료');
}

// ============ MESSAGE SENDING UI HANDLERS ============

// 개별 메시지 전송 핸들러
async function handleIndividualMessageSend() {
    const selectElement = document.getElementById('individualStudentSelect');
    const messageElement = document.getElementById('individualMessage');
    const statusElement = document.getElementById('individualSendStatus');

    const studentId = selectElement.value;
    const studentName = selectElement.options[selectElement.selectedIndex]?.dataset?.name;
    const message = messageElement.value.trim();

    // 입력 검증
    if (!studentId) {
        showStatus(statusElement, '학생을 선택해주세요.', 'error');
        return;
    }

    if (!message) {
        showStatus(statusElement, '메시지를 입력해주세요.', 'error');
        return;
    }

    try {
        showStatus(statusElement, '메시지 전송 중...', 'info');
        
        const success = await sendIndividualMessage(studentId, studentName, message);
        
        if (success) {
            showStatus(statusElement, `${studentName}에게 메시지를 전송했습니다.`, 'success');
            messageElement.value = ''; // 메시지 입력창 초기화
        } else {
            showStatus(statusElement, '메시지 전송에 실패했습니다.', 'error');
        }
    } catch (error) {
        showStatus(statusElement, `오류: ${error.message}`, 'error');
    }
}

// 학급별 메시지 전송 핸들러
async function handleClassMessageSend() {
    const selectElement = document.getElementById('classSelect');
    const messageElement = document.getElementById('classMessage');
    const statusElement = document.getElementById('classSendStatus');

    const targetClass = selectElement.value;
    const message = messageElement.value.trim();

    // 입력 검증
    if (!targetClass) {
        showStatus(statusElement, '학급을 선택해주세요.', 'error');
        return;
    }

    if (!message) {
        showStatus(statusElement, '메시지를 입력해주세요.', 'error');
        return;
    }

    try {
        showStatus(statusElement, '학급별 메시지 전송 중...', 'info');
        
        const result = await sendClassMessage(targetClass, message);
        
        showStatus(statusElement, 
            `${targetClass} 학급 전송 완료: 성공 ${result.successCount}명 / 전체 ${result.totalCount}명`, 
            result.failCount > 0 ? 'warning' : 'success'
        );
        
        messageElement.value = ''; // 메시지 입력창 초기화
    } catch (error) {
        showStatus(statusElement, `오류: ${error.message}`, 'error');
    }
}

// 전체 학생 메시지 전송 핸들러
async function handleAllStudentsMessageSend() {
    const messageElement = document.getElementById('allStudentsMessage');
    const statusElement = document.getElementById('allStudentsSendStatus');

    const message = messageElement.value.trim();

    // 입력 검증
    if (!message) {
        showStatus(statusElement, '메시지를 입력해주세요.', 'error');
        return;
    }

    // 확인 대화상자
    if (!confirm(`전체 학생 ${currentStudentsMessages.length}명에게 메시지를 전송하시겠습니까?`)) {
        return;
    }

    try {
        showStatus(statusElement, '전체 학생에게 메시지 전송 중...', 'info');
        
        const result = await sendAllStudentsMessage(message);
        
        showStatus(statusElement, 
            `전체 전송 완료: 성공 ${result.successCount}명 / 전체 ${result.totalCount}명`, 
            result.failCount > 0 ? 'warning' : 'success'
        );
        
        messageElement.value = ''; // 메시지 입력창 초기화
    } catch (error) {
        showStatus(statusElement, `오류: ${error.message}`, 'error');
    }
}

// ============ UTILITY FUNCTIONS ============
function showStatus(element, message, type = 'info') {
    if (!element) return;
    
    const colors = {
        info: 'text-blue-600 bg-blue-50 border-blue-200',
        success: 'text-green-600 bg-green-50 border-green-200',
        warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
        error: 'text-red-600 bg-red-50 border-red-200'
    };
    
    element.className = `mt-2 p-2 rounded border text-sm ${colors[type] || colors.info}`;
    element.textContent = message;
    
    // 성공/에러 메시지는 5초 후 자동 제거
    if (type === 'success' || type === 'error') {
        setTimeout(() => {
            element.textContent = '';
            element.className = 'mt-2 text-xs';
        }, 5000);
    }
}

// ============ MODULE EXPORT ============
// 전역 함수로 노출 (admin-v2.html에서 사용)
window.messagesModule = {
    initialize: initializeMessagesModule,
    sendIndividual: handleIndividualMessageSend,
    sendClass: handleClassMessageSend,
    sendAllStudents: handleAllStudentsMessageSend,
    refreshStudents: loadStudentsList,
    get currentStudentsMessages() {
        return currentStudentsMessages;
    }
};

console.log('[Messages] 모듈 로드 완료');