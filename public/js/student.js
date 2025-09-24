// Student JavaScript for Role Assignment System

// Note: Global variables (currentStudent, currentAssignment, assignments, sessions) 
// are already declared in main.js

// ============ STAGE SETTINGS VARIABLES ============
let stageSettingsUpdateInterval = null;

// Supabase 직접 초기화 - 무한 루프 완전 제거
// supabaseClient는 이미 supabase-api.js에서 선언됨
let supabaseAPIReady = false;

// 글로벌 Supabase 클라이언트 사용 함수
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
            console.log('[Student] 폴백 Supabase 초기화 성공');
            return client;
        } catch (error) {
            console.error('[Student] 폴백 Supabase 초기화 실패:', error);
            return null;
        }
    }
    
    return null;
}

// ============ BOARD MANAGEMENT VARIABLES ============
let boardUpdateInterval = null;

// ============ PERSONAL MESSAGE VARIABLES ============
let personalMessages = [];
let currentReplyMessage = null;
let messageCheckInterval = null;

// DOM 로드 후 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('[Student] DOM 로드, 학생 시스템 기다리는 중...');
    
    // Supabase 초기화 이벤트 대기
    window.addEventListener('supabaseInitialized', function(event) {
        console.log('[Student] Received supabaseInitialized event');
        supabaseAPIReady = true;
        
        // 학생 시스템 시작
        initializeStudent();
        checkURLParameters();
        checkSavedLogin();
    });
    
    // 3초 후에도 초기화 안된 경우 로컬 모드로 시작
    setTimeout(() => {
        if (!supabaseAPIReady) {
            console.warn('[Student] Supabase 초기화 타임아웃 - 로컬 모드로 진행');
            initializeStudent();
            checkURLParameters();
            checkSavedLogin();
        }
    }, 3000);
    
    // 페이지 종료 시 정리
    window.addEventListener('beforeunload', () => {
        stopPointRefresh();
    });
});

// Initialize student interface
function initializeStudent() {
    // Initialize learning guides schema only if function exists
    if (typeof initializeLearningGuidesSchema === 'function') {
        try {
            initializeLearningGuidesSchema();
        } catch (error) {
            console.log('Learning guides schema initialization skipped:', error.message);
        }
    }
    
    // Load data from localStorage or API
    loadAssignments();
    loadSessions();
    
    // Load stage settings for dynamic descriptions
    loadStageSettings();
    
    // Setup enter key for login (with safety check)
    const loginStudentId = document.getElementById('loginStudentId');
    if (loginStudentId) {
        loginStudentId.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const loginStudentName = document.getElementById('loginStudentName');
                if (loginStudentName) {
                    loginStudentName.focus();
                }
            }
        });
    }
}

// Check URL parameters for student info
function checkURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const studentId = urlParams.get('studentId');
    const studentName = urlParams.get('studentName');
    const autoFix = urlParams.get('autoFix'); // 자동 assignment 수정 플래그
    
    if (studentId && studentName) {
        // Auto-fill the form
        document.getElementById('loginStudentId').value = studentId;
        document.getElementById('loginStudentName').value = studentName;
        
        // Auto-submit the form
        setTimeout(() => {
            // Directly call studentLogin function
            studentLogin({ preventDefault: () => {} });
            
            // 자동 assignment 수정이 요청된 경우
            if (autoFix === 'true') {
                console.log('🔧 [Auto Fix] URL 파라미터에서 자동 수정 요청됨');
                
                // 로그인 완료 후 자동 수정 실행 (5초 대기)
                setTimeout(async () => {
                    console.log('🔧 [Auto Fix] 자동 assignment 수정 시작...');
                    try {
                        const result = await window.debugFixAssignment(studentId);
                        if (result) {
                            console.log('🎉 [Auto Fix] assignment 수정 완료!');
                            // 플립카드 테스트를 위해 자동으로 뒤집기
                            setTimeout(() => {
                                console.log('🔄 [Auto Fix] 플립카드 자동 테스트...');
                                flipCard();
                            }, 2000);
                        }
                    } catch (error) {
                        console.error('❌ [Auto Fix] 자동 수정 실패:', error);
                    }
                }, 5000);
            }
        }, 100);
    }
}

// Check if student is already logged in
function checkSavedLogin() {
    const savedStudent = sessionStorage.getItem('currentStudent');
    if (savedStudent) {
        try {
            currentStudent = JSON.parse(savedStudent);
            
            // Validate the parsed student object
            if (!currentStudent || !currentStudent.studentId || !currentStudent.name) {
                console.log('Invalid saved student data, clearing session storage');
                sessionStorage.removeItem('currentStudent');
                currentStudent = null;
                return;
            }
            
            console.log('Restored student from session storage:', currentStudent.studentId, currentStudent.name);
            showRole();
            
            // Start teacher point notification check for saved login
            startTeacherPointNotificationCheck();
            
            // Start personal message check for saved login
            startPersonalMessageCheck();
            
            // 승인 시스템 완전 제거됨
            console.log('[롤백] 승인 시스템이 완전 제거되어 Stage 3은 이제 직접 완료됩니다.');
        } catch (error) {
            console.log('Error parsing saved student data:', error);
            sessionStorage.removeItem('currentStudent');
            currentStudent = null;
        }
    } else {
        console.log('No saved student found in session storage');
    }
}

// Student login
async function studentLogin(event) {
    event.preventDefault();
    
    const studentId = document.getElementById('loginStudentId').value.trim();
    const studentName = document.getElementById('loginStudentName').value.trim();
    
    if (!studentId || !studentName) {
        showError('학번과 이름을 모두 입력해주세요.');
        return;
    }
    
    if (!/^\d{4}$/.test(studentId)) {
        showError('학번은 4자리 숫자여야 합니다.');
        return;
    }
    
    // Show loading
    showLoading();
    
    // Parse and validate student ID
    const parsedId = window.parseStudentId(studentId);
    if (!parsedId) {
        hideLoading();
        showError('잘못된 학번 형식입니다.');
        return;
    }
    
    if (parsedId.error) {
        hideLoading();
        showError(parsedId.error);
        return;
    }
    
    // Store student info with class information
    currentStudent = {
        id: studentId,  // 학습안내에서 사용될 id 속성 추가
        studentId: studentId,
        name: studentName,
        grade: parsedId.grade,
        classNum: parsedId.class,
        number: parsedId.number,
        fullClass: parsedId.fullClass
    };
    
    // Save to session storage
    sessionStorage.setItem('currentStudent', JSON.stringify(currentStudent));
    
    // Auto-register student
    await autoRegisterStudent();
    
    // Check for assignment
    await checkStudentAssignment();
    
    // SimplePoint 시스템 초기화 - 로그인 즉시!
    if (window.initializePointSystem) {
        console.log('[Student] SimplePoint 초기화 호출');
        await window.initializePointSystem(currentStudent);
    }
    
    // Start teacher point notification check
    startTeacherPointNotificationCheck();
    
    // Start personal message check
    startPersonalMessageCheck();
    
    // Start point auto-refresh
    startPointRefresh();
    
    // Initialize learning guide system
    initializeLearningGuideSystem();
    
    // Show success message and transition
    showLoginSuccess();
    
    // Hide loading and show main interface after a brief delay
    setTimeout(() => {
        hideLoading();
        showRole();
    }, 1000);
}

// Auto-register student on login - Supabase 직접 사용
async function autoRegisterStudent() {
    console.log('[AutoRegister] Supabase 직접 사용하여 학생 등록 시작:', currentStudent);
    
    if (!currentStudent || !currentStudent.studentId) {
        console.error('[AutoRegister] No current student data!');
        return;
    }
    
    try {
        // Supabase 직접 사용하여 학생 데이터 확인
        const client = getSupabaseClient();
        if (client) {
            console.log('[AutoRegister] Supabase에서 학생 데이터 확인 중...');
            
            // 현재 학생이 이미 등록되어 있는지 확인
            const { data: existingStudent, error: searchError } = await client
                .from('students')
                .select('*')
                .eq('student_id', currentStudent.studentId)
                .single();
                
            if (searchError && searchError.code !== 'PGRST116') {
                console.error('[AutoRegister] Supabase 검색 오류:', searchError);
            }
            
            if (!existingStudent) {
                console.log('[AutoRegister] 새 학생 Supabase에 등록:', currentStudent.studentId);
                
                // 🔥 DEBUG: 저장할 데이터 확인
                console.log('[AutoRegister] 저장할 학생 데이터:', {
                    student_id: String(currentStudent.studentId),
                    name: currentStudent.name,
                    full_class: currentStudent.fullClass,
                    grade: currentStudent.grade,
                    class_num: currentStudent.classNum,
                    number: currentStudent.number
                });
                
                // Supabase에 새 학생 등록 (필드명 표준화)
                const { data: newStudent, error: insertError } = await client
                    .from('students')
                    .insert([
                        {
                            student_id: String(currentStudent.studentId), // 문자열로 강제 변환
                            name: currentStudent.name,
                            full_class: currentStudent.fullClass, // 🔥 중요: fullClass 값이 제대로 전달되어야 함
                            grade: currentStudent.grade,
                            class_num: currentStudent.classNum, // 수정: class_number → class_num
                            number: currentStudent.number
                        }
                    ]);
                    
                if (insertError) {
                    console.error('[AutoRegister] Supabase 삽입 오류:', insertError);
                } else {
                    console.log('[AutoRegister] Supabase 등록 성공:', newStudent);
                }
            } else {
                console.log('[AutoRegister] 기존 학생 확인:', existingStudent);
            }
        }
        
        // localStorage도 동시에 업데이트 (백업용)
        let students = JSON.parse(localStorage.getItem('students') || '[]');
        console.log('[AutoRegister] localStorage 현재 학생 수:', students.length);
        
        const existingLocalStudent = students.find(s => s.studentId === currentStudent.studentId);
        
        if (!existingLocalStudent) {
            console.log('[AutoRegister] localStorage에 새 학생 등록:', currentStudent.studentId);
            
            // Register new student
            const newStudent = {
                id: `${currentStudent.studentId}_${Date.now()}`,
                studentId: currentStudent.studentId,
                name: currentStudent.name,
                grade: currentStudent.grade,
                class: currentStudent.classNum,  // admin expects 'class' not 'classNum'
                classNum: currentStudent.classNum,
                number: currentStudent.number,
                fullClass: currentStudent.fullClass,
                class_info: currentStudent.fullClass,
                lastLogin: new Date().toISOString(),
                addedAt: new Date().toISOString(),
                registered: true,
                autoRegistered: true
            };
            
            // Always save to localStorage first
            students.push(newStudent);
            localStorage.setItem('students', JSON.stringify(students));
            console.log('[AutoRegister] Student saved to localStorage. Total students:', students.length);
            
            // Supabase에 이미 저장됨 (위에서 처리됨)
            console.log('[AutoRegister] localStorage 및 Supabase 등록 완료');
        } else {
            console.log('[AutoRegister] 기존 학생 localStorage 업데이트:', currentStudent.studentId);
            
            // Update existing student (name or lastLogin)
            existingLocalStudent.name = currentStudent.name;
            existingLocalStudent.lastLogin = new Date().toISOString();
            existingLocalStudent.lastUpdated = new Date().toISOString();
            
            // Update in localStorage
            const index = students.findIndex(s => s.studentId === currentStudent.studentId);
            if (index !== -1) {
                students[index] = existingLocalStudent;
                localStorage.setItem('students', JSON.stringify(students));
                console.log('[AutoRegister] Updated existing student in localStorage');
            }
        }
        
        // 공통: 오늘 로그인 기록 추가
        let todayLogins = JSON.parse(localStorage.getItem('todayLogins') || '[]');
        if (!todayLogins.includes(currentStudent.studentId)) {
            todayLogins.push(currentStudent.studentId);
            localStorage.setItem('todayLogins', JSON.stringify(todayLogins));
        }
        
        // 공통: 관리자 페이지 업데이트 트리거
        localStorage.setItem('studentUpdateTrigger', Date.now().toString());
        console.log('[AutoRegister] 업데이트 트리거 설정 완료');
    } catch (error) {
        console.error('Error in auto-registration:', error);
    }
}

// Load assignments - Supabase 직접 사용
async function loadAssignments() {
    console.log('[LoadAssignments] Supabase 직접 사용하여 배정 로드 시작');
    
    try {
        // Supabase 직접 호출
        const client = getSupabaseClient();
        if (client) {
            console.log('[LoadAssignments] Supabase에서 assignments 테이블 조회 중...');
            
            const { data: supabaseAssignments, error } = await client
                .from('assignments')
                .select('*')
                .order('created_at', { ascending: false });
                
            if (error) {
                console.error('[LoadAssignments] Supabase 오류:', error);
                throw error;
            }
            
            assignments = supabaseAssignments || [];
            console.log('[LoadAssignments] Supabase에서 로드 완료:', assignments.length, '개 배정');
            
            if (assignments.length > 0) {
                console.log('[LoadAssignments] 첫 번째 배정 예시:', assignments[0]);
            }
            
            return;
        }
        
        throw new Error('Supabase client not available');
        
    } catch (error) {
        console.log('[LoadAssignments] Supabase 실패, localStorage 사용:', error.message);
        
        // localStorage 폴백
        assignments = JSON.parse(localStorage.getItem('assignments') || '[]');
        
        // classAssignments도 함께 로드
        const classAssignments = JSON.parse(localStorage.getItem('classAssignments') || '{}');
        Object.values(classAssignments).forEach(ca => {
            if (!assignments.find(a => a.id === ca.id)) {
                assignments.push(ca);
            }
        });
    }
    
    console.log('[LoadAssignments] 최종 배정 수:', assignments.length);
}

// Load sessions - Supabase 직접 사용
async function loadSessions() {
    console.log('[LoadSessions] Supabase 직접 사용하여 세션 로드 시작');
    
    try {
        const client = getSupabaseClient();
        if (client) {
            console.log('[LoadSessions] Supabase에서 sessions 테이블 조회 중...');
            
            const { data: supabaseSessions, error } = await client
                .from('sessions')
                .select('*')
                .order('created_at', { ascending: false });
                
            if (error) {
                console.error('[LoadSessions] Supabase 오류:', error);
                throw error;
            }
            
            sessions = supabaseSessions || [];
            console.log('[LoadSessions] Supabase에서 로드 완료:', sessions.length, '개 세션');
            
            return;
        }
        
        throw new Error('Supabase client not available');
        
    } catch (error) {
        console.log('[LoadSessions] Supabase 실패, localStorage 사용:', error.message);
        // localStorage 폴백
        sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
        console.log('[LoadSessions] localStorage에서 로드:', sessions.length, '개 세션');
    }
}

// Check if student has an assignment
async function checkStudentAssignment() {
    // Reload assignments to get latest data
    await loadAssignments();
    
    // Load sessions for displaying assignment details
    await loadSessions();
    
    console.log('🔍 [Assignment Check] 현재 학생 정보:', currentStudent);
    console.log('🔍 [Assignment Check] 전체 assignments:', assignments.length, '개');
    
    // 데이터 구조 상세 분석
    if (assignments.length > 0) {
        console.log('🔍 [Assignment Check] 첫 번째 배정 예시:', assignments[0]);
        console.log('🔍 [Assignment Check] 배정 필드들:', Object.keys(assignments[0]));
        
        // 모든 배정의 학생 ID 확인
        const allStudentIds = assignments.map(a => a.student_id || a.studentId).filter(Boolean);
        const uniqueStudentIds = [...new Set(allStudentIds)];
        console.log('🔍 [Assignment Check] DB의 모든 학생 ID들:', uniqueStudentIds);
        console.log('🔍 [Assignment Check] 현재 로그인 학생 ID:', currentStudent.studentId);
        console.log('🔍 [Assignment Check] ID 타입 - 현재:', typeof currentStudent.studentId, '/ DB:', typeof allStudentIds[0]);
    }
    
    // 🔥 NEW: 관리자가 생성한 배정 데이터에서 직접 찾기
    let studentAssignments = assignments.filter(a => {
        // 학생 ID와 상태가 active인 배정만 찾기 (Supabase에서는 student_id 필드 사용)
        const studentIdFromDB = a.student_id || a.studentId; // Supabase는 student_id, localStorage는 studentId
        const isForThisStudent = studentIdFromDB === currentStudent.studentId;
        const isActive = !a.status || a.status === 'active';
        
        console.log('🔍 [Assignment Filter]', {
            assignmentId: a.id,
            studentIdFromDB: studentIdFromDB,
            originalStudentId: a.studentId,
            dbStudentId: a.student_id,
            currentStudentId: currentStudent.studentId,
            isForThisStudent,
            status: a.status,
            isActive,
            match: isForThisStudent && isActive,
            // 타입 비교도 추가
            studentIdType: typeof studentIdFromDB,
            currentIdType: typeof currentStudent.studentId,
            strictEqual: studentIdFromDB === currentStudent.studentId,
            looseEqual: studentIdFromDB == currentStudent.studentId
        });
        
        return isForThisStudent && isActive;
    });
    
    console.log('🎯 [Assignment Check] 직접 배정 찾기 결과:', studentAssignments.length, '개');
    
    // 🔍 배정 데이터 상세 로깅
    if (studentAssignments.length > 0) {
        studentAssignments.forEach((assignment, index) => {
            console.log(`🔍 [Assignment ${index}]`, {
                id: assignment.id,
                studentId: assignment.studentId,
                roleName: assignment.roleName,
                roleType: assignment.roleType,
                roleContent: assignment.roleContent ? assignment.roleContent.substring(0, 100) + '...' : 'null',
                sessionName: assignment.sessionName
            });
        });
    }
    
    // 🔥 배정이 없으면 반별 배정도 확인 (기존 로직 유지)
    if (studentAssignments.length === 0) {
        console.log('🔍 [Assignment Check] 반별 배정 확인 중... fullClass:', currentStudent.fullClass);
        
        const classAssignments = assignments.filter(a => {
            const targetClassFromDB = a.target_class || a.targetClass; // Supabase는 target_class, localStorage는 targetClass
            const classMatch = targetClassFromDB === currentStudent.fullClass;
            const statusMatch = !a.status || a.status === 'active';
            
            console.log('🔍 [Class Filter]', {
                assignmentId: a.id,
                targetClassFromDB: targetClassFromDB,
                originalTargetClass: a.targetClass,
                dbTargetClass: a.target_class,
                currentFullClass: currentStudent.fullClass,
                classMatch: classMatch,
                statusMatch: statusMatch
            });
            
            return classMatch && statusMatch;
        });
        
        console.log('🎯 [Assignment Check] 반별 배정 결과:', classAssignments.length, '개');
        
        if (classAssignments.length > 0) {
            // 반별 배정을 개별 학생 배정으로 변환 (기존 로직 유지)
            const classAssignment = classAssignments[classAssignments.length - 1];
            console.log('🎯 [Assignment Check] 선택된 반별 배정:', classAssignment);
            
            // 랜덤하게 미션 하나 선택 (missions 배열에서)
            const missions = classAssignment.missions || [];
            console.log('🎯 [Assignment Check] 미션 배열:', missions);
            
            if (missions.length > 0) {
                // 학생 번호 기반으로 미션 할당 (랜덤이 아닌 일관된 배정)
                const studentNumber = parseInt(currentStudent.number) || 1;
                const missionIndex = (studentNumber - 1) % missions.length;
                const selectedMission = missions[missionIndex];
                
                console.log(`🎯 [Assignment Check] 학생 번호: ${studentNumber}, 미션 인덱스: ${missionIndex}`);
                console.log('🎯 [Assignment Check] 할당된 미션:', selectedMission);
                
                // 학생용 assignment 생성
                const studentAssignment = {
                    ...classAssignment,
                    studentId: currentStudent.studentId,
                    studentName: currentStudent.name,
                    roleName: selectedMission.name || classAssignment.sessionName,
                    roleContent: selectedMission.content || selectedMission.name || '',
                    roleDescription: selectedMission.description || selectedMission.content || '',
                    roleType: classAssignment.type || 'text',
                    activityInstructions: classAssignment.activityInstructions,
                    assignedMission: selectedMission
                };
                
                studentAssignments = [studentAssignment];
            }
        }
    }
    
    console.log('✅ [Assignment Check] 최종 studentAssignments:', studentAssignments.length, '개');

    
    hideLoading();
    
    console.log('최종 studentAssignments:', studentAssignments);
    
    if (studentAssignments.length === 0) {
        console.log('역할이 없음 - noRole 표시');
        // No assignment found
        showRole();
        showNoRole();
    } else {
        // Get the most recent assignment
        currentAssignment = studentAssignments[studentAssignments.length - 1];
        console.log('현재 역할 설정:', currentAssignment);
        
        // Mark as checked
        markAssignmentAsChecked(currentAssignment);
        
        // Show the role
        console.log('역할 표시 시작');
        showRole();
        displayRole();
    }
}

// Mark assignment as checked
async function markAssignmentAsChecked(assignment) {
    assignment.checked = true;
    assignment.checkedAt = new Date().toISOString();
    
    // Update in storage
    const index = assignments.findIndex(a => 
        a.sessionId === assignment.sessionId && 
        a.studentId === assignment.studentId
    );
    
    if (index !== -1) {
        assignments[index] = assignment;
        localStorage.setItem('assignments', JSON.stringify(assignments));
        
        // Try to update via Supabase direct client
        try {
            const client = getSupabaseClient();
            if (client) {
                await client
                    .from('assignments')
                    .update({ 
                        checked: true, 
                        checked_at: new Date().toISOString() 
                    })
                    .eq('id', assignment.id);
                console.log('[Assignment] Supabase 업데이트 성공');
            }
        } catch (error) {
            console.log('[Assignment] Supabase 업데이트 실패:', error);
        }
    }
}

// Show role section
async function showRole() {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('roleSection').classList.remove('hidden');
    
    // Display student info
    document.getElementById('displayStudentId').textContent = currentStudent.studentId;
    document.getElementById('displayStudentName').textContent = currentStudent.name;
    
    // Display student info in v3 layout (추가 ID들)
    const displayId2 = document.getElementById('displayStudentId2');
    const displayName2 = document.getElementById('displayStudentName2');
    if (displayId2) displayId2.textContent = currentStudent.studentId;
    if (displayName2) displayName2.textContent = currentStudent.name;
    
    // Auto-register student when showing role
    console.log('[showRole] Auto-registering student:', currentStudent);
    await autoRegisterStudent();
    
    // Initialize point system
    initializePointSystem();
    
    // Start stage settings auto-refresh
    if (typeof startStageSettingsRefresh === 'function') {
        startStageSettingsRefresh();
        console.log('[showRole] 스테이지 설정 자동 새로고침 시작');
    }
    
    // Start approval status monitoring
    // 모든 자동 모니터링 제거
    console.log('[showRole] 자동 모니터링 시스템을 비활성화했습니다.');
}

// Show no role message
function showNoRole() {
    document.getElementById('noRoleMessage').classList.remove('hidden');
    document.getElementById('roleCard').classList.add('hidden');
    
    // 새로운 UI 구조에서도 기본값 설정
    const mainRoleTitle = document.getElementById('mainRoleTitle');
    if (mainRoleTitle) {
        mainRoleTitle.textContent = '배정된 역할이 없습니다';
    }
    
    // 🔧 FIX: 역할이 없을 때도 detailMissions에 기본 메시지 설정
    const detailElement = document.getElementById('detailMissions');
    if (detailElement) {
        detailElement.textContent = '🔧 [수정됨] 역할 배정 시스템이 업데이트되었습니다!';
    }
    
    // 이미지 컨테이너 숨기기
    const roleImageContainer = document.getElementById('roleImageContainer');
    if (roleImageContainer) {
        roleImageContainer.classList.add('hidden');
    }
}

// Display the assigned role
function displayRole() {
    if (!currentAssignment) {
        console.log('🚫 [Display Role] currentAssignment가 없음');
        showNoRole();
        return;
    }
    
    console.log('🎭 [Display Role] currentAssignment:', currentAssignment);
    
    // Supabase 필드명 매핑
    const roleType = currentAssignment.role_type || currentAssignment.roleType;
    const roleName = currentAssignment.role_name || currentAssignment.roleName;
    const roleContent = currentAssignment.role_content || currentAssignment.roleContent;
    
    console.log('🎭 [Display Role] 역할 타입:', roleType);
    console.log('🎭 [Display Role] 역할 이름:', roleName);
    console.log('🎭 [Display Role] 역할 내용:', roleContent);
    
    // 🔥 NEW: 세션 ID 매핑 및 세션 정보 찾기
    const sessionId = currentAssignment.session_id || currentAssignment.sessionId;
    const session = sessions.find(s => s.id === sessionId);
    console.log('🎭 [Display Role] 세션 ID:', sessionId);
    console.log('🎭 [Display Role] 연결된 세션:', session ? (session.name || session.session_name) : '세션 없음');
    
    if (session) {
        console.log('🎭 [Display Role] 세션 상세:', {
            id: session.id,
            name: session.name || session.session_name,
            activityInstructions: session.activity_instructions || session.activityInstructions
        });
    }
    
    // Hide no role message and show role card
    document.getElementById('noRoleMessage').classList.add('hidden');
    document.getElementById('roleDisplay').classList.remove('hidden');
    document.getElementById('roleCard').classList.remove('hidden');
    
    // 🔥 NEW: 관리자에서 생성한 배정의 역할 타입에 따른 표시 분기 처리
    console.log('🎯 [Display Role] 역할 타입 확인:', roleType);
    
    if (roleType === 'image') {
        // 이미지 역할 표시
        console.log('🖼️ [Display Role] 이미지 역할 표시');
        displayImageRole();
    } else {
        // 텍스트 역할 표시 (기본값)
        console.log('📝 [Display Role] 텍스트 역할 표시');
        
        // 🔥 NEW: 새로운 UI 구조에서 mainRoleTitle 사용
        const displayRoleName = roleContent || roleName || '역할';
        const mainRoleTitle = document.getElementById('mainRoleTitle');
        if (mainRoleTitle) {
            mainRoleTitle.textContent = displayRoleName;
            console.log('📝 [Display Role] mainRoleTitle 설정:', displayRoleName);
        }
        
        // 구식 roleName 요소도 있으면 업데이트 (호환성)
        const roleNameElement = document.getElementById('roleName');
        if (roleNameElement) {
            roleNameElement.textContent = displayRoleName;
        }
        
        console.log('📝 [Display Role] 표시할 역할:', displayRoleName);
        
        // 🔥 NEW: 활동방법 안내 - Supabase 필드명 매핑 포함 (상세 디버그)
        console.log('📝 [Display Role] 활동방법 필드 확인:', {
            'currentAssignment.activity_instructions': currentAssignment.activity_instructions,
            'currentAssignment.activityInstructions': currentAssignment.activityInstructions,
            'session?.activity_instructions': session?.activity_instructions,
            'session?.activityInstructions': session?.activityInstructions,
            'currentAssignment.missions': currentAssignment.missions
        });
        
        // missions 필드에서 활동방법 안내 추출 시도
        let parsedMissions = null;
        try {
            if (currentAssignment.missions) {
                if (typeof currentAssignment.missions === 'string') {
                    parsedMissions = JSON.parse(currentAssignment.missions);
                } else if (typeof currentAssignment.missions === 'object') {
                    parsedMissions = currentAssignment.missions; // 이미 객체인 경우
                }
            }
        } catch (e) {
            console.log('📝 [Display Role] missions 파싱 실패:', e);
        }
        
        // 🔥 상세 디버깅을 위한 로그 추가
        console.log('🔍 [Debug] currentAssignment.activity_instructions:', currentAssignment.activity_instructions);
        console.log('🔍 [Debug] currentAssignment.activityInstructions:', currentAssignment.activityInstructions);
        console.log('🔍 [Debug] session?.activity_instructions:', session?.activity_instructions);
        console.log('🔍 [Debug] session?.activityInstructions:', session?.activityInstructions);
        console.log('🔍 [Debug] parsedMissions?.activityInstructions:', parsedMissions?.activityInstructions);
        console.log('🔍 [Debug] currentAssignment 전체 데이터:', currentAssignment);
        
        // 🔥 임시: 항상 상세 디버깅 활성화
        const isRealTimeDebug = true; // 임시로 항상 활성화
        
        if (isRealTimeDebug) {
            console.log('🚨 [REAL-TIME DEBUG] 실시간 디버깅 모드 활성화');
            console.log('🚨 [REAL-TIME DEBUG] missions 타입:', typeof currentAssignment.missions);
            console.log('🚨 [REAL-TIME DEBUG] missions 내용:', currentAssignment.missions);
            console.log('🚨 [REAL-TIME DEBUG] parsedMissions:', parsedMissions);
            
            if (parsedMissions) {
                console.log('🚨 [REAL-TIME DEBUG] parsedMissions.activityInstructions:', parsedMissions.activityInstructions);
                console.log('🚨 [REAL-TIME DEBUG] parsedMissions 전체 구조:', JSON.stringify(parsedMissions, null, 2));
            }
        }
        
        console.log('🚨 [STEP 1] 우선순위 체크 시작...');
        
        // 🚨 실시간 디버깅: 우선순위별 값 체크
        try {
            if (isRealTimeDebug) {
                console.log('🚨 [PRIORITY CHECK] 우선순위별 값 확인:');
                console.log('  1순위 - currentAssignment.activity_instructions:', currentAssignment.activity_instructions || 'NONE');
                console.log('  2순위 - currentAssignment.activityInstructions:', currentAssignment.activityInstructions || 'NONE');
                console.log('  3순위 - session?.activity_instructions:', session?.activity_instructions || 'NONE');
                console.log('  4순위 - session?.activityInstructions:', session?.activityInstructions || 'NONE');
                console.log('  5순위 - parsedMissions?.activityInstructions:', parsedMissions?.activityInstructions || 'NONE');
            }
        } catch (e) {
            console.log('❌ 우선순위 체크 오류:', e);
        }
        
        console.log('🚨 [STEP 2] activityInstructions 결정...');
        
        let activityInstructions;
        try {
            activityInstructions = 
                currentAssignment.activity_instructions || 
                currentAssignment.activityInstructions || 
                session?.activity_instructions || 
                session?.activityInstructions || 
                parsedMissions?.activityInstructions ||
                '🚨 [TEST] 기본값이 사용되고 있습니다! parsedMissions.activityInstructions가 제대로 적용되지 않았습니다.';
        } catch (e) {
            console.log('❌ activityInstructions 결정 오류:', e);
            activityInstructions = '기본 활동방법 안내 (오류 발생)';
        }
        
        console.log('📝 [Display Role] 최종 선택된 활동방법 안내:', activityInstructions);
        console.log('🚨 [STEP 3] DOM 업데이트 준비...');
        
        // 🚨 실시간 디버깅: 최종 결과 확인
        if (isRealTimeDebug) {
            console.log('🚨 [FINAL RESULT] 최종 activityInstructions:', activityInstructions);
            console.log('🚨 [FINAL RESULT] "신서희 활동방법 안내"가 포함되어 있나?', activityInstructions.includes('신서희'));
            
            // detailMissions 요소 확인
            setTimeout(() => {
                const detailElement = document.getElementById('detailMissions');
                if (detailElement) {
                    console.log('🚨 [DOM CHECK] detailMissions 요소 내용:', detailElement.textContent);
                }
            }, 1000);
        }
        
        const detailElement = document.getElementById('detailMissions');
        if (detailElement) {
            // 단순하게 텍스트만 설정 (pre 태그이므로)
            detailElement.textContent = activityInstructions;
            
            console.log('📝 [Display Role] detailMissions 설정 완료:', activityInstructions);
        } else {
            console.error('📝 [Display Role] detailMissions 요소를 찾을 수 없습니다');
        }
    }
    
    // Add animation
    animateRoleCard();
}

// Display image-based role - 🔥 NEW: 관리자에서 생성한 이미지 역할 처리
function displayImageRole() {
    console.log('🖼️ [Image Role] 이미지 역할 표시 시작');
    
    // 🔥 NEW: 새로운 통합 UI 구조 사용
    const roleContent = currentAssignment.role_content || currentAssignment.roleContent;
    const roleName = currentAssignment.role_name || currentAssignment.roleName;
    
    // 역할 제목 설정
    const mainRoleTitle = document.getElementById('mainRoleTitle');
    if (mainRoleTitle) {
        mainRoleTitle.textContent = roleName || '이미지 역할';
        console.log('🖼️ [Image Role] mainRoleTitle 설정:', roleName);
    }
    
    // 이미지 컨테이너 표시
    const roleImageContainer = document.getElementById('roleImageContainer');
    const mainRoleImage = document.getElementById('mainRoleImage');
    
    if (roleImageContainer && mainRoleImage && roleContent) {
        roleImageContainer.classList.remove('hidden');
        mainRoleImage.src = roleContent;
        mainRoleImage.alt = roleName || '역할 이미지';
        console.log('🖼️ [Image Role] 새로운 구조로 이미지 설정 완료:', roleName);
    }
    
    // 구식 요소들도 호환성을 위해 업데이트 (있는 경우)
    const imageRoleDisplay = document.getElementById('imageRoleDisplay');
    const textRoleDisplay = document.getElementById('textRoleDisplay');
    
    if (imageRoleDisplay) imageRoleDisplay.classList.remove('hidden');
    if (textRoleDisplay) textRoleDisplay.classList.add('hidden');
    
    const roleImage = document.getElementById('roleImage');
    if (roleImage && roleContent) {
        roleImage.src = roleContent;
        roleImage.alt = roleName || '역할 이미지';
    }
    
    const imageRoleNameElement = document.getElementById('imageRoleName');
    if (imageRoleNameElement) {
        imageRoleNameElement.textContent = roleName || '이미지 역할';
    }
    
    // 🔥 NEW: 활동방법 안내 - Supabase 필드명 매핑 포함 (상세 디버그)
    const sessionId = currentAssignment.session_id || currentAssignment.sessionId;
    const session = sessions.find(s => s.id === sessionId);
    
    console.log('🖼️ [Image Role] 활동방법 필드 확인:', {
        'currentAssignment.activity_instructions': currentAssignment.activity_instructions,
        'currentAssignment.activityInstructions': currentAssignment.activityInstructions,
        'session?.activity_instructions': session?.activity_instructions,
        'session?.activityInstructions': session?.activityInstructions,
        'currentAssignment.missions': currentAssignment.missions
    });
    
    // missions 필드에서 활동방법 안내 추출 시도
    let parsedMissions = null;
    try {
        if (currentAssignment.missions) {
            if (typeof currentAssignment.missions === 'string') {
                parsedMissions = JSON.parse(currentAssignment.missions);
            } else if (typeof currentAssignment.missions === 'object') {
                parsedMissions = currentAssignment.missions; // 이미 객체인 경우
            }
        }
    } catch (e) {
        console.log('🖼️ [Image Role] missions 파싱 실패:', e);
    }
    
    const activityInstructions = 
        currentAssignment.activity_instructions || 
        currentAssignment.activityInstructions || 
        session?.activity_instructions || 
        session?.activityInstructions || 
        parsedMissions?.activityInstructions ||
        '배정받은 역할을 확인하고, 각자의 임무를 충실히 수행해주세요.\n\n🖼️ 이미지 역할 활동 방법:\n1. 이미지를 자세히 관찰하고 특징을 파악하세요\n2. 역할의 핵심 내용을 이해하고 창의적으로 표현하세요\n3. 다른 팀원들과 협력하여 활동을 진행하세요\n\n💪 적극적으로 참여하여 멋진 결과를 만들어보세요!';
        
    console.log('🖼️ [Image Role] 최종 선택된 활동방법 안내:', activityInstructions);
    
    // detailMissions 요소에도 활동방법 안내 설정
    const detailElement = document.getElementById('detailMissions');
    if (detailElement) {
        detailElement.textContent = activityInstructions;
        console.log('🖼️ [Image Role] 활동방법 안내 설정:', activityInstructions);
    }
    
    console.log('🖼️ [Image Role] 이미지 역할 표시 완료');
    
    // 🔥 추가: 이미지가 실제로 표시되었는지 확인
    setTimeout(() => {
        const img = document.getElementById('roleImage');
        if (img) {
            console.log('🖼️ [Image Role] 최종 확인 - 이미지 상태:', {
                src: img.src,
                complete: img.complete,
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight
            });
        }
    }, 1000);
}

// Display text-based role
function displayTextRole() {
    document.getElementById('textRoleDisplay').classList.remove('hidden');
    document.getElementById('imageRoleDisplay').classList.add('hidden');
    
    document.getElementById('roleTitle').textContent = currentAssignment.roleName;
    document.getElementById('roleDescription2').textContent = currentAssignment.roleContent;
    
    // Update flip card front for text role
    document.getElementById('roleName').textContent = currentAssignment.roleName;
    document.getElementById('roleDescription').textContent = currentAssignment.roleContent;
    
    // Set additional info (legacy compatibility)
    const additionalInfo = document.getElementById('additionalInfo');
    
    // Find the session for activity instructions
    const session = sessions.find(s => s.id === currentAssignment.sessionId);
    const activityInstructions = session?.activityInstructions || '역할을 충실히 수행하고, 궁금한 점은 선생님께 문의하세요.';
    
    additionalInfo.innerHTML = `
        <div class="bg-white bg-opacity-20 rounded-lg p-4">
            <h4 class="font-semibold mb-2" style="font-size: 0.8rem;">
                <i class="fas fa-tasks mr-2"></i>나의 역할
            </h4>
            <p style="font-size: 0.7rem;">${currentAssignment.roleContent}</p>
        </div>
        <div class="bg-white bg-opacity-20 rounded-lg p-4">
            <h4 class="font-semibold mb-2" style="font-size: 0.8rem;">
                <i class="fas fa-clipboard-list mr-2"></i>활동 방법
            </h4>
            <div class="whitespace-pre-line" style="font-size: 0.6rem;">${activityInstructions}</div>
        </div>
    `;
}



// Animate role card appearance
function animateRoleCard() {
    const card = document.getElementById('roleCard');
    card.style.opacity = '0';
    card.style.transform = 'scale(0.9)';
    
    setTimeout(() => {
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        card.style.opacity = '1';
        card.style.transform = 'scale(1)';
    }, 100);
}

// Flip card animation - 재설계된 버전
function flipCard() {
    const card = document.getElementById('flipCard');
    if (!card) {
        console.error('flipCard 요소를 찾을 수 없습니다');
        return;
    }
    
    // 플립 상태 토글
    card.classList.toggle('flipped');
    
    // 플립 상태에 따른 처리
    if (card.classList.contains('flipped')) {
        console.log('카드 뒤집기 - 활동방법 표시');
        
        // 활동방법 안내 텍스트 확인 및 업데이트
        if (currentAssignment) {
            console.log('🔍 [플립] currentAssignment 확인:', currentAssignment);
            
            // 세션 ID 매핑 (snake_case와 camelCase 모두 지원)
            const sessionId = currentAssignment.session_id || currentAssignment.sessionId;
            const session = sessions.find(s => s.id === sessionId);
            
            console.log('🔍 [플립] sessionId:', sessionId);
            console.log('🔍 [플립] 매칭된 session:', session);
            
            // missions 필드에서 activityInstructions 추출
            let parsedMissions = null;
            try {
                if (currentAssignment.missions) {
                    if (typeof currentAssignment.missions === 'string') {
                        parsedMissions = JSON.parse(currentAssignment.missions);
                    } else {
                        parsedMissions = currentAssignment.missions;
                    }
                    console.log('🔍 [플립] parsedMissions:', parsedMissions);
                }
            } catch (e) {
                console.log('🔍 [플립] missions 파싱 실패:', e);
            }
            
            // 우선순위: currentAssignment 직접 필드 > session 직접 필드 > parsedMissions > 기본값
            const activityInstructions = 
                currentAssignment.activity_instructions || 
                currentAssignment.activityInstructions || 
                session?.activity_instructions ||
                session?.activityInstructions || 
                parsedMissions?.activityInstructions ||
                '🔧 [수정됨] 역할 배정 시스템이 업데이트되었습니다!';
            
            console.log('🎯 [플립] 최종 활동방법 안내:', activityInstructions);
            
            // detailMissions 요소 업데이트
            const detailMissionsEl = document.getElementById('detailMissions');
            if (detailMissionsEl) {
                detailMissionsEl.textContent = activityInstructions;
                console.log('✅ [플립] 활동방법 안내 텍스트 설정 완료');
            } else {
                console.error('❌ [플립] detailMissions 요소를 찾을 수 없습니다');
            }
        } else {
            console.log('❌ [플립] currentAssignment가 없음');
            // 역할이 없는 경우의 기본 메시지
            const detailMissionsEl = document.getElementById('detailMissions');
            if (detailMissionsEl) {
                detailMissionsEl.textContent = '역할을 충실히 수행하고, 궁금한 점은 선생님께 문의하세요.';
            }
        }
    } else {
        console.log('카드 앞면으로 복귀');
    }
}

// 배정 상태 새로고침 - GLOBAL FUNCTION
window.refreshAssignmentStatus = async function() {
    console.log('[Student] 배정 상태 새로고침 시작');
    
    showLoading();
    
    // 배정 데이터 다시 로드
    await loadAssignments();
    await loadSessions();
    
    // 학생 배정 다시 확인
    await checkStudentAssignment();
    
    hideLoading();
    console.log('[Student] 배정 상태 새로고침 완료');
};

// Check role again
async function checkRoleAgain() {
    await window.refreshAssignmentStatus();
}

// Logout
function logout() {
    sessionStorage.removeItem('currentStudent');
    currentStudent = null;
    currentAssignment = null;
    
    // Stop teacher point notification check
    stopTeacherPointNotificationCheck();
    
    // Reset point system
    dailyPoints = null;
    pointHistory = [];
    stageStates = {
        1: { completed: 0, unlocked: true },
        2: { completed: 0, unlocked: false },
        3: { completed: 0, unlocked: false }
    };
    
    // Reset form
    document.getElementById('loginStudentId').value = '';
    document.getElementById('loginStudentName').value = '';
    
    // Hide point section
    hidePointSection();
    
    // Show login section
    document.getElementById('loginSection').classList.remove('hidden');
    document.getElementById('roleSection').classList.add('hidden');
}





// Show loading state in login form
function showLoading() {
    // 기존 로딩 오버레이 사용 (있는 경우)
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.remove('hidden');
    }
    
    // 로그인 버튼 로딩 상태로 변경
    const loginButton = document.getElementById('loginButton');
    const loginButtonText = document.getElementById('loginButtonText');
    const loginLoadingText = document.getElementById('loginLoadingText');
    
    if (loginButton) {
        loginButton.disabled = true;
        if (loginButtonText) loginButtonText.classList.add('hidden');
        if (loginLoadingText) loginLoadingText.classList.remove('hidden');
    }
    
    // 에러 메시지 숨기기
    hideLoginError();
}

// Hide loading state
function hideLoading() {
    // 기존 로딩 오버레이 숨기기
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
    }
    
    // 로그인 버튼 정상 상태로 복구
    const loginButton = document.getElementById('loginButton');
    const loginButtonText = document.getElementById('loginButtonText');
    const loginLoadingText = document.getElementById('loginLoadingText');
    
    if (loginButton) {
        loginButton.disabled = false;
        if (loginButtonText) loginButtonText.classList.remove('hidden');
        if (loginLoadingText) loginLoadingText.classList.add('hidden');
    }
}

// ======= 칠판 기능 =======

// 칠판 자동 업데이트 시작 (중복 제거됨 - 아래에 더 완전한 버전 있음)

// 칠판 내용 로드
async function loadBoardContent() {
    try {
        // Supabase 직접 사용하여 칠판 내용 로드
        const client = getSupabaseClient();
        let boardData = null;
        
        if (client) {
            const { data, error } = await client
                .from('config')
                .select('*')
                .eq('key', 'board_content')
                .single();
                
            if (!error && data) {
                boardData = data.value;
            }
        }
        
        // 폴백: localStorage에서 로드
        if (!boardData) {
            boardData = JSON.parse(localStorage.getItem('board_content') || 'null');
        }
        
        if (boardData) {
            [boardData].forEach(board => {
                if (board.board_type === 'fixed_notice') {
                    const fixedNoticeBoard = document.getElementById('fixedNoticeBoard');
                    if (fixedNoticeBoard) {
                        if (board.content && board.content.trim()) {
                            fixedNoticeBoard.innerHTML = `
                                <div class="notice-card">

                                    <div class="notice-content">${board.content}</div>
                                    <div class="notice-date">${board.updated_at ? new Date(board.updated_at).toLocaleDateString('ko-KR') : ''}</div>
                                </div>
                            `;
                        } else {
                            fixedNoticeBoard.innerHTML = `
                                <div class="text-center text-gray-500 py-4">
                                    <i class="fas fa-book-open text-3xl mb-2 text-blue-400"></i>
                                    <p style="font-size: 0.8rem;">클릭하여 상세 학습안내 확인</p>
                                    <div class="mt-2">
                                        <i class="fas fa-mouse-pointer text-blue-500 animate-bounce"></i>
                                    </div>
                                </div>
                            `;
                        }
                    }
                } else if (board.board_type === 'live_board') {
                    const liveBoardContent = document.getElementById('liveBoardContent');
                    if (liveBoardContent) {
                        liveBoardContent.textContent = board.content || '칠판이 비어있습니다.';
                    }
                }
            });
        }
    } catch (error) {
        console.log('칠판 내용 로드 오류:', error);
        // 오류 시 기본 메시지 유지
    }
}

// 학생 로그인 시 칠판 자동 업데이트 시작
const originalShowRoleSection = showRoleSection;
function showRoleSection() {
    originalShowRoleSection();
    startBoardAutoUpdate();
}

// Show error message in login form
function showError(message) {
    // 기존 에러 모달 사용 (있는 경우)
    const errorMessage = document.getElementById('errorMessage');
    const errorModal = document.getElementById('errorModal');
    if (errorMessage && errorModal) {
        errorMessage.textContent = message;
        errorModal.classList.remove('hidden');
    }
    
    // 로그인 폼의 에러 메시지 표시
    const loginErrorMessage = document.getElementById('loginErrorMessage');
    const loginErrorText = document.getElementById('loginErrorText');
    
    if (loginErrorMessage && loginErrorText) {
        loginErrorText.textContent = message;
        loginErrorMessage.classList.remove('hidden');
        
        // 성공 메시지 숨기기
        hideLoginSuccess();
        
        // 3초 후 자동으로 숨기기
        setTimeout(() => {
            hideLoginError();
        }, 5000);
    }
    
    // 로딩 상태 해제
    hideLoading();
}

// Close error modal
function closeError() {
    const errorModal = document.getElementById('errorModal');
    if (errorModal) {
        errorModal.classList.add('hidden');
    }
}

// Show login success message
function showLoginSuccess() {
    const loginSuccessMessage = document.getElementById('loginSuccessMessage');
    if (loginSuccessMessage) {
        loginSuccessMessage.classList.remove('hidden');
    }
    hideLoginError();
}

// Hide login success message
function hideLoginSuccess() {
    const loginSuccessMessage = document.getElementById('loginSuccessMessage');
    if (loginSuccessMessage) {
        loginSuccessMessage.classList.add('hidden');
    }
}

// Hide login error message
function hideLoginError() {
    const loginErrorMessage = document.getElementById('loginErrorMessage');
    if (loginErrorMessage) {
        loginErrorMessage.classList.add('hidden');
    }
}

// Show kimbap warning modal
function showKimbapWarningModal() {
    document.getElementById('kimbapWarningModal').classList.remove('hidden');
}

// Cancel kimbap add
function cancelKimbapAdd() {
    document.getElementById('kimbapWarningModal').classList.add('hidden');
    window.pendingStage = null;
}

// Confirm kimbap add
function confirmKimbapAdd() {
    document.getElementById('kimbapWarningModal').classList.add('hidden');
    if (window.pendingStage) {
        proceedWithStageCompletion(window.pendingStage);
        window.pendingStage = null;
    }
}

// Show success message
function showSuccess(message) {
    showNotification(message);
}

// Show notification
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-400 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
    notification.innerHTML = `
        <i class="fas fa-check-circle mr-2"></i>${message}
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 3000);
}

// Add roundRect method to CanvasRenderingContext2D
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        this.beginPath();
        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.lineTo(x + width, y + height - radius);
        this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.lineTo(x + radius, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.lineTo(x, y + radius);
        this.quadraticCurveTo(x, y, x + radius, y);
        this.closePath();
    };
}

// Input validation for student ID
document.getElementById('loginStudentId').addEventListener('input', function(e) {
    // Only allow numbers
    this.value = this.value.replace(/[^0-9]/g, '');
    
    // Limit to 4 digits
    if (this.value.length > 4) {
        this.value = this.value.slice(0, 4);
    }
});

// Auto-refresh assignments every 30 seconds when waiting for role
// refreshInterval is declared in main.js

function startAutoRefresh() {
    if (currentStudent && !currentAssignment) {
        refreshInterval = setInterval(async () => {
            await loadAssignments();
            const studentAssignments = assignments.filter(a => 
                a.studentId === currentStudent.studentId && 
                a.studentName.toLowerCase() === currentStudent.name.toLowerCase()
            );
            

            // 포인트 데이터 새로고침 추가
            await refreshPointsData();
            await updateStageButtons(); // 버튼 상태 실시간 업데이트
            
            if (studentAssignments.length > 0) {
                currentAssignment = studentAssignments[studentAssignments.length - 1];
                markAssignmentAsChecked(currentAssignment);
                displayRole();
                stopAutoRefresh();
            }
        }, 10000); // ⭐ 10초마다 체크 (더 빠른 반응성)
    }
}

function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

// 포인트 데이터 새로고침 함수
async function refreshPointsData() {
    if (!currentStudent) return;
    
    try {
        // 🔥 한국 시간 기준으로 오늘 날짜 계산
        const now = new Date();
        const kstOffset = 9 * 60 * 60 * 1000;
        const today = new Date(now.getTime() + kstOffset).toISOString().split('T')[0];
        const client = getSupabaseClient();
        
        if (client) {
            console.log('[RefreshPoints] 포인트 데이터 새로고침 중...');
            updateRefreshIndicator('진행 중', '데이터 확인 중...');
            
            const { data, error } = await client
                .from('daily_points')
                .select('*')
                .eq('student_id', currentStudent.studentId)
                .eq('date', today)
                .single();
                
            if (!error && data) {
                // 기존 dailyPoints 업데이트
                const oldPoints = dailyPoints ? dailyPoints.total_points : 0;
                dailyPoints = data;
                
                // stageStates 업데이트
                stageStates = {
                    1: { 
                        completed: data.stage1_count || 0, 
                        unlocked: true 
                    },
                    2: { 
                        completed: data.stage2_count || 0, 
                        unlocked: (data.stage1_count || 0) > 0 
                    },
                    3: { 
                        completed: data.stage3_count || 0, 
                        unlocked: (data.stage2_count || 0) > 0 
                    }
                };
                
                // 포인트가 변경되었으면 UI 업데이트
                if (oldPoints !== data.total_points) {
                    console.log(`[RefreshPoints] 포인트 변경 감지: ${oldPoints} → ${data.total_points}`);
                    updatePointDisplay();
                    
                    // 포인트 변경 알림 (화면 상단에 표시) - 백그라운드 동기화로 변경
                    // showPointChangeNotification(oldPoints, data.total_points);
                }
                
                console.log(`[RefreshPoints] 새로고침 완료: ${data.total_points}포인트`);
                updateRefreshIndicator('완료', `마지막: ${new Date().toLocaleTimeString()}`);
            } else if (error && error.code !== 'PGRST116') {
                console.error('[RefreshPoints] 오류:', error);
                updateRefreshIndicator('오류', `${error.message}`);
            }
        }
    } catch (error) {
        console.error('[RefreshPoints] 포인트 새로고침 실패:', error);
    }
}

// 포인트 자동 새로고침 시작
function startPointRefresh() {
    if (currentStudent && !pointRefreshInterval) {
        console.log('[RefreshPoints] 포인트 자동 새로고침 시작 (45초 간격)');
        pointRefreshInterval = setInterval(refreshPointsData, 45000); // 45초마다
        
        // 상태 표시기 초기화
        initializeRefreshIndicator();
    }
}

// 포인트 자동 새로고침 중지
function stopPointRefresh() {
    if (pointRefreshInterval) {
        clearInterval(pointRefreshInterval);
        pointRefreshInterval = null;
        console.log('[RefreshPoints] 포인트 자동 새로고침 중지');
    }
}

// 포인트 변경 알림 표시
function showPointChangeNotification(oldPoints, newPoints) {
    // 기존 알림 제거
    const existingNotification = document.getElementById('pointChangeNotification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // 새 알림 생성
    const notification = document.createElement('div');
    notification.id = 'pointChangeNotification';
    notification.className = 'fixed top-4 right-4 z-50 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg';
    notification.innerHTML = `
        <div class="flex items-center space-x-2">
            <div class="text-lg">🔄</div>
            <div>
                <div class="font-semibold">포인트 동기화됨</div>
                <div class="text-sm">${oldPoints}점 → ${newPoints}점</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // 3초 후 자동 제거
    setTimeout(() => {
        if (notification && notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// 새로고침 상태 표시기 초기화
function initializeRefreshIndicator() {
    const indicator = document.getElementById('pointRefreshIndicator');
    if (indicator) {
        // 백그라운드 모드: 인디케이터 숨김
        indicator.style.display = 'none';
        updateRefreshIndicator('활성', '45초마다 백그라운드 동기화');
    }
}

// 새로고침 상태 표시기 업데이트
function updateRefreshIndicator(status, time) {
    const statusEl = document.getElementById('refreshStatus');
    const timeEl = document.getElementById('refreshTime');
    const iconEl = document.getElementById('refreshIcon');
    
    if (statusEl) statusEl.textContent = `포인트 새로고침 ${status}`;
    if (timeEl) timeEl.textContent = time;
    
    // 아이콘 업데이트
    if (iconEl) {
        if (status === '진행 중') {
            iconEl.innerHTML = '<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>';
        } else {
            iconEl.innerHTML = '<div class="rounded-full h-4 w-4 bg-green-500"></div>';
        }
    }
}

// Start auto-refresh when showing no role
const originalShowNoRole = showNoRole;
showNoRole = function() {
    originalShowNoRole();
    startAutoRefresh();
};

// Stop auto-refresh on logout
const originalLogout = logout;
logout = function() {
    stopAutoRefresh();
    originalLogout();
};

// ============ POINT SYSTEM FUNCTIONS ============

// Point system variables (using globals from main.js where possible)
let dailyPoints = null;
let pointHistory = [];
let stageStates = {
    1: { completed: 0, unlocked: true },
    2: { completed: 0, unlocked: false },
    3: { completed: 0, unlocked: false }
};

// Initialize point system
async function initializePointSystem() {
    if (!currentStudent) return;
    
    await loadDailyPoints();
    await loadPointHistory();
    if (typeof loadStageSettings === 'function') {
        await loadStageSettings(); // Load custom stage descriptions from admin
    }

    updatePointDisplay();
    updateStageButtons();
    showPointSection();
    
    // Update today's date
    const today = new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    document.getElementById('todayDate').textContent = today;
    
    // 승인 시스템 완전 제거됨 - 더이상 모니터링 불필요
}

// Load daily points for current student
async function loadDailyPoints() {
    // 🔥 한국 시간 기준으로 오늘 날짜 계산 (UTC+9)
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000; // 9시간을 밀리초로
    const kstTime = new Date(now.getTime() + kstOffset);
    const today = kstTime.toISOString().split('T')[0]; // YYYY-MM-DD format (한국 시간 기준)
    
    try {
        // Try to load specific daily points for current student and today
        console.log('[LoadPoints] Checking for existing points for:', currentStudent.studentId, 'on date:', today);
        
        // Supabase 직접 사용하여 오늘 포인트 로드
        const client = getSupabaseClient();
        let todayPoints = null;
        
        if (client) {
            const { data, error } = await client
                .from('daily_points')
                .select('*')
                .eq('student_id', currentStudent.studentId)
                .eq('date', today)
                .single();
                
            if (!error && data) {
                todayPoints = data;
            }
        }
        
        console.log('[LoadPoints] Found existing record:', !!todayPoints, todayPoints ? `with ${todayPoints.total_points} points` : 'creating new');
        
        if (todayPoints && todayPoints.id) {
            // 오늘 날짜 포인트가 있으면 그대로 사용
            dailyPoints = todayPoints;
            stageStates = {
                1: { 
                    completed: todayPoints.stage1_count || 0, 
                    unlocked: true 
                },
                2: { 
                    completed: todayPoints.stage2_count || 0, 
                    unlocked: (todayPoints.stage1_count || 0) > 0 
                },
                3: { 
                    completed: todayPoints.stage3_count || 0, 
                    unlocked: (todayPoints.stage2_count || 0) > 0 
                }
            };
            console.log('[LoadPoints] Successfully loaded existing points:', dailyPoints.total_points);
        } else {
            // 오늘 날짜 포인트가 없으면 새로 생성
            console.log('[LoadPoints] No existing record found, creating new daily points for today');
            await createDailyPoints(today);
        }
    } catch (error) {
        // Fallback to localStorage
        console.log('Using localStorage for daily points');
        await handleLocalStoragePointsWithDateCheck(today);
    }
}

// Handle localStorage points with date check
async function handleLocalStoragePointsWithDateCheck(today) {
    const localPoints = JSON.parse(localStorage.getItem('dailyPoints') || '{}');
    const key = `${currentStudent.studentId}_${today}`;
    
    // 오늘 날짜 키가 있는지 확인
    if (localPoints[key] && localPoints[key].date === today) {
        dailyPoints = localPoints[key];
        stageStates = {
            1: { 
                completed: localPoints[key].stage1_count || 0, 
                unlocked: true 
            },
            2: { 
                completed: localPoints[key].stage2_count || 0, 
                unlocked: (localPoints[key].stage1_count || 0) > 0 
            },
            3: { 
                completed: localPoints[key].stage3_count || 0, 
                unlocked: (localPoints[key].stage2_count || 0) > 0 
            }
        };
        console.log('Loaded localStorage points for today:', dailyPoints.total_points);
    } else {
        // 오늘 날짜가 없으면 새로 생성 (자동 리셋)
        console.log('No localStorage record for today, creating new (auto-reset)');
        await createDailyPoints(today);
        
        // 오래된 localStorage 데이터 정리 (선택사항)
        cleanupOldLocalStoragePoints(localPoints, today);
    }
}

// Clean up old localStorage points (optional)
function cleanupOldLocalStoragePoints(localPoints, today) {
    const studentPrefix = `${currentStudent.studentId}_`;
    const keysToDelete = [];
    
    Object.keys(localPoints).forEach(key => {
        if (key.startsWith(studentPrefix) && !key.endsWith(`_${today}`)) {
            keysToDelete.push(key);
        }
    });
    
    if (keysToDelete.length > 0) {
        keysToDelete.forEach(key => delete localPoints[key]);
        localStorage.setItem('dailyPoints', JSON.stringify(localPoints));
        console.log(`Cleaned up ${keysToDelete.length} old localStorage point records`);
    }
}

// Create new daily points record
async function createDailyPoints(date) {
    // Use consistent ID format to prevent duplicates
    const consistentId = `daily_${date}_${currentStudent.studentId}`;
    
    dailyPoints = {
        id: consistentId,
        student_id: currentStudent.studentId,
        student_name: currentStudent.name,
        class_info: currentStudent.fullClass,
        date: date,
        stage1_count: 0,
        stage2_count: 0,
        stage3_count: 0,
        total_points: 0,
        last_activity: null,
        created_at: new Date().toISOString()
    };
    
    console.log('[CreatePoints] Creating new daily points record with ID:', consistentId);
    
    stageStates = {
        1: { completed: 0, unlocked: true },
        2: { completed: 0, unlocked: false },
        3: { completed: 0, unlocked: false }
    };
    
    try {
        // Supabase 직접 사용하여 새 포인트 레코드 생성
        const client = getSupabaseClient();
        
        if (client) {
            const { data, error } = await client
                .from('daily_points')
                .upsert([
                    {
                        id: consistentId,
                        student_id: currentStudent.studentId,
                        student_name: currentStudent.name,
                        class_info: currentStudent.fullClass,
                        date: date,
                        stage1_count: 0,
                        stage2_count: 0,
                        stage3_count: 0,
                        total_points: 0,
                        last_activity: null
                    }
                ])
                .select()
                .single();
                
            if (!error && data) {
                dailyPoints = data;
                console.log('[CreatePoints] Supabase 저장 성공:', dailyPoints.id);
            } else if (error) {
                throw error;
            }
        }
    } catch (error) {
        console.log('[CreatePoints] Supabase 저장 실패, localStorage 사용:', error.message);
        // Save to localStorage as fallback
        const localPoints = JSON.parse(localStorage.getItem('dailyPoints') || '{}');
        const key = `${currentStudent.studentId}_${date}`;
        localPoints[key] = dailyPoints;
        localStorage.setItem('dailyPoints', JSON.stringify(localPoints));
    }
}

// Load point history
async function loadPointHistory() {
    // 🔥 한국 시간 기준으로 오늘 날짜 계산
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const today = new Date(now.getTime() + kstOffset).toISOString().split('T')[0];
    
    try {
        // Supabase 직접 사용하여 포인트 히스토리 로드
        const client = getSupabaseClient();
        let allHistory = [];
        
        if (client) {
            const { data, error } = await client
                .from('point_history')
                .select('*')
                .eq('student_id', currentStudent.studentId)
                .order('created_at', { ascending: false });
                
            if (!error && data) {
                allHistory = data;
            }
        }
        
        if (allHistory.length > 0) {
            pointHistory = allHistory.filter(h => h.date === today) || [];
            console.log('[LoadHistory] Loaded from Supabase:', pointHistory.length);
        } else {
            throw new Error('Supabase API not ready');
        }
    } catch (error) {
        console.log('[LoadHistory] Using localStorage fallback:', error.message);
        // Fallback to localStorage
        const localHistory = JSON.parse(localStorage.getItem('pointHistory') || '[]');
        pointHistory = localHistory.filter(h => 
            h.student_id === currentStudent.studentId && 
            h.date === today
        );
    }
}

// Complete a stage
async function completeStage(stage) {
    if (!stageStates[stage].unlocked) {
        showNotification('이전 단계를 먼저 완료해주세요!');
        return;
    }
    
    // Check if stage 1 or 2 is already completed (only allow once)
    if (stage <= 2 && stageStates[stage].completed >= 1) {
        showNotification(`${getStageName(stage)}는 이미 완료되었습니다!`);
        return;
    }
    
    // Stage 3 (김밥추가)는 반복 가능하지만 최대 포인트 체크는 먼저 실행
    
    // Check if already at max points
    const currentTotal = (dailyPoints.stage1_count * 1) + (dailyPoints.stage2_count * 1) + (dailyPoints.stage3_count * 1);
    if (currentTotal >= 10) {
        showNotification('오늘 최대 포인트(10점)에 도달했습니다!');
        return;
    }
    
    // ⭐ Stage 3 김밥추가 경고 모달
    if (stage === 3) {
        // 현재 단계를 전역 변수에 저장하여 모달에서 사용
        window.pendingStage = stage;
        showKimbapWarningModal();
        return;
    }
    
    // ⭐ Stage 1, 2 - 기존 직접 완료 시스템
    proceedWithStageCompletion(stage);
}

// 실제 스테이지 완료 처리 함수
async function proceedWithStageCompletion(stage) {
    // Update stage count
    stageStates[stage].completed++;
    
    // Calculate points (1 point per stage completion)
    const pointsEarned = 1;
    
    // Update daily points
    const today = new Date().toISOString().split('T')[0];
    dailyPoints[`stage${stage}_count`] = stageStates[stage].completed;
    const newTotal = (dailyPoints.stage1_count * 1) + (dailyPoints.stage2_count * 1) + (dailyPoints.stage3_count * 1);
    dailyPoints.total_points = Math.min(newTotal, 10); // 최대 10포인트 제한
    dailyPoints.last_activity = new Date().toISOString();
    

    
    // Unlock next stage
    if (stage < 3) {
        stageStates[stage + 1].unlocked = true;
    }
    
    // Add to history
    const historyEntry = {
        id: `${currentStudent.studentId}_${Date.now()}`,
        student_id: currentStudent.studentId,
        student_name: currentStudent.name,
        date: today,
        stage: stage,
        points_earned: pointsEarned,
        activity_time: new Date().toISOString(),
        activity_description: getStageName(stage)
    };
    
    pointHistory.push(historyEntry);
    
    // Save to storage
    await saveDailyPoints();
    await savePointHistory(historyEntry);
    
    // Update display
    updatePointDisplay();
    updateStageButtons();
    updateHistoryDisplay();
    
    // Show success notification
    showNotification(`${getStageName(stage)} 완료! +${pointsEarned} 포인트`);
    
    // Animation effect
    animatePointEarned(stage, pointsEarned);
}





// Save daily points to storage
async function saveDailyPoints() {
    const today = new Date().toISOString().split('T')[0];
    console.log('[SavePoints] Saving daily points:', dailyPoints);
    
    try {
        // Supabase 직접 사용하여 포인트 저장
        const client = getSupabaseClient();
        
        if (client) {
            const { data, error } = await client
                .from('daily_points')
                .upsert([dailyPoints])
                .select()
                .single();
                
            if (!error && data) {
                dailyPoints.id = data.id;
                console.log('[SavePoints] Supabase 저장 성공:', data.id);
            } else if (error) {
                throw error;
            }
        } else {
            throw new Error('Supabase client not available');
        }
    } catch (error) {
        console.log('[SavePoints] Supabase save failed, using localStorage:', error.message);
        // Save to localStorage as backup
        const localPoints = JSON.parse(localStorage.getItem('dailyPoints') || '{}');
        const key = `${currentStudent.studentId}_${today}`;
        localPoints[key] = dailyPoints;
        localStorage.setItem('dailyPoints', JSON.stringify(localPoints));
    }
}

// Save point history entry
async function savePointHistory(entry) {
    console.log('[SaveHistory] Saving point history:', entry);
    
    try {
        if (supabaseAPIReady && supabaseAPI && supabaseAPI.pointHistory) {
            // Use Supabase API to save point history
            const result = await supabaseAPI.pointHistory.add(entry);
            
            if (result && result.id) {
                console.log('[SaveHistory] Successfully saved to Supabase:', result.id);
            } else {
                throw new Error('Supabase add returned null');
            }
        } else {
            throw new Error('Supabase API not ready');
        }
    } catch (error) {
        console.log('[SaveHistory] Supabase save failed, using localStorage:', error.message);
        // Save to localStorage as backup
        const localHistory = JSON.parse(localStorage.getItem('pointHistory') || '[]');
        localHistory.push(entry);
        localStorage.setItem('pointHistory', JSON.stringify(localHistory));
    }
}

// Update point display
function updatePointDisplay() {
    if (!dailyPoints) return;
    
    const totalPoints = dailyPoints.total_points || 0;
    const maxPoints = 10; // 최대 10포인트
    
    // Update total points
    document.getElementById('totalPoints').textContent = totalPoints;
    
    // Update progress bar
    const progressPercent = (totalPoints / maxPoints) * 100;
    document.getElementById('progressBar').style.width = `${progressPercent}%`;
    document.getElementById('progressText').textContent = `${totalPoints} / ${maxPoints} 포인트`;
    
    // Stage counts removed - now showing task descriptions instead
}

// Update stage buttons
async function updateStageButtons() {
    const currentTotal = dailyPoints ? (dailyPoints.stage1_count * 1) + (dailyPoints.stage2_count * 1) + (dailyPoints.stage3_count * 1) : 0;
    const maxReached = currentTotal >= 10;
    
    // 승인 시스템 완전 제거 - Stage 3도 이제 직접 완료 가능
    
    for (let stage = 1; stage <= 3; stage++) {
        const btn = document.getElementById(`stage${stage}Btn`);
        const card = document.getElementById(`stage${stage}Card`);
        const icon = document.getElementById(`stage${stage}Icon`);
        
        // Check if stage 1,2 is already completed (Stage 3는 반복 가능)
        const isStage12Completed = (stage <= 2 && stageStates[stage].completed >= 1);
        
        if (maxReached) {
            // Max points reached - disable all buttons
            btn.textContent = '완료됨';
            btn.className = 'px-2 py-1 rounded text-xs font-medium transition-colors bg-green-400 text-white cursor-not-allowed';
            btn.disabled = true;
            
            card.className = 'border border-green-200 rounded-md p-1 bg-green-50 shadow-sm hover:shadow-md transition-shadow';
            icon.className = 'w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs bg-green-400';
        } else if (isStage12Completed) {
            // Stage 1 or 2 already completed - show completed state
            btn.textContent = '완료됨';
            btn.className = 'px-2 py-1 rounded text-xs font-medium transition-colors bg-green-400 text-white cursor-not-allowed';
            btn.disabled = true;
            
            card.className = 'border border-green-200 rounded-md p-1 bg-green-50 shadow-sm hover:shadow-md transition-shadow';
            icon.className = 'w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs bg-green-400';
        } else if (stageStates[stage].unlocked) {
            // Unlocked stage - Stage 3는 추가하기, 나머지는 완료하기
            btn.textContent = stage === 3 ? '추가하기' : '완료하기';
            btn.className = 'px-2 py-1 rounded text-xs font-medium transition-colors bg-purple-400 text-white hover:bg-purple-500';
            btn.disabled = false;
            
            card.className = 'border border-purple-200 rounded-md p-1 bg-purple-50 shadow-sm hover:shadow-md transition-shadow';
            icon.className = 'w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs bg-purple-400';
        } else {
            // Locked stage
            btn.textContent = '잠금됨';
            btn.className = 'px-2 py-1 rounded text-xs font-medium transition-colors bg-gray-300 text-gray-500 cursor-not-allowed';
            btn.disabled = true;
            
            card.className = 'border border-gray-200 rounded-md p-1 bg-gray-50 shadow-sm hover:shadow-md transition-shadow';
            icon.className = 'w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs bg-gray-400';
        }
    }
}

// Load and apply stage descriptions from admin settings
async function loadStageDescriptions() {
    try {
        // Try to load from database first
        const response = await smartFetch('tables/stage_config');
        if (response.ok) {
            const data = await response.json();
            if (data.data && data.data.length > 0) {
                const config = data.data[0];
                updateStageDescriptions({
                    stage1: config.stage1 || '김밥을 말아보세요 (+1포인트)',
                    stage2: config.stage2 || '김밥을 예쁘게 썰어보세요 (+1포인트)',
                    stage3: config.stage3 || '더 많은 김밥을 만들어보세요 (+1포인트)'
                });
                return;
            }
        }
        
        // Fallback to localStorage
        const saved = localStorage.getItem('stageDescriptions');
        if (saved) {
            const descriptions = JSON.parse(saved);
            updateStageDescriptions({
                stage1: descriptions.stage1 || '김밥을 말아보세요 (+1포인트)',
                stage2: descriptions.stage2 || '김밥을 예쁘게 썰어보세요 (+1포인트)',
                stage3: descriptions.stage3 || '더 많은 김밥을 만들어보세요 (+1포인트)'
            });
        }
    } catch (error) {
        console.error('Loading stage descriptions error:', error);
        // Keep default descriptions if loading fails
    }
}

// Update stage descriptions in UI
function updateStageDescriptions(descriptions) {
    console.log('Updating stage descriptions:', descriptions);
    
    // Update stage 1 description
    const stage1Desc = document.querySelector('#stage1Card p.text-gray-600');
    if (stage1Desc && descriptions.stage1) {
        stage1Desc.textContent = descriptions.stage1;
        console.log('Updated stage 1:', descriptions.stage1);
    } else {
        console.log('Stage 1 element not found or no description');
    }
    
    // Update stage 2 description
    const stage2Desc = document.querySelector('#stage2Card p.text-gray-600');
    if (stage2Desc && descriptions.stage2) {
        stage2Desc.textContent = descriptions.stage2;
        console.log('Updated stage 2:', descriptions.stage2);
    } else {
        console.log('Stage 2 element not found or no description');
    }
    
    // Update stage 3 description
    const stage3Desc = document.querySelector('#stage3Card p.text-gray-600');
    if (stage3Desc && descriptions.stage3) {
        stage3Desc.textContent = descriptions.stage3;
        console.log('Updated stage 3:', descriptions.stage3);
    } else {
        console.log('Stage 3 element not found or no description');
    }
}

// Get stage name
function getStageName(stage) {
    const names = {
        1: '김밥말기',
        2: '김밥썰기', 
        3: '김밥추가'
    };
    return names[stage];
}

// Update history display
function updateHistoryDisplay() {
    const historyList = document.getElementById('historyList');
    
    if (pointHistory.length === 0) {
        historyList.innerHTML = '<p class="text-sm text-gray-500 text-center">아직 활동 기록이 없습니다.</p>';
        return;
    }
    
    // Sort by most recent first
    const sortedHistory = [...pointHistory].sort((a, b) => new Date(b.activity_time) - new Date(a.activity_time));
    
    historyList.innerHTML = sortedHistory.map(entry => `
        <div class="flex items-center justify-between p-2 bg-white rounded border">
            <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-check text-purple-600 text-xs"></i>
                </div>
                <div>
                    <div class="text-sm font-medium text-gray-800">${entry.activity_description}</div>
                    <div class="text-xs text-gray-500">${new Date(entry.activity_time).toLocaleTimeString('ko-KR')}</div>
                </div>
            </div>
            <div class="text-sm font-semibold text-purple-600">+${entry.points_earned}</div>
        </div>
    `).join('');
}

// Toggle history display
function toggleHistory() {
    const history = document.getElementById('pointHistory');
    const toggle = document.getElementById('historyToggle');
    
    if (history.classList.contains('hidden')) {
        history.classList.remove('hidden');
        toggle.innerHTML = '<i class="fas fa-chevron-up mr-1"></i>숨기기';
        updateHistoryDisplay();
    } else {
        history.classList.add('hidden');
        toggle.innerHTML = '<i class="fas fa-chevron-down mr-1"></i>보기';
    }
}

// Show point section
function showPointSection() {
    const pointDisplay = document.getElementById('pointDisplaySection');
    const taskSection = document.getElementById('taskSection');
    if (pointDisplay) pointDisplay.classList.remove('hidden');
    if (taskSection) taskSection.classList.remove('hidden');
}

// ====== 교사 포인트 알림 시스템 ======

let teacherPointCheckInterval = null;
let pointRefreshInterval = null;
let lastCheckedTime = null;

// 디버깅용 수동 테스트 함수 (브라우저 콘솔에서 실행 가능)
window.debugTeacherNotificationSystem = async function() {
    console.log('=== MANUAL DEBUG TEST ===');
    console.log('Current student:', currentStudent);
    console.log('Last checked time:', lastCheckedTime);
    console.log('Interval running:', !!teacherPointCheckInterval);
    
    // Manual check
    await checkForNewTeacherPoints();
};

// 테스트용 가짜 알림 표시 함수
window.testNotification = function() {
    console.log('Testing notification display...');
    const fakePoint = {
        id: 'test_' + Date.now(),
        points_earned: 5,
        teacher_message: '테스트 메시지입니다',
        student_id: currentStudent?.studentId || 'test',
        activity_time: new Date().toISOString()
    };
    showTeacherPointNotification(fakePoint);
};

// Start checking for teacher points
function startTeacherPointNotificationCheck() {
    // Enhanced validation before starting
    if (!currentStudent) {
        console.log('Cannot start teacher point notification check: currentStudent is null');
        return;
    }
    
    if (!currentStudent.studentId) {
        console.log('Cannot start teacher point notification check: currentStudent.studentId is missing');
        console.log('currentStudent object:', currentStudent);
        return;
    }
    
    // Stop any existing interval first
    if (teacherPointCheckInterval) {
        console.log('Stopping existing teacher point check interval');
        clearInterval(teacherPointCheckInterval);
        teacherPointCheckInterval = null;
    }
    
    // Initialize last checked time to 10 minutes ago to catch recent points
    // This ensures we don't miss any teacher points that were given recently
    const tenMinutesAgo = new Date();
    tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);
    lastCheckedTime = tenMinutesAgo.toISOString();
    
    // Check every 3 seconds
    teacherPointCheckInterval = setInterval(checkForNewTeacherPoints, 3000);
    
    // Clean up any fake test data before starting
    cleanupFakeTestData();
    
    console.log('Teacher point notification check started successfully');
    console.log('Student ID:', currentStudent.studentId);
    console.log('Student Name:', currentStudent.name);
    console.log('Last checked time:', lastCheckedTime);
}

// Stop checking for teacher points
function stopTeacherPointNotificationCheck() {
    if (teacherPointCheckInterval) {
        clearInterval(teacherPointCheckInterval);
        teacherPointCheckInterval = null;
        console.log('Teacher point notification check stopped');
    }
}

// Clean up fake test data from localStorage
function cleanupFakeTestData() {
    try {
        const localHistory = JSON.parse(localStorage.getItem('pointHistory') || '[]');
        const cleanedHistory = localHistory.filter(record => 
            !record.id || !record.id.includes('teacher_test')
        );
        
        if (cleanedHistory.length !== localHistory.length) {
            localStorage.setItem('pointHistory', JSON.stringify(cleanedHistory));
            console.log('Cleaned up', localHistory.length - cleanedHistory.length, 'fake test records from localStorage');
        }
    } catch (error) {
        console.error('Error cleaning up fake test data:', error);
    }
}

// Check for new teacher points
async function checkForNewTeacherPoints() {
    // Enhanced null checks with detailed logging
    if (!currentStudent) {
        console.log('=== TEACHER POINT CHECK SKIPPED ===');
        console.log('Reason: currentStudent is null or undefined');
        console.log('currentStudent value:', currentStudent);
        return;
    }
    
    if (!lastCheckedTime) {
        console.log('=== TEACHER POINT CHECK SKIPPED ===');
        console.log('Reason: lastCheckedTime is null or undefined');
        console.log('lastCheckedTime value:', lastCheckedTime);
        return;
    }
    
    if (!currentStudent.studentId) {
        console.log('=== TEACHER POINT CHECK SKIPPED ===');
        console.log('Reason: currentStudent.studentId is missing');
        console.log('currentStudent object:', currentStudent);
        return;
    }
    
    try {
        // Query for ALL point_history records and filter client-side for reliability
        const response = await fetch(`tables/point_history?limit=1000&sort=-activity_time`);
        const data = await response.json();
        
        console.log('=== TEACHER POINT CHECK DEBUG ===');
        console.log('Current student:', currentStudent);
        console.log('Looking for student_id:', currentStudent?.studentId || 'UNDEFINED');
        console.log('Since time:', lastCheckedTime);
        console.log('Total point history records:', data.data?.length || 0);
        
        // Show first few records for debugging
        if (data.data && data.data.length > 0) {
            console.log('First 3 records:', data.data.slice(0, 3).map(r => ({
                id: r.id,
                student_id: r.student_id,
                source_type: r.source_type,
                activity_time: r.activity_time,
                notification_read: r.notification_read
            })));
        }
        
        if (data.data && data.data.length > 0) {
            // Filter for teacher points that haven't been shown as notification yet
            // Use ONLY notification_read flag - ignore time-based filtering completely
            const newTeacherPoints = data.data.filter(record => {
                const isTeacherPoint = record.source_type === 'teacher';
                const isForThisStudent = record.student_id === currentStudent.studentId;
                const notNotified = !record.notification_read; // Only condition that matters
                
                console.log('Checking record:', {
                    id: record.id,
                    isTeacherPoint,
                    isForThisStudent, 
                    notNotified,
                    activity_time: record.activity_time,
                    notification_read: record.notification_read,
                    student_name: record.student_name,
                    record_student_id: record.student_id,
                    current_student_id: currentStudent.studentId,
                    id_match: record.student_id === currentStudent.studentId
                });
                
                // Simple and reliable: only check notification status
                return isTeacherPoint && isForThisStudent && notNotified;
            });
            
            console.log('New teacher points to notify:', newTeacherPoints.length);
            
            // Show notifications for new teacher points
            for (const teacherPoint of newTeacherPoints) {
                console.log('Showing notification for:', teacherPoint.id);
                console.log('Teacher point full record:', teacherPoint);
                
                // Skip fake test data
                if (teacherPoint.id && teacherPoint.id.includes('teacher_test')) {
                    console.log('Skipping fake test notification:', teacherPoint.id);
                    continue;
                }
                
                showTeacherPointNotification(teacherPoint);
                
                // DON'T mark as read here - wait for user confirmation
                // Store the point ID for later confirmation
                teacherPoint._pendingConfirmation = true;
            }
            
            // If there were new teacher points, refresh the point display
            if (newTeacherPoints.length > 0) {
                await refreshStudentPoints();
            }
        }
        
        // Update last checked time only after successful processing
        // Note: We don't rely on lastCheckedTime for filtering anymore, 
        // but we keep it for debugging and potential future use
        const currentTime = new Date().toISOString();
        console.log('Updating lastCheckedTime from', lastCheckedTime, 'to', currentTime);
        lastCheckedTime = currentTime;
        
    } catch (error) {
        console.error('Error checking for teacher points:', error);
        
        // Fallback to localStorage check
        checkForTeacherPointsInLocalStorage();
    }
}

// Fallback check for teacher points in localStorage
function checkForTeacherPointsInLocalStorage() {
    if (!currentStudent || !lastCheckedTime) return;
    
    try {
        const localHistory = JSON.parse(localStorage.getItem('pointHistory') || '[]');
        
        const newTeacherPoints = localHistory.filter(record =>
            record.source_type === 'teacher' &&
            record.student_id === currentStudent.studentId &&
            !record.notification_read
        );
        
        for (const teacherPoint of newTeacherPoints) {
            // Skip fake test data
            if (teacherPoint.id && teacherPoint.id.includes('teacher_test')) {
                console.log('Skipping fake test notification from localStorage:', teacherPoint.id);
                // Mark as read to prevent future notifications
                teacherPoint.notification_read = true;
                continue;
            }
            
            showTeacherPointNotification(teacherPoint);
            
            // Mark as read in localStorage
            teacherPoint.notification_read = true;
        }
        
        if (newTeacherPoints.length > 0) {
            localStorage.setItem('pointHistory', JSON.stringify(localHistory));
            refreshStudentPoints();
        }
        
        lastCheckedTime = new Date().toISOString();
        
    } catch (error) {
        console.error('Error checking localStorage for teacher points:', error);
    }
}

// Show teacher point notification
function showTeacherPointNotification(teacherPoint) {
    const pointValue = teacherPoint.points_earned;
    const teacherMessage = teacherPoint.teacher_message;
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-gradient-to-r from-purple-400 to-pink-400 text-white px-6 py-4 rounded-xl shadow-2xl z-50 border-2 border-white';
    notification.style.minWidth = '360px';
    // Store the point ID for confirmation
    notification.dataset.pointId = teacherPoint.id;
    
    notification.innerHTML = `
        <div class="flex items-start space-x-3">
            <div class="flex-shrink-0">
                <i class="fas fa-gift text-2xl mt-1"></i>
            </div>
            <div class="flex-1">
                <div class="font-bold text-sm mb-2">
                    선생님께서 ${pointValue > 0 ? '+' : ''}${pointValue} 포인트를 주셨습니다
                </div>
                <div class="text-sm bg-white bg-opacity-20 rounded-lg px-3 py-2 mb-3">
                    "${teacherMessage}"
                </div>
                <div class="text-center">
                    <button onclick="confirmTeacherNotification(this)" class="bg-white bg-opacity-30 hover:bg-opacity-40 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 border border-white border-opacity-30">
                        <i class="fas fa-check mr-2"></i>확인
                    </button>
                </div>
            </div>
            <button onclick="confirmTeacherNotification(this)" class="flex-shrink-0 text-white hover:text-gray-200 transition-colors">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="absolute -top-1 -right-1">
            <div class="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Add entrance animation with gentle bounce
    notification.style.transform = 'translateX(400px) scale(0.8)';
    notification.style.transition = 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
    setTimeout(() => {
        notification.style.transform = 'translateX(0) scale(1)';
    }, 100);
    
    // Play improved notification sound
    playImprovedNotificationSound();
    
    // Optional: Auto-close after 15 seconds if not manually closed
    setTimeout(() => {
        if (notification.parentNode) {
            closeTeacherNotification(notification.querySelector('button'));
        }
    }, 15000);
}

// Confirm teacher notification (with database update)
async function confirmTeacherNotification(buttonElement) {
    const notification = buttonElement.closest('div[class*="fixed"]');
    if (!notification) return;
    
    const pointId = notification.dataset.pointId;
    console.log('Confirming teacher notification for point ID:', pointId);
    
    // Update database to mark as read
    if (pointId) {
        try {
            const updateResponse = await fetch(`tables/point_history/${pointId}`, {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ notification_read: true })
            });
            
            if (updateResponse.ok) {
                console.log('Successfully marked notification as read for point:', pointId);
            } else {
                console.error('Failed to mark notification as read:', updateResponse.status);
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
            
            // Fallback: mark as read in localStorage if API fails
            try {
                const localHistory = JSON.parse(localStorage.getItem('pointHistory') || '[]');
                const pointIndex = localHistory.findIndex(p => p.id === pointId);
                if (pointIndex >= 0) {
                    localHistory[pointIndex].notification_read = true;
                    localStorage.setItem('pointHistory', JSON.stringify(localHistory));
                    console.log('Marked as read in localStorage as fallback');
                }
            } catch (localError) {
                console.error('Fallback localStorage update failed:', localError);
            }
        }
    }
    
    // Close notification with animation
    closeTeacherNotification(notification);
}

// Close teacher notification function (UI only)
function closeTeacherNotification(notificationElement) {
    if (notificationElement) {
        // Exit animation
        notificationElement.style.transform = 'translateX(400px) scale(0.8)';
        notificationElement.style.opacity = '0';
        setTimeout(() => {
            if (notificationElement.parentNode) {
                notificationElement.remove();
            }
        }, 300);
    }
}

// Play improved notification sound (gentle and pleasant)
function playImprovedNotificationSound() {
    try {
        // Create audio context
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create multiple oscillators for a rich, gentle sound
        const osc1 = audioContext.createOscillator();
        const osc2 = audioContext.createOscillator();
        const osc3 = audioContext.createOscillator();
        
        const gain1 = audioContext.createGain();
        const gain2 = audioContext.createGain();
        const gain3 = audioContext.createGain();
        const masterGain = audioContext.createGain();
        
        // Connect oscillators through individual gain nodes to master gain
        osc1.connect(gain1);
        osc2.connect(gain2);
        osc3.connect(gain3);
        
        gain1.connect(masterGain);
        gain2.connect(masterGain);
        gain3.connect(masterGain);
        masterGain.connect(audioContext.destination);
        
        // Set gentle, pleasant frequencies (much lower than before)
        // Using pleasant chord progression: C4 (261.63Hz) -> E4 (329.63Hz) -> G4 (392Hz)
        osc1.frequency.setValueAtTime(261.63, audioContext.currentTime); // C4
        osc2.frequency.setValueAtTime(329.63, audioContext.currentTime + 0.1); // E4
        osc3.frequency.setValueAtTime(392, audioContext.currentTime + 0.2); // G4
        
        // Use sine waves for smoother, gentler sound
        osc1.type = 'sine';
        osc2.type = 'sine';
        osc3.type = 'sine';
        
        // Set gentle volume levels
        gain1.gain.setValueAtTime(0.15, audioContext.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
        
        gain2.gain.setValueAtTime(0, audioContext.currentTime);
        gain2.gain.setValueAtTime(0.12, audioContext.currentTime + 0.1);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.7);
        
        gain3.gain.setValueAtTime(0, audioContext.currentTime);
        gain3.gain.setValueAtTime(0.1, audioContext.currentTime + 0.2);
        gain3.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
        
        // Master volume control
        masterGain.gain.setValueAtTime(0.4, audioContext.currentTime);
        
        // Start and stop oscillators with slight overlap for smoothness
        osc1.start(audioContext.currentTime);
        osc2.start(audioContext.currentTime + 0.1);
        osc3.start(audioContext.currentTime + 0.2);
        
        osc1.stop(audioContext.currentTime + 0.6);
        osc2.stop(audioContext.currentTime + 0.7);
        osc3.stop(audioContext.currentTime + 0.8);
        
    } catch (error) {
        console.log('Could not play improved notification sound:', error);
    }
}

// Play notification sound (legacy - keeping for compatibility)
function playNotificationSound() {
    try {
        // Create audio context and play a simple tone
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
        console.log('Could not play notification sound:', error);
    }
}

// Refresh student points (called when teacher points are received)
async function refreshStudentPoints() {
    if (!currentStudent) return;
    
    try {
        // Reload point data using existing functions
        await loadDailyPoints();
        await loadPointHistory();
        
        // Update display
        updatePointDisplay();
        
    } catch (error) {
        console.error('Error refreshing student points:', error);
    }
}

// ============ PERSONAL MESSAGE SYSTEM ============

// Load personal messages for current student
async function loadPersonalMessages() {
    if (!currentStudent) return;
    
    try {
        // Supabase 직접 사용하여 개인 메시지 로드
        const client = getSupabaseClient();
        let allMessages = [];
        
        if (client) {
            console.log('[Messages] teacher_messages 테이블에서 메시지 로드 시작');
            const { data, error } = await client
                .from('teacher_messages')
                .select('*')
                .order('sent_at', { ascending: false });
                
            if (!error && data) {
                allMessages = data;
                console.log(`[Messages] Supabase에서 ${allMessages.length}개 메시지 로드 성공`);
            } else {
                console.warn('[Messages] Supabase 로드 실패:', error);
            }
        }
        
        // 폴백 1: REST API 시도
        if (allMessages.length === 0) {
            console.log('[Messages] REST API 폴백 시도');
            try {
                const response = await smartFetch('tables/teacher_messages');
                if (response.ok) {
                    const result = await response.json();
                    allMessages = result.data || [];
                    console.log(`[Messages] REST API에서 ${allMessages.length}개 메시지 로드 성공`);
                }
            } catch (apiError) {
                console.warn('[Messages] REST API 폴백도 실패:', apiError);
            }
        }
        
        // 폴백 2: localStorage에서 로드
        if (allMessages.length === 0) {
            console.log('[Messages] localStorage 폴백 시도');
            allMessages = JSON.parse(localStorage.getItem('teacher_messages') || '[]');
            console.log(`[Messages] localStorage에서 ${allMessages.length}개 메시지 로드`);
        }
        
        // Filter messages for current student (both received and sent)
        // 포인트 관련 자동 메시지 제외 - 교사가 직접 보낸 메시지만 표시
        console.log(`[Messages] 메시지 필터링 시작 - 현재 학생: ${currentStudent.studentId || currentStudent.student_id}`);
        console.log(`[Messages] 전체 메시지 수: ${allMessages.length}`);
        
        personalMessages = allMessages.filter(msg => {
            const studentId = currentStudent.studentId || currentStudent.student_id || currentStudent.id;
            
            // 학생이 보낸 답장
            if (msg.sender_type === 'student' && (msg.sender_id === studentId || msg.sender_id === String(studentId))) {
                console.log(`[Messages] 학생 답장 메시지 발견: ${msg.message?.substring(0, 30)}`);
                return true;
            }
            
            // 교사가 보낸 메시지 (포인트 자동 메시지 제외)
            if ((msg.recipient_id === studentId || msg.recipient_id === String(studentId)) && msg.sender_type === 'teacher') {
                console.log(`[Messages] 교사 메시지 후보: "${msg.message?.substring(0, 30)}" (수신자: ${msg.recipient_id})`);
                
                
                // 포인트 관련 자동 메시지 필터링
                const isAutoMessage = msg.message && (
                    msg.message.includes('포인트가 승인되었습니다') ||
                    msg.message.includes('포인트를 획득했습니다') ||
                    msg.message.includes('김밥추가가 승인되었습니다') ||
                    msg.message.includes('김밥말기가 승인되었습니다') ||
                    msg.message.includes('김밥썰기가 승인되었습니다') ||
                    msg.message.includes('포인트가 지급되었습니다') ||
                    (msg.message.includes('포인트') && msg.message.includes('승인'))
                );
                
                if (isAutoMessage) {
                    console.log(`[Messages] 자동 메시지 제외: "${msg.message?.substring(0, 30)}"`);
                } else {
                    console.log(`[Messages] 교사 메시지 포함: "${msg.message?.substring(0, 30)}"`);
                }
                
                // 자동 메시지가 아닌 경우만 포함
                return !isAutoMessage;
            }
            
            return false;
        });
        
        console.log(`[Messages] 필터링 완료 - 개인 메시지 수: ${personalMessages.length}`);
        if (personalMessages.length > 0) {
            personalMessages.forEach((msg, index) => {
                console.log(`[Messages] 개인 메시지 ${index + 1}: "${msg.message?.substring(0, 40)}" (발신: ${msg.sender_name})`);
            });
        }
        
        displayPersonalMessages();
        
        // Mark unread teacher messages as read
        await markTeacherMessagesAsRead();
    } catch (error) {
        console.error('Error loading personal messages:', error);
        
        // Fallback to localStorage
        try {
            const localMessages = JSON.parse(localStorage.getItem('personalMessages') || '[]');
            // 포인트 관련 자동 메시지 제외 - 교사가 직접 보낸 메시지만 표시
            personalMessages = localMessages.filter(msg => {
                // 학생이 보낸 답장
                if (msg.sender_type === 'student' && msg.sender_id === currentStudent.studentId) {
                    return true;
                }
                
                // 교사가 보낸 메시지 (포인트 자동 메시지 제외)
                if (msg.recipient_id === currentStudent.studentId && msg.sender_type === 'teacher') {
                    // 포인트 관련 자동 메시지 필터링
                    const isAutoMessage = msg.message && (
                        msg.message.includes('포인트가 승인되었습니다') ||
                        msg.message.includes('포인트를 획득했습니다') ||
                        msg.message.includes('김밥추가가 승인되었습니다') ||
                        msg.message.includes('김밥말기가 승인되었습니다') ||
                        msg.message.includes('김밥썰기가 승인되었습니다') ||
                        msg.message.includes('포인트가 지급되었습니다') ||
                        (msg.message.includes('포인트') && msg.message.includes('승인'))
                    );
                    
                    // 자동 메시지가 아닌 경우만 포함
                    return !isAutoMessage;
                }
                
                return false;
            });
            displayPersonalMessages();
        } catch (localError) {
            console.error('Fallback message load failed:', localError);
        }
    }
}

// Display personal messages in the UI
function displayPersonalMessages() {
    const container = document.getElementById('personalMessagesContainer');
    if (!container) return;
    
    if (personalMessages.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-400 py-6 flex flex-col items-center justify-center" style="height: 100%;">
                <i class="fas fa-envelope text-4xl mb-3 text-gray-300"></i>
                <p style="font-size: 0.95rem; font-weight: 500;">받은 메시지가 없습니다</p>
            </div>
        `;
        return;
    }
    
    // 답장하지 않은 + 24시간 이내 교사 메시지만 필터링 (개선된 로직)
    const now = new Date();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000; // 24시간을 밀리초로
    
    const unrepliedTeacherMessages = personalMessages.filter(msg => {
        // 1. 교사가 보낸 원본 메시지만 (답장이 아닌)
        if (msg.sender_type !== 'teacher' || msg.reply_to) {
            return false;
        }
        
        // 2. 학생의 답장이 있는지 확인 (답장이 있으면 제외)
        const hasStudentReply = personalMessages.some(reply => 
            reply.reply_to === msg.id && reply.sender_type === 'student'
        );
        if (hasStudentReply) {
            return false;
        }
        
        // 3. 24시간 이내 메시지인지 확인 (24시간 초과하면 제외)
        const timeDiff = now - new Date(msg.sent_at);
        if (timeDiff > TWENTY_FOUR_HOURS) {
            return false;
        }
        
        return true; // 모든 조건을 통과한 메시지만 표시
    });
    
    // 최신순 정렬 후 1개만 선택
    unrepliedTeacherMessages.sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at));
    const displayMessages = unrepliedTeacherMessages.slice(0, 1);
    
    container.innerHTML = `
        <div class="message-list-container">
            ${displayMessages.length > 0 ? displayMessages.map((msg, index) => {
                const isUnread = !msg.is_read;
                const reply = personalMessages.find(m => m.reply_to === msg.id && m.sender_type === 'student');
                
                return `
                    <div class="message-list-item ${index === 0 ? 'first-item' : ''}" onclick="viewMessageDetail('${msg.id}')">
                        <div class="message-item-content" style="padding-left: 0.5rem;">
                            <div class="message-text">
                                ${msg.message}
                            </div>
                            <div class="message-meta">
                                <span class="message-date">${new Date(msg.sent_at).toLocaleDateString('ko-KR', {year: 'numeric', month: 'numeric', day: 'numeric'}). replace(/\. /g, '. ').replace(/\.$/, '')} ${new Date(msg.sent_at).toLocaleTimeString('ko-KR', {hour: '2-digit', minute: '2-digit', hour12: true})}</span>
                                ${isUnread ? '<span class="new-badge">NEW</span>' : ''}
                            </div>
                        </div>
                    </div>
                `;
            }).join('') : `
                <div class="text-center text-gray-400 py-6 flex flex-col items-center justify-center" style="height: 100%;">
                    <i class="fas fa-envelope text-4xl mb-3 text-gray-300"></i>
                    <p style="font-size: 0.95rem; font-weight: 500;">받은 메시지가 없습니다</p>
                </div>
            `}
        </div>
    `;
}

// Mark teacher messages as read
async function markTeacherMessagesAsRead() {
    const unreadTeacherMessages = personalMessages.filter(msg => 
        msg.sender_type === 'teacher' && 
        msg.recipient_id === currentStudent.studentId && 
        !msg.is_read
    );
    
    for (const msg of unreadTeacherMessages) {
        try {
            // Use Supabase wrapper to update message read status
            const response = await smartFetch(`tables/teacher_messages/${msg.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    is_read: true,
                    read_at: new Date().toISOString()
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            // Update local copy
            msg.is_read = true;
            msg.read_at = new Date().toISOString();
            
        } catch (error) {
            console.error('Error marking message as read:', error);
        }
    }
}

// Start reply to a message - 플립 카드 버전
function startReply(messageId, senderName) {
    currentReplyMessage = messageId;
    
    // 플립 카드를 뒤집기
    const messageFlipCard = document.getElementById('messageFlipCard');
    const replyContent = document.getElementById('replyContent');
    
    if (messageFlipCard) {
        messageFlipCard.classList.add('flipped');
    }
    
    if (replyContent) {
        replyContent.placeholder = `${senderName}께 답장을 작성하세요...`;
        setTimeout(() => {
            replyContent.focus();
        }, 300); // 플립 애니메이션 후 포커스
    }
}

// Cancel reply - 플립 카드 버전
function cancelReply() {
    currentReplyMessage = null;
    
    // 플립 카드를 원래대로
    const messageFlipCard = document.getElementById('messageFlipCard');
    const replyContent = document.getElementById('replyContent');
    
    if (messageFlipCard) {
        messageFlipCard.classList.remove('flipped');
    }
    
    if (replyContent) {
        replyContent.value = '';
    }
}

// Flip message card function
function flipMessageCard() {
    const messageFlipCard = document.getElementById('messageFlipCard');
    if (messageFlipCard) {
        // 플립 상태를 토글
        if (messageFlipCard.classList.contains('flipped')) {
            // 뒷면에서 앞면으로
            cancelReply();
        } else {
            // 앞면에서 뒷면으로 (최신 메시지에 대한 답장 시작)
            const latestMessage = personalMessages.find(msg => msg.sender_type === 'teacher' && !msg.reply_to);
            if (latestMessage) {
                startReply(latestMessage.id, latestMessage.sender_name || '선생님');
            }
        }
    }
}

// Send reply
async function sendReply() {
    if (!currentReplyMessage || !currentStudent) {
        showError('답장을 보낼 수 없습니다.');
        return;
    }
    
    const replyContent = document.getElementById('replyContent');
    if (!replyContent) {
        showError('답장 입력창을 찾을 수 없습니다.');
        return;
    }
    
    const message = replyContent.value.trim();
    if (!message) {
        showError('답장 내용을 입력해주세요.');
        return;
    }
    
    try {
        const replyRecord = {
            id: `reply_${Date.now()}_${currentStudent.studentId}`,
            sender_type: 'student',
            sender_id: currentStudent.studentId,
            sender_name: currentStudent.name,
            recipient_id: 'admin', // Teacher
            recipient_name: '선생님',
            message: message,
            sent_at: new Date().toISOString(),
            read_at: null,
            is_read: false,
            reply_to: currentReplyMessage
        };
        
        console.log('Sending student reply:', replyRecord);
        
        // Save to database using Supabase wrapper
        const response = await smartFetch('tables/teacher_messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(replyRecord)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const savedReply = await response.json();
        
        // Show success message
        showSuccess('선생님께 답장을 보냈습니다.');
        
        // Add to local messages and refresh display
        personalMessages.unshift(replyRecord);
        
        // Clear reply form
        replyContent.value = '';
        cancelReply();
        
        // Refresh display to hide the replied message
        setTimeout(() => {
            displayPersonalMessages();
        }, 100);
        
    } catch (error) {
        console.error('Error sending reply:', error);
        showError('답장 전송에 실패했습니다. 다시 시도해주세요.');
        
        // Fallback to localStorage
        try {
            const localMessages = JSON.parse(localStorage.getItem('personalMessages') || '[]');
            localMessages.unshift(replyRecord);
            localStorage.setItem('personalMessages', JSON.stringify(localMessages));
            
            personalMessages.unshift(replyRecord);
            displayPersonalMessages();
            cancelReply();
            
            showSuccess('답장을 보냈습니다. (로컬 저장)');
        } catch (localError) {
            console.error('Fallback localStorage save failed:', localError);
        }
    }
}

// View message detail (for message list click)
function viewMessageDetail(messageId) {
    const msg = personalMessages.find(m => m.id === messageId);
    if (!msg) return;
    
    // Mark as read if from teacher
    if (msg.sender_type === 'teacher' && !msg.is_read) {
        markTeacherMessagesAsRead();
    }
    
    // 플립 카드를 뒤집어서 답장 화면 표시
    if (msg.sender_type === 'teacher') {
        startReply(messageId, msg.sender_name || '선생님');
    }
}

// Start checking for new personal messages
function startPersonalMessageCheck() {
    if (!currentStudent) return;
    
    // Check every 30 seconds for new messages (최적화: 5초 → 30초)
    messageCheckInterval = setInterval(loadPersonalMessages, 30000);
    
    // Load messages immediately
    loadPersonalMessages();
    
    console.log('Personal message check started for student:', currentStudent.studentId);
}

// Stop checking for personal messages
function stopPersonalMessageCheck() {
    if (messageCheckInterval) {
        clearInterval(messageCheckInterval);
        messageCheckInterval = null;
        console.log('Personal message check stopped');
    }
}

// Hide point section
function hidePointSection() {
    const pointDisplay = document.getElementById('pointDisplaySection');
    const taskSection = document.getElementById('taskSection');
    if (pointDisplay) pointDisplay.classList.add('hidden');
    if (taskSection) taskSection.classList.add('hidden');
}

// Animate point earned effect
function animatePointEarned(stage, points) {
    const btn = document.getElementById(`stage${stage}Btn`);
    
    // Create floating point animation
    const pointElement = document.createElement('div');
    pointElement.textContent = `+${points}`;
    pointElement.className = 'fixed text-sm font-bold text-yellow-500 pointer-events-none z-50';
    pointElement.style.left = btn.getBoundingClientRect().left + 'px';
    pointElement.style.top = btn.getBoundingClientRect().top + 'px';
    
    document.body.appendChild(pointElement);
    
    // Animate upward and fade
    setTimeout(() => {
        pointElement.style.transition = 'all 1s ease-out';
        pointElement.style.transform = 'translateY(-50px)';
        pointElement.style.opacity = '0';
        
        setTimeout(() => {
            pointElement.remove();
        }, 1000);
    }, 100);
    
    // Button pulse effect
    btn.classList.add('animate-pulse');
    setTimeout(() => {
        btn.classList.remove('animate-pulse');
    }, 1000);
}

// ============ BOARD MANAGEMENT FUNCTIONS ============

// Start board auto-update when role section is shown
const originalShowRoleFunction = showRole;
showRole = function() {
    originalShowRoleFunction();
    startBoardAutoUpdate();
};

// Stop board auto-update on logout (이미 재정의된 logout 함수 수정)
const originalLogoutWithApprovalStop = logout;
logout = function() {
    stopBoardAutoUpdate();
    originalLogoutWithApprovalStop();
};

// Start automatic board content updates
function startBoardAutoUpdate() {
    // Load board content immediately
    loadBoardContent();
    
    // Set up periodic updates every 3 seconds
    if (boardUpdateInterval) {
        clearInterval(boardUpdateInterval);
    }
    
    boardUpdateInterval = setInterval(() => {
        loadBoardContent();
    }, 3000); // Update every 3 seconds
}

// Stop automatic board updates
function stopBoardAutoUpdate() {
    if (boardUpdateInterval) {
        clearInterval(boardUpdateInterval);
        boardUpdateInterval = null;
    }
}

// Load board content from database
async function loadBoardContent() {
    try {
        // 학습안내 앞면 내용 로드
        await loadLearningGuideFrontContent();
        
        // 실시간 칠판 내용 로드 (기존 로직 유지)
        const response = await fetch('tables/board_content');
        if (response.ok) {
            const data = await response.json();
            const boards = data.data || [];
            
            const liveBoard = boards.find(b => b.board_type === 'live_board');
            
            // Update live board
            const liveBoardElement = document.getElementById('liveBoardContent');
            if (liveBoardElement) {
                const liveContent = liveBoard ? liveBoard.content : '';
                const currentContent = liveContent || '선생님 말씀이 없습니다.';
                
                // 내용이 변경되었는지 확인 (디버깅용)
                if (liveBoardElement.textContent !== currentContent) {
                    console.log('실시간 칠판 내용 업데이트:', currentContent);
                }
                
                liveBoardElement.textContent = currentContent;
            }
        }
    } catch (error) {
        console.log('Failed to load board content, using fallback');
        
        // Fallback to localStorage
        const localBoardData = JSON.parse(localStorage.getItem('boardContent') || '{}');
        
        const fixedNoticeElement = document.getElementById('fixedNoticeBoard');
        if (fixedNoticeElement) {
            fixedNoticeElement.textContent = localBoardData.fixed_notice || '공지사항이 없습니다.';
        }
        
        const liveBoardElement = document.getElementById('liveBoardContent');
        if (liveBoardElement) {
            liveBoardElement.textContent = localBoardData.live_board || '칠판이 비어있습니다.';
        }
    }
}

// 학습안내 앞면 내용 로드 함수
async function loadLearningGuideFrontContent() {
    const fixedNoticeElement = document.getElementById('fixedNoticeBoard');
    if (!fixedNoticeElement) return;

    try {
        // smartFetch를 사용하여 학습안내 데이터 로드
        const response = await smartFetch('tables/learning_guides?limit=1');
        
        if (!response.ok) {
            throw new Error('학습안내 데이터를 불러올 수 없습니다.');
        }
        
        const result = await response.json();
        
        if (!result.data || result.data.length === 0) {
            // 데이터가 없으면 기본 메시지 표시
            fixedNoticeElement.innerHTML = `
                <div class="text-center text-gray-500 py-4">
                    <i class="fas fa-book-open text-3xl mb-2 text-blue-400"></i>
                    <p style="font-size: 0.8rem;">클릭하여 자료링크 확인</p>
                    <div class="mt-2">
                        <i class="fas fa-mouse-pointer text-blue-500 animate-bounce"></i>
                    </div>
                </div>
            `;
            return;
        }
        
        const learningGuides = result.data[0];
        const frontContent = learningGuides.front_content;
        
        if (!frontContent || frontContent.trim() === '' || frontContent === '아직 학습안내가 없습니다.') {
            // 앞면 내용이 없거나 기본값이면 기본 UI 표시
            fixedNoticeElement.innerHTML = `
                <div class="text-center text-gray-500 py-4">
                    <i class="fas fa-book-open text-3xl mb-2 text-blue-400"></i>
                    <p style="font-size: 0.8rem;">클릭하여 자료링크 확인</p>
                    <div class="mt-2">
                        <i class="fas fa-mouse-pointer text-blue-500 animate-bounce"></i>
                    </div>
                </div>
            `;
        } else {
            // 앞면 내용이 있으면 표시 (스마트 링크 변환 적용)
            const processedContent = processSmartLinks(frontContent);
            fixedNoticeElement.innerHTML = `
                <div class="notice-card">
                    <div class="notice-content text-sm text-gray-700">${processedContent}</div>
                    <div class="notice-date text-xs text-gray-500 mt-2">
                        ${learningGuides.updated_at ? new Date(learningGuides.updated_at).toLocaleDateString('ko-KR') : ''}
                    </div>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('앞면 내용 로드 오류:', error);
        
        // 로컬스토리지 폴백 시도
        try {
            const localData = JSON.parse(localStorage.getItem('learningGuides') || '{}');
            const frontContent = localData.front_content;
            
            if (frontContent && frontContent.trim() !== '' && frontContent !== '아직 학습안내가 없습니다.') {
                const processedContent = processSmartLinks(frontContent);
                fixedNoticeElement.innerHTML = `
                    <div class="notice-card">
                        <div class="notice-content text-sm text-gray-700">${processedContent}</div>
                        <div class="notice-date text-xs text-gray-500 mt-2">${new Date().toLocaleDateString('ko-KR')}</div>
                    </div>
                `;
            } else {
                throw error;
            }
        } catch (fallbackError) {
            // 모든 시도 실패 시 기본 UI 표시
            fixedNoticeElement.innerHTML = `
                <div class="text-center text-gray-500 py-4">
                    <i class="fas fa-book-open text-3xl mb-2 text-blue-400"></i>
                    <p style="font-size: 0.8rem;">클릭하여 자료링크 확인</p>
                    <div class="mt-2">
                        <i class="fas fa-mouse-pointer text-blue-500 animate-bounce"></i>
                    </div>
                </div>
            `;
        }
    }
}

// ============ LEARNING GUIDE SYSTEM ============

// 전역 변수
let isLearningGuideFlipped = false;

// 학습안내 데이터베이스 스키마 초기화
async function initializeLearningGuidesSchema() {
    try {
        // Check if TableSchemaUpdate is available (only in admin context)
        if (typeof TableSchemaUpdate === 'undefined') {
            console.log('TableSchemaUpdate not available in student context');
            return;
        }
        
        await TableSchemaUpdate('learning_guides', [
            { name: 'id', type: 'text', description: 'Unique identifier' },
            { name: 'front_content', type: 'text', description: 'Front card common content for all grades' },
            { name: 'grade_1', type: 'text', description: 'Grade 1 learning guide content' },
            { name: 'grade_2', type: 'text', description: 'Grade 2 learning guide content' },
            { name: 'grade_3', type: 'text', description: 'Grade 3 learning guide content' },
            { name: 'grade_4', type: 'text', description: 'Grade 4 learning guide content' },
            { name: 'grade_5', type: 'text', description: 'Grade 5 learning guide content' },
            { name: 'grade_6', type: 'text', description: 'Grade 6 learning guide content' },
            { name: 'updated_at', type: 'datetime', description: 'Last updated time' }
        ]);
        console.log('Learning guides schema initialized successfully (student side)');
    } catch (error) {
        console.error('Failed to initialize learning guides schema (student side):', error);
    }
}

// 학습안내 전체 카드 토글 함수
function toggleLearningGuideCard() {
    const card = document.getElementById('learningGuideFlipCard');
    if (!card) return;
    
    if (isLearningGuideFlipped) {
        // 뒤집힌 상태에서 원래 상태로
        card.classList.remove('flipped');
        isLearningGuideFlipped = false;
    } else {
        // 원래 상태에서 뒤집기
        card.classList.add('flipped');
        isLearningGuideFlipped = true;
        
        // 뒤집을 때 내용 로드
        loadLearningGuideContent();
    }
}

// 학생 ID에서 학년 추출 함수
function extractGradeFromStudentId(studentId) {
    if (!studentId || studentId.length < 4) {
        return null;
    }
    
    // 학생 ID의 첫 번째 자릿수가 학년 (예: 4103 → 4학년)
    const gradeNumber = parseInt(studentId.charAt(0));
    
    // 1-6학년 범위 확인
    if (gradeNumber >= 1 && gradeNumber <= 6) {
        return gradeNumber;
    }
    
    return null;
}

// 학습안내 내용 로드 함수
async function loadLearningGuideContent() {
    const contentElement = document.getElementById('learningGuideContent');
    if (!contentElement) return;
    
    // 로딩 상태 표시 (간단하게)
    contentElement.innerHTML = `
        <div class="text-center text-white py-8">
            <i class="fas fa-spinner fa-spin text-2xl"></i>
        </div>
    `;
    
    try {
        // 현재 로그인한 학생 정보 확인
        if (!currentStudent || !currentStudent.id) {
            throw new Error('로그인 정보가 없습니다.');
        }
        
        // 학생 ID에서 학년 추출
        const studentGrade = extractGradeFromStudentId(currentStudent.id);
        if (!studentGrade) {
            throw new Error('학년 정보를 추출할 수 없습니다.');
        }
        
        // smartFetch를 사용하여 학습안내 데이터 로드
        const response = await smartFetch('tables/learning_guides?limit=1');
        
        if (!response.ok) {
            throw new Error('학습안내 데이터를 불러올 수 없습니다.');
        }
        
        const result = await response.json();
        
        if (!result.data || result.data.length === 0) {
            throw new Error('등록된 학습안내가 없습니다.');
        }
        
        const learningGuides = result.data[0];
        const gradeFieldName = `grade_${studentGrade}`;
        const gradeContent = learningGuides[gradeFieldName];
        
        if (!gradeContent || gradeContent.trim() === '') {
            contentElement.innerHTML = `
                <div class="text-center text-white py-8">
                    <i class="fas fa-info-circle text-2xl mb-2"></i>
                    <p>${studentGrade}학년 학습안내가 아직 등록되지 않았습니다.</p>
                </div>
            `;
            return;
        }
        
        // 스마트 링크 변환 후 내용 표시 (헤더 없이 내용만)
        const processedContent = processSmartLinks(gradeContent);
        contentElement.innerHTML = `
            <div class="learning-guide-content">
                <div class="space-y-3 text-white">
                    ${processedContent}
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error('학습안내 로드 오류:', error);
        
        // 네트워크 오류인지 확인
        const isNetworkError = !navigator.onLine || error.message.includes('Failed to fetch') || error.message.includes('NetworkError');
        
        // 로컬스토리지 폴백 시도
        try {
            const localData = JSON.parse(localStorage.getItem('learningGuides') || '{}');
            const studentGrade = extractGradeFromStudentId(currentStudent?.id);
            
            if (studentGrade && localData[`grade_${studentGrade}`]) {
                // 로컬 데이터가 있으면 헤더 없이 내용만 표시
                const processedContent = processSmartLinks(localData[`grade_${studentGrade}`]);
                contentElement.innerHTML = `
                    <div class="learning-guide-content">
                        <div class="space-y-3 text-white">
                            ${processedContent}
                        </div>
                    </div>
                `;
            } else {
                throw error;
            }
        } catch (fallbackError) {
            // 오류 발생 시 간단한 메시지만 표시
            contentElement.innerHTML = `
                <div class="text-center text-white py-8">
                    <i class="fas fa-info-circle text-2xl mb-2"></i>
                    <p>학습안내를 불러올 수 없습니다.</p>
                </div>
            `;
        }
    }
}

// 스마트 링크 처리 함수 - URL 자동 감지 및 클릭 가능한 링크로 변환
function processSmartLinks(content) {
    if (!content) return '';
    
    // URL 정규식 (http:// 또는 https://로 시작하는 링크)
    const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/gi;
    
    // 줄바꿈을 <br>로 변환
    let processedContent = content.replace(/\n/g, '<br>');
    
    // URL을 클릭 가능한 링크로 변환
    processedContent = processedContent.replace(urlRegex, function(match, url) {
        // URL에서 도메인 추출하여 표시명 생성
        let displayName = url;
        try {
            const urlObj = new URL(url);
            displayName = urlObj.hostname.replace('www.', '') + urlObj.pathname;
            if (displayName.length > 50) {
                displayName = displayName.substring(0, 47) + '...';
            }
        } catch (e) {
            // URL 파싱 실패 시 원본 사용
        }
        
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="guide-link" 
                   onclick="event.stopPropagation()">
                    <i class="fas fa-external-link-alt mr-1"></i>${displayName}
                </a>`;
    });
    
    // 단락 처리 (빈 줄로 구분된 텍스트를 <p> 태그로 감싸기)
    const paragraphs = processedContent.split('<br><br>').map(paragraph => {
        if (paragraph.trim()) {
            return `<p>${paragraph.trim()}</p>`;
        }
        return '';
    }).filter(p => p);
    
    return paragraphs.join('');
}

// 학습안내 시스템 초기화 (학생 로그인 후 호출)
function initializeLearningGuideSystem() {
    // 고정공지사항 로드 (학습안내 앞면에 표시)
    loadBoardContent();
    
    // 학습안내 카드가 이미 뒤집혀 있다면 내용 로드
    if (isLearningGuideFlipped) {
        loadLearningGuideContent();
    }
}

// ============ 임시 ASSIGNMENT 수정 함수 (디버깅용) ============

// 브라우저 콘솔에서 직접 실행할 수 있는 assignment 수정 함수
window.debugFixAssignment = async function(studentId) {
    console.log('🔧 [Debug Fix] 학생', studentId, 'assignment 수정 시작...');
    
    try {
        if (!studentId) {
            studentId = currentStudent?.studentId || '3127';
        }
        
        console.log('🔧 [Debug Fix] 대상 학생 ID:', studentId);
        
        // Supabase 직접 사용
        const client = getSupabaseClient();
        if (!client) {
            throw new Error('Supabase client가 없습니다');
        }
        
        // 1단계: 해당 학생의 assignments 조회
        console.log('📋 1단계: assignments 조회...');
        const { data: assignments, error: assignError } = await client
            .from('assignments')
            .select('*')
            .eq('student_id', studentId)
            .limit(1);
            
        if (assignError) {
            throw new Error(`Assignment 조회 실패: ${assignError.message}`);
        }
        
        if (!assignments || assignments.length === 0) {
            throw new Error(`학생 ${studentId}의 assignment를 찾을 수 없습니다`);
        }
        
        const assignment = assignments[0];
        console.log('✅ Assignment 발견:', assignment.id);
        console.log('   현재 activity_instructions:', assignment.activity_instructions || 'undefined');
        console.log('   session_id:', assignment.session_id);
        
        // 2단계: 관련 session 조회
        console.log('🎭 2단계: session 조회...');
        const { data: sessions, error: sessionError } = await client
            .from('sessions')
            .select('*')
            .eq('id', assignment.session_id)
            .limit(1);
            
        if (sessionError) {
            throw new Error(`Session 조회 실패: ${sessionError.message}`);
        }
        
        let session = null;
        if (sessions && sessions.length > 0) {
            session = sessions[0];
            console.log('✅ Session 발견:', session.id);
            console.log('   session.activityInstructions:', session.activityInstructions || 'undefined');
            console.log('   session.activity_instructions:', session.activity_instructions || 'undefined');
        } else {
            console.log('⚠️  Session을 찾을 수 없습니다');
        }
        
        // 3단계: activity_instructions 결정
        const activityInstructions = session?.activityInstructions || 
                                   session?.activity_instructions ||
                                   '🎭 [수정됨] 관리자가 설정한 활동방법안내입니다. 역할을 충실히 수행하고, 궁금한 점은 선생님께 문의하세요.';
        
        console.log('🎯 3단계: 사용할 활동방법안내:');
        console.log(`"${activityInstructions}"`);
        
        // 4단계: Assignment 업데이트
        console.log('🔧 4단계: Assignment 업데이트...');
        const { data: updatedAssignment, error: updateError } = await client
            .from('assignments')
            .update({
                activity_instructions: activityInstructions,
                session_name: session?.sessionName || session?.name || session?.id || 'Unknown Session'
            })
            .eq('id', assignment.id)
            .select()
            .single();
            
        if (updateError) {
            throw new Error(`Update 실패: ${updateError.message}`);
        }
        
        console.log('✅ Assignment 업데이트 성공!');
        console.log('   새 activity_instructions:', updatedAssignment.activity_instructions);
        console.log('   새 session_name:', updatedAssignment.session_name);
        
        // 5단계: 즉시 새로고침
        console.log('🔄 5단계: 데이터 새로고침...');
        await loadAssignments();
        await loadSessions();
        
        if (currentStudent && currentStudent.studentId === studentId) {
            await checkStudentAssignment();
            console.log('🎉 현재 로그인한 학생의 데이터가 새로고침되었습니다!');
        }
        
        console.log('🎉 assignment 수정 완료!');
        console.log('이제 학생 페이지에서 플립카드를 확인해보세요.');
        
        return updatedAssignment;
        
    } catch (error) {
        console.error('❌ assignment 수정 실패:', error.message);
        return null;
    }
};

// 간단한 테스트 함수
window.testActivityInstructions = function() {
    console.log('🔍 현재 상태 확인:');
    console.log('currentAssignment:', currentAssignment);
    if (currentAssignment) {
        console.log('activity_instructions:', currentAssignment.activity_instructions);
        console.log('activityInstructions:', currentAssignment.activityInstructions);
    }
    
    const detailElement = document.getElementById('detailMissions');
    if (detailElement) {
        console.log('detailMissions 현재 내용:', detailElement.textContent);
    }
};