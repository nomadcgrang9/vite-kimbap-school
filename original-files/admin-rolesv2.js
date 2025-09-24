// ============================================================
// admin-rolesv2.js - 역할배정 시스템 완전 새로운 구현
// 2025-09-23 생성 - 기존 admin-roles.js 문제 해결용
// ============================================================

console.log('🚀 admin-rolesv2.js 로드 시작 - v1.0.0');

// ============ 전역 변수 선언 ============
let currentSessions = [];
let currentStudents = [];
let currentAssignments = [];
let currentRoleTab = 'sessions';
let rolesSupabaseClient = null;

// ============ Supabase 연결 함수 ============
function initSupabaseClient() {
    console.log('🔌 Supabase 클라이언트 초기화 시도');
    
    try {
        // 1. 글로벌 클라이언트 확인
        if (typeof globalSupabaseClient !== 'undefined' && globalSupabaseClient) {
            rolesSupabaseClient = globalSupabaseClient;
            console.log('✅ 글로벌 Supabase 클라이언트 연결 성공');
            return rolesSupabaseClient;
        }
        
        // 2. 직접 초기화
        if (typeof window.supabase !== 'undefined') {
            const SUPABASE_URL = 'https://xzhbhrhihtfkuvcltpsw.supabase.co';
            const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6aGJocmhpaHRma3V2Y2x0cHN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3NjYyNzEsImV4cCI6MjA3MzM0MjI3MX0.hvHQV0O6SjWgzDyI7WkZC74Mude9dtssqqA4B4_Iqcw';
            
            rolesSupabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ 직접 Supabase 클라이언트 초기화 성공');
            return rolesSupabaseClient;
        }
        
        console.warn('⚠️ Supabase 라이브러리를 찾을 수 없음');
        return null;
        
    } catch (error) {
        console.error('❌ Supabase 초기화 실패:', error);
        return null;
    }
}

// ============ 안전한 데이터 처리 함수들 ============
function safeParseMissions(missions) {
    try {
        if (!missions) return [];
        
        // 이미 배열인 경우
        if (Array.isArray(missions)) return missions;
        
        // 문자열인 경우 파싱
        if (typeof missions === 'string') {
            const parsed = JSON.parse(missions);
            return Array.isArray(parsed) ? parsed : [];
        }
        
        return [];
    } catch (error) {
        console.error('❌ missions 파싱 오류:', error);
        return [];
    }
}

function updateModuleStatus(status, message) {
    console.log(`📊 모듈 상태: ${status} - ${message}`);
    
    // 상태를 화면에 표시 (admin-v2.html의 상태 영역이 있다면)
    const statusElement = document.getElementById('rolesModuleStatus');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.className = `status-${status}`;
    }
}

// ============ 데이터 로드 함수들 ============
async function loadSessions() {
    console.log('📋 세션 데이터 로드 시작');
    
    try {
        if (!rolesSupabaseClient) {
            throw new Error('Supabase 클라이언트가 초기화되지 않음');
        }
        
        const { data, error } = await rolesSupabaseClient
            .from('sessions')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error('❌ 세션 로드 오류:', error);
            throw error;
        }
        
        currentSessions = data || [];
        console.log(`✅ 세션 데이터 로드 완료: ${currentSessions.length}개`);
        
        // missions 데이터 파싱
        currentSessions.forEach(session => {
            if (session.missions) {
                session.parsedMissions = safeParseMissions(session.missions);
            }
        });
        
        return currentSessions;
        
    } catch (error) {
        console.error('❌ 세션 로드 실패:', error);
        currentSessions = [];
        return [];
    }
}

async function loadStudents() {
    console.log('👥 학생 데이터 로드 시작');
    
    try {
        if (!rolesSupabaseClient) {
            throw new Error('Supabase 클라이언트가 초기화되지 않음');
        }
        
        const { data, error } = await rolesSupabaseClient
            .from('students')
            .select('*')
            .order('grade, class_num, number');
            
        if (error) {
            console.error('❌ 학생 로드 오류:', error);
            throw error;
        }
        
        currentStudents = data || [];
        console.log(`✅ 학생 데이터 로드 완료: ${currentStudents.length}명`);
        
        return currentStudents;
        
    } catch (error) {
        console.error('❌ 학생 로드 실패:', error);
        currentStudents = [];
        return [];
    }
}

async function loadAssignments() {
    console.log('🎯 배정 데이터 로드 시작');
    
    try {
        if (!rolesSupabaseClient) {
            throw new Error('Supabase 클라이언트가 초기화되지 않음');
        }
        
        const { data, error } = await rolesSupabaseClient
            .from('assignments')
            .select('*')
            .order('assigned_at', { ascending: false });
            
        if (error) {
            console.error('❌ 배정 로드 오류:', error);
            throw error;
        }
        
        currentAssignments = data || [];
        console.log(`✅ 배정 데이터 로드 완료: ${currentAssignments.length}개`);
        
        return currentAssignments;
        
    } catch (error) {
        console.error('❌ 배정 로드 실패:', error);
        currentAssignments = [];
        return [];
    }
}

async function loadAllData() {
    console.log('🔄 전체 데이터 로드 시작');
    updateModuleStatus('loading', '데이터를 로드하는 중...');
    
    try {
        // 병렬로 모든 데이터 로드
        const [sessions, students, assignments] = await Promise.all([
            loadSessions(),
            loadStudents(),
            loadAssignments()
        ]);
        
        console.log('✅ 전체 데이터 로드 완료');
        console.log(`  - 세션: ${sessions.length}개`);
        console.log(`  - 학생: ${students.length}명`);
        console.log(`  - 배정: ${assignments.length}개`);
        
        updateModuleStatus('loaded', `데이터 로드 완료 (세션 ${sessions.length}, 학생 ${students.length}, 배정 ${assignments.length})`);
        
        return { sessions, students, assignments };
        
    } catch (error) {
        console.error('❌ 전체 데이터 로드 실패:', error);
        updateModuleStatus('error', `데이터 로드 실패: ${error.message}`);
        throw error;
    }
}

// ============ 핵심 모듈 로드 함수 ============
async function loadRolesModule() {
    console.log('🎯 역할배정 모듈 v2 로드 시작');
    updateModuleStatus('loading', '역할배정 모듈을 로드하는 중...');
    
    try {
        // 1. Supabase 클라이언트 초기화
        const client = initSupabaseClient();
        if (!client) {
            throw new Error('Supabase 클라이언트 초기화 실패');
        }
        
        // 2. 기본 상태 초기화
        currentSessions = [];
        currentStudents = [];
        currentAssignments = [];
        currentRoleTab = 'sessions';
        
        // 3. 실제 데이터 로드
        await loadAllData();
        
        updateModuleStatus('loaded', '역할배정 모듈 로드 완료');
        console.log('✅ admin-rolesv2.js 모듈 로드 성공');
        
        return true;
        
    } catch (error) {
        console.error('❌ 역할배정 모듈 로드 실패:', error);
        updateModuleStatus('error', `모듈 로드 실패: ${error.message}`);
        return false;
    }
}

// ============ 모듈 상태 테스트 함수 ============
function testModuleConnection() {
    console.log('🧪 모듈 연결 테스트 시작');
    
    const results = {
        rolesSupabaseClient: !!rolesSupabaseClient,
        globalSupabase: typeof globalSupabaseClient !== 'undefined',
        windowSupabase: typeof window.supabase !== 'undefined',
        currentSessions: Array.isArray(currentSessions),
        currentStudents: Array.isArray(currentStudents),
        currentAssignments: Array.isArray(currentAssignments)
    };
    
    console.log('📋 연결 테스트 결과:', results);
    return results;
}

// ============ 데이터 검증 함수 ============
function validateLoadedData() {
    const results = {
        sessions: {
            count: currentSessions.length,
            valid: Array.isArray(currentSessions),
            sample: currentSessions.slice(0, 2).map(s => ({
                id: s.id,
                name: s.name,
                type: s.type,
                missionsCount: s.parsedMissions?.length || 0
            }))
        },
        students: {
            count: currentStudents.length,
            valid: Array.isArray(currentStudents),
            sample: currentStudents.slice(0, 2).map(s => ({
                id: s.id,
                name: s.name,
                fullClass: s.full_class
            }))
        },
        assignments: {
            count: currentAssignments.length,
            valid: Array.isArray(currentAssignments),
            sample: currentAssignments.slice(0, 2).map(a => ({
                id: a.id,
                sessionId: a.session_id,
                studentName: a.student_name,
                roleName: a.role_name
            }))
        }
    };
    
    console.log('📊 데이터 검증 결과:', results);
    return results;
}

// ============ UI 생성 함수들 ============
function createRoleModal() {
    console.log('🎨 역할 관리 모달 생성 중...');
    
    // 기존 모달이 있으면 제거
    const existingModal = document.getElementById('roleModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modalHTML = `
        <div id="roleModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
            <div class="bg-white rounded-lg shadow-xl w-11/12 max-w-6xl h-5/6 flex flex-col">
                <!-- 모달 헤더 -->
                <div class="flex items-center justify-between p-6 border-b">
                    <h2 class="text-2xl font-bold text-gray-800">
                        <i class="fas fa-tasks text-purple-500 mr-3"></i>
                        역할 배정 관리 v2.0
                    </h2>
                    <button onclick="closeRoleModal()" class="text-gray-400 hover:text-gray-600 text-2xl">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <!-- 탭 네비게이션 -->
                <div class="flex border-b bg-gray-50">
                    <button id="sessionsTab" onclick="switchRoleTab('sessions')" 
                            class="flex-1 px-6 py-4 text-center font-medium transition-colors">
                        <i class="fas fa-cogs mr-2"></i>
                        세션 관리
                    </button>
                    <button id="assignmentTab" onclick="switchRoleTab('assignment')" 
                            class="flex-1 px-6 py-4 text-center font-medium transition-colors">
                        <i class="fas fa-user-tag mr-2"></i>
                        배정 관리  
                    </button>
                    <button id="statusTab" onclick="switchRoleTab('status')" 
                            class="flex-1 px-6 py-4 text-center font-medium transition-colors">
                        <i class="fas fa-chart-bar mr-2"></i>
                        배정 현황
                    </button>
                </div>
                
                <!-- 탭 콘텐츠 영역 -->
                <div class="flex-1 overflow-hidden">
                    <!-- 세션 관리 탭 -->
                    <div id="sessionsContent" class="h-full overflow-y-auto p-6">
                        <div class="mb-6">
                            <div class="flex items-center justify-between mb-4">
                                <h3 class="text-xl font-semibold text-gray-700">세션 관리</h3>
                                <button onclick="createNewSession()" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                                    <i class="fas fa-plus mr-2"></i>새 세션 만들기
                                </button>
                            </div>
                            <div id="sessionsList" class="space-y-4">
                                <!-- 세션 목록이 여기에 표시됩니다 -->
                            </div>
                        </div>
                    </div>
                    
                    <!-- 배정 관리 탭 -->
                    <div id="assignmentContent" class="h-full overflow-y-auto p-6 hidden">
                        <div class="mb-6">
                            <h3 class="text-xl font-semibold text-gray-700 mb-4">배정 관리</h3>
                            <div id="assignmentManagement">
                                <p class="text-gray-500 text-center py-8">세션을 선택하여 역할을 배정하세요.</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 배정 현황 탭 -->
                    <div id="statusContent" class="h-full overflow-y-auto p-6 hidden">
                        <div class="mb-6">
                            <div class="flex items-center justify-between mb-4">
                                <h3 class="text-xl font-semibold text-gray-700">배정 현황</h3>
                                <button onclick="refreshAssignmentStatus()" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                                    <i class="fas fa-sync mr-2"></i>새로고침
                                </button>
                            </div>
                            <div id="assignmentStatus">
                                <p class="text-gray-500 text-center py-8">현황을 로드하는 중...</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 모달 푸터 -->
                <div class="flex justify-end items-center p-6 border-t bg-gray-50">
                    <div id="modalStatus" class="flex-1 text-sm text-gray-600"></div>
                    <button onclick="closeRoleModal()" class="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600">
                        닫기
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    console.log('✅ 역할 관리 모달 생성 완료');
}

function showRoleModal() {
    console.log('📱 역할 관리 모달 표시');
    
    // 모달이 없으면 생성
    if (!document.getElementById('roleModal')) {
        createRoleModal();
    }
    
    // 모달 표시
    const modal = document.getElementById('roleModal');
    if (modal) {
        modal.classList.remove('hidden');
        
        // 첫 번째 탭 활성화
        switchRoleTab('sessions');
        
        // 세션 목록 새로고침
        renderSessionsList();
        
        console.log('✅ 역할 관리 모달 표시 완료');
    }
}

function closeRoleModal() {
    console.log('❌ 역할 관리 모달 닫기');
    
    const modal = document.getElementById('roleModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function switchRoleTab(tabName) {
    console.log(`🔄 탭 전환: ${tabName}`);
    
    // 무한 재귀 방지
    if (currentRoleTab === tabName) {
        console.log(`📍 이미 ${tabName} 탭이 활성화됨`);
        return;
    }
    
    // 모든 탭 비활성화
    const tabs = ['sessionsTab', 'assignmentTab', 'statusTab'];
    const contents = ['sessionsContent', 'assignmentContent', 'statusContent'];
    
    tabs.forEach(id => {
        const tab = document.getElementById(id);
        if (tab) {
            tab.classList.remove('bg-white', 'text-purple-600', 'border-b-2', 'border-purple-500');
            tab.classList.add('text-gray-600', 'hover:text-gray-800');
        }
    });
    
    contents.forEach(id => {
        const content = document.getElementById(id);
        if (content) {
            content.classList.add('hidden');
        }
    });
    
    // 선택된 탭 활성화
    let activeTabId, activeContentId;
    
    switch(tabName) {
        case 'sessions':
            activeTabId = 'sessionsTab';
            activeContentId = 'sessionsContent';
            break;
        case 'assignment':
            activeTabId = 'assignmentTab';
            activeContentId = 'assignmentContent';
            break;
        case 'status':
            activeTabId = 'statusTab';
            activeContentId = 'statusContent';
            break;
        default:
            console.warn(`⚠️ 알 수 없는 탭: ${tabName}`);
            return;
    }
    
    const activeTab = document.getElementById(activeTabId);
    const activeContent = document.getElementById(activeContentId);
    
    if (activeTab) {
        activeTab.classList.add('bg-white', 'text-purple-600', 'border-b-2', 'border-purple-500');
        activeTab.classList.remove('text-gray-600', 'hover:text-gray-800');
    }
    
    if (activeContent) {
        activeContent.classList.remove('hidden');
    }
    
    // 현재 탭 상태 업데이트
    currentRoleTab = tabName;
    
    // 탭별 로드 함수 호출
    loadTabContent(tabName);
    
    console.log(`✅ 탭 전환 완료: ${tabName}`);
}

// ============ 탭별 콘텐츠 로드 함수 ============
async function loadTabContent(tabName) {
    console.log(`📋 ${tabName} 탭 콘텐츠 로드 시작`);
    
    try {
        switch(tabName) {
            case 'sessions':
                await loadSessionsTab();
                break;
            case 'assignment':
                await loadAssignmentTab();
                break;
            case 'status':
                await loadStatusTab();
                break;
        }
    } catch (error) {
        console.error(`❌ ${tabName} 탭 콘텐츠 로드 실패:`, error);
    }
}

// ============ 세션 관리 탭 로드 ============
async function loadSessionsTab() {
    console.log('🔧 세션 관리 탭 로드');
    
    // 세션 목록 새로고침
    await renderSessionsList();
    
    // 상태 업데이트
    updateModalStatus('세션 관리 탭 활성화됨');
}

// ============ 배정 관리 탭 로드 ============
async function loadAssignmentTab() {
    console.log('👥 배정 관리 탭 로드');
    
    const container = document.getElementById('assignmentManagement');
    if (!container) return;
    
    // 활성 세션 목록 표시
    const activeSessions = currentSessions.filter(s => s.status === 'active');
    
    if (activeSessions.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-exclamation-triangle text-4xl text-yellow-500 mb-4"></i>
                <h3 class="text-lg font-semibold text-gray-700 mb-2">활성 세션이 없습니다</h3>
                <p class="text-gray-500 mb-4">역할을 배정하려면 먼저 세션을 생성하세요.</p>
                <button onclick="switchRoleTab('sessions')" class="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
                    <i class="fas fa-plus mr-2"></i>세션 관리로 이동
                </button>
            </div>
        `;
        updateModalStatus('활성 세션이 없어 배정 관리를 사용할 수 없습니다.');
        return;
    }
    
    // 활성 세션 선택 UI 생성
    const sessionsHTML = activeSessions.map(session => {
        const missions = session.parsedMissions || [];
        
        return `
            <div class="bg-gray-50 border rounded-lg p-4 mb-4">
                <div class="flex items-center justify-between mb-3">
                    <div>
                        <h4 class="font-semibold text-lg">${session.name}</h4>
                        <p class="text-sm text-gray-600">
                            역할 수: ${missions.length}개 | 대상: ${session.target_class}
                        </p>
                    </div>
                    <button onclick="selectSessionForAssignment('${session.id}')" 
                            class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                        <i class="fas fa-user-plus mr-2"></i>역할 배정하기
                    </button>
                </div>
                
                ${missions.length > 0 ? `
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        ${missions.map((mission, index) => `
                            <div class="bg-white p-3 rounded border">
                                <div class="flex items-center justify-between">
                                    <div class="flex-1">
                                        <p class="font-medium">${mission.name || `역할 ${index + 1}`}</p>
                                        <p class="text-xs text-gray-500">${mission.type || 'text'} 타입</p>
                                    </div>
                                    <button onclick="assignRoleToStudent('${session.id}', ${index})" 
                                            class="bg-green-500 text-white px-2 py-1 rounded text-sm hover:bg-green-600">
                                        배정
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <p class="text-center text-gray-500 py-4">이 세션에는 역할이 없습니다.</p>
                `}
            </div>
        `;
    }).join('');
    
    container.innerHTML = `
        <div class="mb-6">
            <h3 class="text-lg font-semibold mb-4">활성 세션 목록</h3>
            ${sessionsHTML}
        </div>
    `;
    
    updateModalStatus(`배정 관리 탭 - ${activeSessions.length}개 활성 세션`);
}

// ============ 배정 현황 탭 로드 ============
async function loadStatusTab() {
    console.log('📊 배정 현황 탭 로드');
    
    const container = document.getElementById('assignmentStatus');
    if (!container) return;
    
    container.innerHTML = `
        <div class="text-center py-8">
            <i class="fas fa-spinner fa-spin text-2xl text-blue-500 mb-4"></i>
            <p class="text-gray-600">배정 현황을 로드하는 중...</p>
        </div>
    `;
    
    try {
        // 현재 배정 데이터 다시 로드
        await loadAssignments();
        
        if (currentAssignments.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-clipboard-list text-4xl text-gray-400 mb-4"></i>
                    <h3 class="text-lg font-semibold text-gray-700 mb-2">배정된 역할이 없습니다</h3>
                    <p class="text-gray-500 mb-4">아직 학생들에게 배정된 역할이 없습니다.</p>
                    <button onclick="switchRoleTab('assignment')" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                        <i class="fas fa-user-plus mr-2"></i>역할 배정하러 가기
                    </button>
                </div>
            `;
        } else {
            // 배정 현황을 세션별로 그룹화
            const assignmentsBySession = {};
            currentAssignments.forEach(assignment => {
                const sessionId = assignment.session_id;
                if (!assignmentsBySession[sessionId]) {
                    assignmentsBySession[sessionId] = [];
                }
                assignmentsBySession[sessionId].push(assignment);
            });
            
            const statusHTML = Object.keys(assignmentsBySession).map(sessionId => {
                const assignments = assignmentsBySession[sessionId];
                const sessionName = assignments[0]?.session_name || 'Unknown Session';
                
                return `
                    <div class="bg-gray-50 border rounded-lg p-4 mb-4">
                        <div class="flex items-center justify-between mb-3">
                            <h4 class="font-semibold text-lg">${sessionName}</h4>
                            <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                ${assignments.length}개 배정
                            </span>
                        </div>
                        
                        <div class="space-y-2">
                            ${assignments.map(assignment => `
                                <div class="bg-white p-3 rounded border flex items-center justify-between">
                                    <div class="flex-1">
                                        <p class="font-medium">${assignment.student_name}</p>
                                        <p class="text-sm text-gray-600">
                                            역할: ${assignment.role_name} | 
                                            상태: <span class="font-medium ${assignment.status === 'active' ? 'text-green-600' : 'text-gray-600'}">${assignment.status || 'active'}</span>
                                        </p>
                                        <p class="text-xs text-gray-500">
                                            배정일: ${new Date(assignment.assigned_at).toLocaleString('ko-KR')}
                                        </p>
                                    </div>
                                    <div class="flex space-x-2">
                                        <button onclick="removeAssignment('${assignment.id}')" 
                                                class="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600">
                                            해제
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }).join('');
            
            container.innerHTML = `
                <div class="mb-4">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold">현재 배정 현황</h3>
                        <div class="text-sm text-gray-600">
                            총 ${currentAssignments.length}개 배정
                        </div>
                    </div>
                    ${statusHTML}
                </div>
            `;
        }
        
        updateModalStatus(`배정 현황 탭 - ${currentAssignments.length}개 배정 확인됨`);
        
    } catch (error) {
        console.error('배정 현황 로드 실패:', error);
        container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                <h3 class="text-lg font-semibold text-red-700 mb-2">현황 로드 실패</h3>
                <p class="text-red-600 mb-4">${error.message}</p>
                <button onclick="loadStatusTab()" class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                    <i class="fas fa-redo mr-2"></i>다시 시도
                </button>
            </div>
        `;
    }
}

// ============ 모달 상태 업데이트 함수 ============
function updateModalStatus(message) {
    const statusElement = document.getElementById('modalStatus');
    if (statusElement) {
        statusElement.textContent = message;
    }
}

function renderSessionsList() {
    console.log('📋 세션 목록 렌더링 시작');
    
    const container = document.getElementById('sessionsList');
    if (!container) {
        console.warn('⚠️ sessionsList 컨테이너를 찾을 수 없음');
        return;
    }
    
    if (currentSessions.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-inbox text-4xl mb-4"></i>
                <p>아직 생성된 세션이 없습니다.</p>
                <p class="text-sm mt-2">새 세션을 만들어보세요!</p>
            </div>
        `;
        return;
    }
    
    const sessionsHTML = currentSessions.map(session => {
        const missions = session.parsedMissions || [];
        const missionCount = missions.length;
        
        return `
            <div class="bg-gray-50 border rounded-lg p-4">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <h4 class="font-semibold text-lg">${session.name || '제목 없음'}</h4>
                        <p class="text-sm text-gray-600 mt-1">
                            <span class="mr-4">유형: ${session.type || 'role_assignment'}</span>
                            <span class="mr-4">역할 수: ${missionCount}개</span>
                            <span>대상: ${session.target_class || '전체'}</span>
                        </p>
                        <p class="text-xs text-gray-500 mt-2">
                            생성: ${new Date(session.created_at).toLocaleString('ko-KR')}
                        </p>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="editSession('${session.id}')" 
                                class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">
                            편집
                        </button>
                        <button onclick="deleteSession('${session.id}')" 
                                class="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">
                            삭제
                        </button>
                    </div>
                </div>
                
                ${missionCount > 0 ? `
                    <div class="mt-3 pt-3 border-t">
                        <p class="text-sm font-medium mb-2">역할 목록:</p>
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                            ${missions.map((mission, index) => `
                                <div class="bg-white px-3 py-2 rounded border text-sm">
                                    <span class="font-medium">${mission.name || `역할 ${index + 1}`}</span>
                                    <span class="text-xs text-gray-500 ml-2">(${mission.type || 'text'})</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
    
    container.innerHTML = sessionsHTML;
    
    console.log(`✅ 세션 목록 렌더링 완료: ${currentSessions.length}개`);
}

// ============ 통합된 모듈 로드 함수 (UI 포함) ============
async function loadRolesModuleWithUI() {
    console.log('🎯 UI 포함 역할배정 모듈 로드 시작');
    updateModuleStatus('loading', '역할배정 모듈을 로드하고 UI를 준비하는 중...');
    
    try {
        // 1. Supabase 클라이언트 초기화
        const client = initSupabaseClient();
        if (!client) {
            throw new Error('Supabase 클라이언트 초기화 실패');
        }
        
        // 2. 기본 상태 초기화
        currentSessions = [];
        currentStudents = [];
        currentAssignments = [];
        currentRoleTab = 'sessions';
        
        // 3. 데이터 로드
        await loadAllData();
        
        // 4. UI 생성 및 표시
        showRoleModal();
        
        updateModuleStatus('loaded', `데이터 로드 완료 (세션 ${currentSessions.length}, 학생 ${currentStudents.length}, 배정 ${currentAssignments.length})`);
        console.log('✅ UI 포함 역할배정 모듈 로드 완료');
        return true;
        
    } catch (error) {
        console.error('❌ UI 포함 모듈 로드 실패:', error);
        updateModuleStatus('error', 'UI 모듈 로드 중 오류가 발생했습니다: ' + error.message);
        return false;
    }
}

// ============ 배정 관리 함수들 ============
function selectSessionForAssignment(sessionId) {
    console.log('🎯 세션 선택:', sessionId);
    const session = currentSessions.find(s => s.id === sessionId);
    if (!session) {
        alert('세션을 찾을 수 없습니다.');
        return;
    }
    
    // 세션 전체 배정 모달 표시
    showSessionAssignmentModal(session);
}

function showSessionAssignmentModal(session) {
    console.log('📋 세션 배정 모달 표시:', session.name);
    
    const missions = session.parsedMissions || [];
    if (missions.length === 0) {
        alert('이 세션에는 배정할 역할이 없습니다.');
        return;
    }
    
    const modalHTML = `
        <div id="sessionAssignmentModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div class="bg-white rounded-lg shadow-xl w-11/12 max-w-5xl max-h-5/6 overflow-hidden">
                <div class="flex items-center justify-between p-6 border-b">
                    <h3 class="text-xl font-bold text-gray-800">역할 배정: ${session.name}</h3>
                    <button onclick="closeSessionAssignmentModal()" class="text-gray-400 hover:text-gray-600 text-xl">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="p-6 overflow-y-auto max-h-96">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        ${missions.map((role, index) => `
                            <div class="bg-gray-50 border rounded-lg p-4">
                                <div class="text-center mb-3">
                                    <h4 class="font-semibold text-lg">${role.name || `역할 ${index + 1}`}</h4>
                                    <p class="text-sm text-gray-600">${role.type === 'image' ? '이미지 역할' : '텍스트 역할'}</p>
                                    ${role.content ? `<p class="text-xs text-gray-500 mt-1">${role.content.substring(0, 50)}...</p>` : ''}
                                </div>
                                <button onclick="assignRoleToStudent('${session.id}', ${index})" 
                                        class="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-2">
                                    <i class="fas fa-user-plus mr-2"></i>학생에게 배정
                                </button>
                                <div id="assignedStudents-${index}" class="text-xs text-gray-600">
                                    <!-- 배정된 학생들이 여기에 표시됩니다 -->
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="flex justify-between items-center p-6 border-t bg-gray-50">
                    <div class="text-sm text-gray-600">
                        <i class="fas fa-users mr-2"></i>
                        총 ${missions.length}개 역할 | 학생 ${currentStudents.length}명
                    </div>
                    <div class="space-x-3">
                        <button onclick="autoAssignAllRoles('${session.id}')" 
                                class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                            <i class="fas fa-magic mr-2"></i>자동 배정
                        </button>
                        <button onclick="closeSessionAssignmentModal()" 
                                class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                            닫기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 기존 모달 제거 후 새로 생성
    const existingModal = document.getElementById('sessionAssignmentModal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // 현재 배정된 학생들 표시
    updateAssignedStudentsDisplay(session.id);
}

function closeSessionAssignmentModal() {
    const modal = document.getElementById('sessionAssignmentModal');
    if (modal) modal.remove();
}

async function assignRoleToStudent(sessionId, roleIndex) {
    console.log('👤 역할 배정:', sessionId, roleIndex);
    
    const session = currentSessions.find(s => s.id === sessionId);
    if (!session) {
        alert('세션을 찾을 수 없습니다.');
        return;
    }
    
    const missions = session.parsedMissions || [];
    const role = missions[roleIndex];
    if (!role) {
        alert('역할을 찾을 수 없습니다.');
        return;
    }
    
    // 학생 선택 모달 표시
    showStudentSelectionModal(session, role, roleIndex);
}

function showStudentSelectionModal(session, role, roleIndex) {
    console.log('👥 학생 선택 모달 표시');
    
    if (currentStudents.length === 0) {
        alert('배정할 학생이 없습니다. 먼저 학생을 추가해주세요.');
        return;
    }
    
    // 이미 배정된 학생들 확인
    const assignedStudentIds = currentAssignments
        .filter(a => a.session_id === session.id && a.role_index == roleIndex)
        .map(a => a.student_id);
    
    const availableStudents = currentStudents.filter(s => 
        session.target_class === '전체' || 
        s.full_class?.includes(session.target_class) ||
        s.grade?.toString() === session.target_class?.replace('학년', '')
    );
    
    const modalHTML = `
        <div id="studentSelectionModal" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-70">
            <div class="bg-white rounded-lg shadow-xl w-11/12 max-w-3xl max-h-5/6 overflow-hidden">
                <div class="flex items-center justify-between p-6 border-b">
                    <div>
                        <h3 class="text-xl font-bold text-gray-800">학생 선택</h3>
                        <p class="text-sm text-gray-600 mt-1">
                            "${role.name}" 역할에 배정할 학생을 선택하세요
                        </p>
                    </div>
                    <button onclick="closeStudentSelectionModal()" class="text-gray-400 hover:text-gray-600 text-xl">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="p-6">
                    <div class="mb-4">
                        <input type="text" id="studentSearchInput" placeholder="학생 이름으로 검색..." 
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                               onkeyup="filterStudents()">
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto" id="studentsGrid">
                        ${availableStudents.map(student => {
                            const isAssigned = assignedStudentIds.includes(student.student_id);
                            return `
                                <div class="student-card border rounded-lg p-3 ${isAssigned ? 'bg-gray-100 border-gray-300' : 'bg-white border-gray-200 hover:border-blue-300 cursor-pointer'}"
                                     ${!isAssigned ? `onclick="confirmAssignment('${session.id}', ${roleIndex}, '${student.student_id}', '${student.name}')"` : ''}
                                     data-student-name="${student.name.toLowerCase()}">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <p class="font-medium ${isAssigned ? 'text-gray-500' : 'text-gray-900'}">${student.name}</p>
                                            <p class="text-sm text-gray-500">${student.full_class || `${student.grade}학년 ${student.class_num}반`}</p>
                                            ${student.number ? `<p class="text-xs text-gray-400">${student.number}번</p>` : ''}
                                        </div>
                                        ${isAssigned ? 
                                            `<span class="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">배정됨</span>` :
                                            `<i class="fas fa-user-plus text-blue-500"></i>`
                                        }
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    
                    ${availableStudents.length === 0 ? `
                        <div class="text-center py-8">
                            <i class="fas fa-users text-4xl text-gray-400 mb-4"></i>
                            <p class="text-gray-600">대상 클래스(${session.target_class})에 해당하는 학생이 없습니다.</p>
                        </div>
                    ` : ''}
                </div>
                
                <div class="flex justify-end space-x-3 p-6 border-t bg-gray-50">
                    <button onclick="closeStudentSelectionModal()" 
                            class="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
                        취소
                    </button>
                </div>
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('studentSelectionModal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeStudentSelectionModal() {
    const modal = document.getElementById('studentSelectionModal');
    if (modal) modal.remove();
}

function filterStudents() {
    const searchInput = document.getElementById('studentSearchInput');
    const searchTerm = searchInput.value.toLowerCase();
    const studentCards = document.querySelectorAll('.student-card');
    
    studentCards.forEach(card => {
        const studentName = card.getAttribute('data-student-name');
        if (studentName.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

async function confirmAssignment(sessionId, roleIndex, studentId, studentName) {
    console.log('✅ 배정 확인:', { sessionId, roleIndex, studentId, studentName });
    
    const session = currentSessions.find(s => s.id === sessionId);
    if (!session) {
        alert('세션을 찾을 수 없습니다.');
        return;
    }
    
    const role = session.parsedMissions[roleIndex];
    if (!role) {
        alert('역할을 찾을 수 없습니다.');
        return;
    }
    
    if (!confirm(`"${studentName}" 학생에게\n"${role.name}" 역할을 배정하시겠습니까?`)) {
        return;
    }
    
    try {
        // 배정 데이터 준비
        const assignmentData = {
            session_id: sessionId,
            session_name: session.name,
            target_class: session.target_class,
            student_id: studentId,
            student_name: studentName,
            role_index: roleIndex,
            role_name: role.name,
            role_content: role.content || '역할 설명 없음',
            role_type: role.type || 'text',
            type: session.type || 'role_assignment',
            missions: role.content || '역할 설명 없음',
            status: 'active',
            auto_assigned: false
        };
        
        console.log('💾 Supabase에 배정 저장 중...', assignmentData);
        
        if (!rolesSupabaseClient) {
            throw new Error('Supabase 클라이언트가 초기화되지 않음');
        }
        
        const { data, error } = await rolesSupabaseClient
            .from('assignments')
            .insert([assignmentData])
            .select();
        
        if (error) {
            console.error('❌ 배정 저장 실패:', error);
            throw new Error(`배정 저장 실패: ${error.message}`);
        }
        
        console.log('✅ 배정 저장 성공:', data);
        
        // 로컬 데이터 업데이트
        if (data && data.length > 0) {
            currentAssignments.push(data[0]);
        }
        
        // 모달들 닫기
        closeStudentSelectionModal();
        closeSessionAssignmentModal();
        
        alert(`✅ "${studentName}" 학생에게 "${role.name}" 역할이 성공적으로 배정되었습니다!`);
        
        // 배정 현황 탭으로 이동
        if (currentRoleTab !== 'status') {
            switchRoleTab('status');
        } else {
            await loadStatusTab();
        }
        
        updateModalStatus(`새 배정 완료: ${studentName} → ${role.name}`);
        
    } catch (error) {
        console.error('❌ 역할 배정 오류:', error);
        alert(`역할 배정 중 오류가 발생했습니다: ${error.message}`);
    }
}

async function removeAssignment(assignmentId) {
    console.log('❌ 배정 해제:', assignmentId);
    
    const assignment = currentAssignments.find(a => a.id === assignmentId);
    if (!assignment) {
        alert('배정을 찾을 수 없습니다.');
        return;
    }
    
    if (!confirm(`"${assignment.student_name}" 학생의 "${assignment.role_name}" 역할 배정을 해제하시겠습니까?`)) {
        return;
    }
    
    try {
        console.log('💾 Supabase에서 배정 해제 중...');
        
        if (!rolesSupabaseClient) {
            throw new Error('Supabase 클라이언트가 초기화되지 않음');
        }
        
        const { error } = await rolesSupabaseClient
            .from('assignments')
            .delete()
            .eq('id', assignmentId);
        
        if (error) {
            console.error('❌ 배정 해제 실패:', error);
            throw new Error(`배정 해제 실패: ${error.message}`);
        }
        
        console.log('✅ 배정 해제 성공');
        
        // 로컬 데이터에서 제거
        const assignmentIndex = currentAssignments.findIndex(a => a.id === assignmentId);
        if (assignmentIndex !== -1) {
            currentAssignments.splice(assignmentIndex, 1);
        }
        
        // 현황 새로고침
        await loadStatusTab();
        
        alert(`"${assignment.student_name}" 학생의 "${assignment.role_name}" 역할이 해제되었습니다.`);
        updateModalStatus(`배정 해제 완료: ${assignment.student_name}`);
        
    } catch (error) {
        console.error('❌ 배정 해제 오류:', error);
        alert(`배정 해제 중 오류가 발생했습니다: ${error.message}`);
    }
}

async function autoAssignAllRoles(sessionId) {
    console.log('🎲 자동 배정:', sessionId);
    
    const session = currentSessions.find(s => s.id === sessionId);
    if (!session) {
        alert('세션을 찾을 수 없습니다.');
        return;
    }
    
    const missions = session.parsedMissions || [];
    if (missions.length === 0) {
        alert('배정할 역할이 없습니다.');
        return;
    }
    
    // 대상 학생들 필터링
    const availableStudents = currentStudents.filter(s => 
        session.target_class === '전체' || 
        s.full_class?.includes(session.target_class) ||
        s.grade?.toString() === session.target_class?.replace('학년', '')
    );
    
    if (availableStudents.length === 0) {
        alert('대상 클래스에 해당하는 학생이 없습니다.');
        return;
    }
    
    if (!confirm(`"${session.name}" 세션의 모든 역할을 자동으로 배정하시겠습니까?\n\n- 총 ${missions.length}개 역할\n- 대상 학생 ${availableStudents.length}명`)) {
        return;
    }
    
    try {
        const assignments = [];
        const shuffledStudents = [...availableStudents].sort(() => Math.random() - 0.5);
        
        missions.forEach((role, roleIndex) => {
            const studentIndex = roleIndex % shuffledStudents.length;
            const student = shuffledStudents[studentIndex];
            
            assignments.push({
                session_id: sessionId,
                session_name: session.name,
                target_class: session.target_class,
                student_id: student.student_id,
                student_name: student.name,
                role_index: roleIndex,
                role_name: role.name,
                role_content: role.content || '역할 설명 없음',
                role_type: role.type || 'text',
                type: session.type || 'role_assignment',
                missions: role.content || '역할 설명 없음',
                status: 'active',
                auto_assigned: true
            });
        });
        
        console.log('💾 자동 배정 데이터 저장 중...', assignments);
        
        if (!rolesSupabaseClient) {
            throw new Error('Supabase 클라이언트가 초기화되지 않음');
        }
        
        const { data, error } = await rolesSupabaseClient
            .from('assignments')
            .insert(assignments)
            .select();
        
        if (error) {
            console.error('❌ 자동 배정 실패:', error);
            throw new Error(`자동 배정 실패: ${error.message}`);
        }
        
        console.log('✅ 자동 배정 성공:', data);
        
        // 로컬 데이터 업데이트
        if (data) {
            currentAssignments.push(...data);
        }
        
        // 모달 닫기 및 현황 표시
        closeSessionAssignmentModal();
        switchRoleTab('status');
        
        alert(`🎉 자동 배정 완료!\n총 ${assignments.length}개 역할이 배정되었습니다.`);
        updateModalStatus(`자동 배정 완료: ${assignments.length}개 역할`);
        
    } catch (error) {
        console.error('❌ 자동 배정 오류:', error);
        alert(`자동 배정 중 오류가 발생했습니다: ${error.message}`);
    }
}

async function updateAssignedStudentsDisplay(sessionId) {
    // 현재 배정 상태를 각 역할별로 표시
    const sessionAssignments = currentAssignments.filter(a => a.session_id === sessionId);
    
    sessionAssignments.forEach(assignment => {
        const container = document.getElementById(`assignedStudents-${assignment.role_index}`);
        if (container) {
            container.innerHTML = `<span class="text-green-600">✓ ${assignment.student_name}</span>`;
        }
    });
}

// ============ 배정 현황 새로고침 함수 ============
async function refreshAssignmentStatus() {
    console.log('🔄 배정 현황 새로고침');
    
    if (currentRoleTab === 'status') {
        await loadStatusTab();
        console.log('✅ 배정 현황 새로고침 완료');
    } else {
        // 현재 탭이 status가 아니면 데이터만 새로고침
        await loadAssignments();
        console.log('✅ 배정 데이터 새로고침 완료');
    }
}

// ============ 세션 관리 함수들 ============
function createNewSession() {
    console.log('🆕 새 세션 생성');
    
    // 세션 생성 모달 HTML
    const createModalHTML = `
        <div id="createSessionModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div class="bg-white rounded-lg shadow-xl w-11/12 max-w-2xl">
                <div class="flex items-center justify-between p-6 border-b">
                    <h3 class="text-xl font-bold text-gray-800">새 세션 만들기</h3>
                    <button onclick="closeCreateSessionModal()" class="text-gray-400 hover:text-gray-600 text-xl">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="p-6">
                    <form id="createSessionForm" onsubmit="submitNewSession(event)">
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">세션 이름 *</label>
                                <input type="text" id="newSessionName" required 
                                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                       placeholder="예: 모둠별 역할놀이, 토론 활동 등">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">활동 설명</label>
                                <textarea id="newSessionInstructions" rows="3"
                                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                          placeholder="이 세션에서 진행할 활동에 대한 설명을 입력하세요 (선택사항)"></textarea>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">대상 클래스</label>
                                <select id="newSessionTargetClass" 
                                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500">
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
                                <label class="block text-sm font-medium text-gray-700 mb-2">초기 역할 개수</label>
                                <select id="initialRoleCount" 
                                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500">
                                    <option value="0">역할 없이 생성 (나중에 추가)</option>
                                    <option value="2">2개 역할</option>
                                    <option value="3">3개 역할</option>
                                    <option value="4" selected>4개 역할</option>
                                    <option value="5">5개 역할</option>
                                    <option value="6">6개 역할</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="flex justify-end space-x-3 mt-6 pt-6 border-t">
                            <button type="button" onclick="closeCreateSessionModal()" 
                                    class="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
                                취소
                            </button>
                            <button type="submit" 
                                    class="px-6 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
                                <i class="fas fa-plus mr-2"></i>세션 생성
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // 기존 생성 모달 제거 후 새로 생성
    const existingModal = document.getElementById('createSessionModal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', createModalHTML);
}

function closeCreateSessionModal() {
    const modal = document.getElementById('createSessionModal');
    if (modal) modal.remove();
}

async function submitNewSession(event) {
    event.preventDefault();
    console.log('📝 새 세션 제출 시작');
    
    const name = document.getElementById('newSessionName').value.trim();
    const instructions = document.getElementById('newSessionInstructions').value.trim();
    const targetClass = document.getElementById('newSessionTargetClass').value;
    const roleCount = parseInt(document.getElementById('initialRoleCount').value);
    
    if (!name) {
        alert('세션 이름을 입력해주세요.');
        return;
    }
    
    try {
        // 초기 역할 생성
        const initialRoles = [];
        for (let i = 0; i < roleCount; i++) {
            initialRoles.push({
                id: `role_${Date.now()}_${i}`,
                name: `역할 ${i + 1}`,
                type: 'text',
                content: '역할 설명 없음'
            });
        }
        
        // 세션 데이터 생성
        const sessionData = {
            name: name,
            type: 'role_assignment',
            missions: JSON.stringify(initialRoles),
            activity_instructions: instructions || null,
            target_class: targetClass,
            status: 'active'
        };
        
        console.log('💾 Supabase에 세션 저장 중...', sessionData);
        
        if (!rolesSupabaseClient) {
            throw new Error('Supabase 클라이언트가 초기화되지 않음');
        }
        
        const { data, error } = await rolesSupabaseClient
            .from('sessions')
            .insert([sessionData])
            .select();
        
        if (error) {
            console.error('❌ 세션 생성 실패:', error);
            throw new Error(`세션 생성 실패: ${error.message}`);
        }
        
        console.log('✅ 세션 생성 성공:', data);
        
        // 로컬 데이터 업데이트
        if (data && data.length > 0) {
            const newSession = data[0];
            newSession.parsedMissions = initialRoles;
            currentSessions.unshift(newSession);
        }
        
        // 모달 닫기
        closeCreateSessionModal();
        
        // 세션 목록 새로고침
        await renderSessionsList();
        
        alert(`"${name}" 세션이 성공적으로 생성되었습니다!`);
        updateModalStatus(`새 세션 생성 완료: ${name}`);
        
    } catch (error) {
        console.error('❌ 세션 생성 오류:', error);
        alert(`세션 생성 중 오류가 발생했습니다: ${error.message}`);
    }
}

async function editSession(sessionId) {
    console.log('✏️ 세션 편집:', sessionId);
    
    const session = currentSessions.find(s => s.id === sessionId);
    if (!session) {
        alert('세션을 찾을 수 없습니다.');
        return;
    }
    
    // 세션 편집 모달 HTML
    const editModalHTML = `
        <div id="editSessionModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div class="bg-white rounded-lg shadow-xl w-11/12 max-w-4xl max-h-5/6 overflow-y-auto">
                <div class="flex items-center justify-between p-6 border-b">
                    <h3 class="text-xl font-bold text-gray-800">세션 편집: ${session.name}</h3>
                    <button onclick="closeEditSessionModal()" class="text-gray-400 hover:text-gray-600 text-xl">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="p-6">
                    <form id="editSessionForm" onsubmit="submitEditSession(event, '${sessionId}')">
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <!-- 기본 정보 -->
                            <div class="space-y-4">
                                <h4 class="text-lg font-semibold text-gray-700 mb-4">기본 정보</h4>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">세션 이름 *</label>
                                    <input type="text" id="editSessionName" value="${session.name}" required 
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500">
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">활동 설명</label>
                                    <textarea id="editSessionInstructions" rows="4"
                                              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500">${session.activity_instructions || ''}</textarea>
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">대상 클래스</label>
                                    <select id="editSessionTargetClass" 
                                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500">
                                        <option value="전체" ${session.target_class === '전체' ? 'selected' : ''}>전체</option>
                                        <option value="1학년" ${session.target_class === '1학년' ? 'selected' : ''}>1학년</option>
                                        <option value="2학년" ${session.target_class === '2학년' ? 'selected' : ''}>2학년</option>
                                        <option value="3학년" ${session.target_class === '3학년' ? 'selected' : ''}>3학년</option>
                                        <option value="4학년" ${session.target_class === '4학년' ? 'selected' : ''}>4학년</option>
                                        <option value="5학년" ${session.target_class === '5학년' ? 'selected' : ''}>5학년</option>
                                        <option value="6학년" ${session.target_class === '6학년' ? 'selected' : ''}>6학년</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">상태</label>
                                    <select id="editSessionStatus" 
                                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500">
                                        <option value="active" ${session.status === 'active' ? 'selected' : ''}>활성</option>
                                        <option value="inactive" ${session.status === 'inactive' ? 'selected' : ''}>비활성</option>
                                    </select>
                                </div>
                            </div>
                            
                            <!-- 역할 관리 -->
                            <div class="space-y-4">
                                <div class="flex items-center justify-between">
                                    <h4 class="text-lg font-semibold text-gray-700">역할 관리</h4>
                                    <button type="button" onclick="addNewRole('${sessionId}')" 
                                            class="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">
                                        <i class="fas fa-plus mr-1"></i>역할 추가
                                    </button>
                                </div>
                                
                                <div id="rolesContainer" class="space-y-3 max-h-80 overflow-y-auto">
                                    ${renderEditRoles(session)}
                                </div>
                            </div>
                        </div>
                        
                        <div class="flex justify-end space-x-3 mt-6 pt-6 border-t">
                            <button type="button" onclick="closeEditSessionModal()" 
                                    class="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
                                취소
                            </button>
                            <button type="submit" 
                                    class="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                                <i class="fas fa-save mr-2"></i>저장
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // 기존 편집 모달 제거 후 새로 생성
    const existingModal = document.getElementById('editSessionModal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', editModalHTML);
}

function renderEditRoles(session) {
    const roles = session.parsedMissions || [];
    
    if (roles.length === 0) {
        return `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-user-plus text-2xl mb-2"></i>
                <p>아직 역할이 없습니다.</p>
                <p class="text-sm">역할 추가 버튼을 클릭하세요.</p>
            </div>
        `;
    }
    
    return roles.map((role, index) => `
        <div class="bg-gray-50 border rounded p-3" id="role-${index}">
            <div class="flex items-center justify-between mb-2">
                <input type="text" value="${role.name || `역할 ${index + 1}`}" 
                       class="font-medium bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-purple-500 rounded px-2"
                       id="roleName-${index}" onchange="updateRoleName(${index})">
                <button type="button" onclick="removeRole(${index})" 
                        class="text-red-500 hover:text-red-700 text-sm">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="space-y-2">
                <select id="roleType-${index}" onchange="updateRoleType(${index})" 
                        class="w-full text-sm px-2 py-1 border rounded">
                    <option value="text" ${role.type === 'text' ? 'selected' : ''}>텍스트 역할</option>
                    <option value="image" ${role.type === 'image' ? 'selected' : ''}>이미지 역할</option>
                </select>
                <textarea id="roleContent-${index}" rows="2" 
                          class="w-full text-sm px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                          placeholder="역할 설명 또는 이미지 URL"
                          onchange="updateRoleContent(${index})">${role.content || ''}</textarea>
            </div>
        </div>
    `).join('');
}

function closeEditSessionModal() {
    const modal = document.getElementById('editSessionModal');
    if (modal) modal.remove();
}

async function deleteSession(sessionId) {
    console.log('🗑️ 세션 삭제:', sessionId);
    
    const session = currentSessions.find(s => s.id === sessionId);
    if (!session) {
        alert('세션을 찾을 수 없습니다.');
        return;
    }
    
    if (!confirm(`정말 "${session.name}" 세션을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
        return;
    }
    
    try {
        console.log('💾 Supabase에서 세션 삭제 중...');
        
        if (!rolesSupabaseClient) {
            throw new Error('Supabase 클라이언트가 초기화되지 않음');
        }
        
        const { error } = await rolesSupabaseClient
            .from('sessions')
            .delete()
            .eq('id', sessionId);
        
        if (error) {
            console.error('❌ 세션 삭제 실패:', error);
            throw new Error(`세션 삭제 실패: ${error.message}`);
        }
        
        console.log('✅ 세션 삭제 성공');
        
        // 로컬 데이터에서 제거
        const sessionIndex = currentSessions.findIndex(s => s.id === sessionId);
        if (sessionIndex !== -1) {
            currentSessions.splice(sessionIndex, 1);
        }
        
        // 세션 목록 새로고침
        await renderSessionsList();
        
        alert(`"${session.name}" 세션이 성공적으로 삭제되었습니다.`);
        updateModalStatus(`세션 삭제 완료: ${session.name}`);
        
    } catch (error) {
        console.error('❌ 세션 삭제 오류:', error);
        alert(`세션 삭제 중 오류가 발생했습니다: ${error.message}`);
    }
}

// ============ 역할 편집 관련 함수들 ============
let currentEditingSession = null;

function addNewRole(sessionId) {
    console.log('➕ 새 역할 추가');
    
    const container = document.getElementById('rolesContainer');
    if (!container) return;
    
    // 현재 역할 개수 확인
    const existingRoles = container.querySelectorAll('[id^="role-"]');
    const newIndex = existingRoles.length;
    
    const newRoleHTML = `
        <div class="bg-gray-50 border rounded p-3" id="role-${newIndex}">
            <div class="flex items-center justify-between mb-2">
                <input type="text" value="새 역할 ${newIndex + 1}" 
                       class="font-medium bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-purple-500 rounded px-2"
                       id="roleName-${newIndex}" onchange="updateRoleName(${newIndex})">
                <button type="button" onclick="removeRole(${newIndex})" 
                        class="text-red-500 hover:text-red-700 text-sm">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="space-y-2">
                <select id="roleType-${newIndex}" onchange="updateRoleType(${newIndex})" 
                        class="w-full text-sm px-2 py-1 border rounded">
                    <option value="text" selected>텍스트 역할</option>
                    <option value="image">이미지 역할</option>
                </select>
                <textarea id="roleContent-${newIndex}" rows="2" 
                          class="w-full text-sm px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                          placeholder="역할 설명 또는 이미지 URL"
                          onchange="updateRoleContent(${newIndex})">역할 설명 없음</textarea>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', newRoleHTML);
}

function removeRole(index) {
    const roleElement = document.getElementById(`role-${index}`);
    if (roleElement && confirm('이 역할을 삭제하시겠습니까?')) {
        roleElement.remove();
    }
}

function updateRoleName(index) {
    console.log(`📝 역할 ${index} 이름 업데이트`);
}

function updateRoleType(index) {
    console.log(`🔄 역할 ${index} 타입 업데이트`);
    const typeSelect = document.getElementById(`roleType-${index}`);
    const contentTextarea = document.getElementById(`roleContent-${index}`);
    
    if (typeSelect && contentTextarea) {
        if (typeSelect.value === 'image') {
            contentTextarea.placeholder = '이미지 URL을 입력하세요';
        } else {
            contentTextarea.placeholder = '역할 설명을 입력하세요';
        }
    }
}

function updateRoleContent(index) {
    console.log(`💬 역할 ${index} 내용 업데이트`);
}

async function submitEditSession(event, sessionId) {
    event.preventDefault();
    console.log('📝 세션 편집 제출:', sessionId);
    
    const session = currentSessions.find(s => s.id === sessionId);
    if (!session) {
        alert('세션을 찾을 수 없습니다.');
        return;
    }
    
    try {
        // 폼 데이터 수집
        const name = document.getElementById('editSessionName').value.trim();
        const instructions = document.getElementById('editSessionInstructions').value.trim();
        const targetClass = document.getElementById('editSessionTargetClass').value;
        const status = document.getElementById('editSessionStatus').value;
        
        if (!name) {
            alert('세션 이름을 입력해주세요.');
            return;
        }
        
        // 역할 데이터 수집
        const roles = [];
        const roleElements = document.querySelectorAll('[id^="role-"]');
        
        roleElements.forEach((element, index) => {
            const nameInput = document.getElementById(`roleName-${index}`);
            const typeSelect = document.getElementById(`roleType-${index}`);
            const contentTextarea = document.getElementById(`roleContent-${index}`);
            
            if (nameInput && typeSelect && contentTextarea) {
                roles.push({
                    id: `role_${Date.now()}_${index}`,
                    name: nameInput.value.trim() || `역할 ${index + 1}`,
                    type: typeSelect.value,
                    content: contentTextarea.value.trim() || '역할 설명 없음'
                });
            }
        });
        
        // 업데이트 데이터 준비
        const updateData = {
            name: name,
            missions: JSON.stringify(roles),
            activity_instructions: instructions || null,
            target_class: targetClass,
            status: status
        };
        
        console.log('💾 Supabase에 세션 업데이트 중...', updateData);
        
        if (!rolesSupabaseClient) {
            throw new Error('Supabase 클라이언트가 초기화되지 않음');
        }
        
        const { data, error } = await rolesSupabaseClient
            .from('sessions')
            .update(updateData)
            .eq('id', sessionId)
            .select();
        
        if (error) {
            console.error('❌ 세션 업데이트 실패:', error);
            throw new Error(`세션 업데이트 실패: ${error.message}`);
        }
        
        console.log('✅ 세션 업데이트 성공:', data);
        
        // 로컬 데이터 업데이트
        const sessionIndex = currentSessions.findIndex(s => s.id === sessionId);
        if (sessionIndex !== -1) {
            currentSessions[sessionIndex] = {
                ...currentSessions[sessionIndex],
                name: name,
                missions: JSON.stringify(roles),
                parsedMissions: roles,
                activity_instructions: instructions || null,
                target_class: targetClass,
                status: status
            };
        }
        
        // 모달 닫기
        closeEditSessionModal();
        
        // 세션 목록 새로고침
        await renderSessionsList();
        
        alert(`"${name}" 세션이 성공적으로 수정되었습니다!`);
        updateModalStatus(`세션 수정 완료: ${name}`);
        
    } catch (error) {
        console.error('❌ 세션 수정 오류:', error);
        alert(`세션 수정 중 오류가 발생했습니다: ${error.message}`);
    }
}

// ============ 전역 함수 노출 ============
window.loadRolesModule = loadRolesModule; // 기본 모듈 로드 함수
window.loadRolesModuleWithUI = loadRolesModuleWithUI; // UI 포함 모듈 로드 함수
window.showRoleModal = showRoleModal;
window.closeRoleModal = closeRoleModal;
window.switchRoleTab = switchRoleTab;
window.loadTabContent = loadTabContent;
window.loadSessionsTab = loadSessionsTab;
window.loadAssignmentTab = loadAssignmentTab;
window.loadStatusTab = loadStatusTab;
window.selectSessionForAssignment = selectSessionForAssignment;
window.showSessionAssignmentModal = showSessionAssignmentModal;
window.closeSessionAssignmentModal = closeSessionAssignmentModal;
window.assignRoleToStudent = assignRoleToStudent;
window.showStudentSelectionModal = showStudentSelectionModal;
window.closeStudentSelectionModal = closeStudentSelectionModal;
window.filterStudents = filterStudents;
window.confirmAssignment = confirmAssignment;
window.removeAssignment = removeAssignment;
window.autoAssignAllRoles = autoAssignAllRoles;
window.updateAssignedStudentsDisplay = updateAssignedStudentsDisplay;
window.createNewSession = createNewSession;
window.closeCreateSessionModal = closeCreateSessionModal;
window.submitNewSession = submitNewSession;
window.editSession = editSession;
window.closeEditSessionModal = closeEditSessionModal;
window.submitEditSession = submitEditSession;
window.deleteSession = deleteSession;
window.addNewRole = addNewRole;
window.removeRole = removeRole;
window.updateRoleName = updateRoleName;
window.updateRoleType = updateRoleType;
window.updateRoleContent = updateRoleContent;
window.refreshAssignmentStatus = refreshAssignmentStatus;
window.testModuleConnection = testModuleConnection;
window.loadSessions = loadSessions;
window.loadStudents = loadStudents;
window.loadAssignments = loadAssignments;
window.loadAllData = loadAllData;
window.validateLoadedData = validateLoadedData;

console.log('✅ admin-rolesv2.js 파일 로드 완료 - 함수들이 window 객체에 노출됨');

// 즉시 실행 테스트
console.log('🧪 즉시 실행 테스트:');
console.log('  - loadRolesModule 타입:', typeof window.loadRolesModule);
console.log('  - testModuleConnection 타입:', typeof window.testModuleConnection);