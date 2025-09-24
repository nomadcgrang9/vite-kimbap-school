// Main JavaScript for Role Assignment System

// Check Supabase API initialization
function checkSupabaseAPI() {
    if (typeof supabaseAPI === 'undefined') {
        console.log('[Main] Waiting for Supabase API initialization...');
        return false;
    }
    console.log('[Main] Supabase API ready');
    return true;
}

// Wait for Supabase API to be ready
if (!checkSupabaseAPI()) {
    // Retry check after scripts load
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            if (!checkSupabaseAPI()) {
                console.warn('[Main] Supabase API still not ready after initialization');
            }
        }, 100);
    });
}

// Global variables
let currentStudent = null;
let currentAssignment = null;
let assignments = [];
let sessions = [];
let refreshInterval = null;

// Parse student ID function - GLOBAL
window.parseStudentId = function(studentId) {
    if (!studentId || studentId.length !== 4) {
        return null;
    }
    
    const grade = parseInt(studentId.substring(0, 1));
    const classNum = parseInt(studentId.substring(1, 2));
    const number = parseInt(studentId.substring(2, 4));
    
    // 27명 제한 검증 추가
    if (number < 1 || number > 27) {
        return { error: '학급당 27명까지만 등록 가능합니다. 01~27번 사이의 번호를 입력해주세요.' };
    }
    
    return {
        grade: grade,
        class: classNum,
        number: number,
        fullClass: `${grade}-${classNum}`
    };
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initialize();
    // Only check saved login if we're on student.html, not index.html
    if (window.location.pathname.includes('student.html')) {
        checkSavedLogin();
    }
    updateTime();
});

// Initialize
function initialize() {
    // Load data from localStorage or API
    loadAssignments();
    loadSessions();
    
    // Setup enter key for login
    const studentIdInput = document.getElementById('loginStudentId');
    if (studentIdInput) {
        studentIdInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const nameInput = document.getElementById('loginStudentName');
                if (nameInput) nameInput.focus();
            }
        });
        
        // Input validation for student ID
        studentIdInput.addEventListener('input', function(e) {
            this.value = this.value.replace(/[^0-9]/g, '');
            if (this.value.length > 4) {
                this.value = this.value.slice(0, 4);
            }
        });
    }
}

// Update current time
function updateTime() {
    const timeElement = document.getElementById('currentTime');
    if (timeElement) {
        const now = new Date();
        timeElement.textContent = now.toLocaleString('ko-KR');
    }
    setTimeout(updateTime, 1000);
}

// Check if student is already logged in
function checkSavedLogin() {
    // Only work if we have the required DOM elements (i.e., on student.html)
    if (!document.getElementById('roleCard')) {
        return; // Exit if we don't have student UI elements
    }
    
    const savedStudent = sessionStorage.getItem('currentStudent');
    if (savedStudent) {
        currentStudent = JSON.parse(savedStudent);
        showRole();
        checkStudentAssignment();
    }
}

// Student login function is defined later in the file to avoid duplication

// Auto-register student on login
async function autoRegisterStudent() {
    try {
        // Check if student already exists using Supabase
        let students = [];
        try {
            students = await supabaseAPI.students.getAll() || [];
        } catch (error) {
            console.log('Failed to load from Supabase, using localStorage');
            students = JSON.parse(localStorage.getItem('students') || '[]');
        }
        
        // Check if this student is already registered
        const existingStudent = students.find(s => 
            s.studentId === currentStudent.studentId
        );
        
        if (!existingStudent) {
            // Register new student
            const newStudent = {
                id: `${currentStudent.studentId}_${Date.now()}`,
                studentId: currentStudent.studentId,
                name: currentStudent.name,
                grade: currentStudent.grade,
                classNum: currentStudent.classNum,
                number: parseInt(currentStudent.number),  // Store as number
                fullClass: currentStudent.fullClass,
                addedAt: new Date().toISOString(),
                autoRegistered: true
            };
            
            // Save to database using Supabase
            try {
                await supabaseAPI.students.upsert(newStudent);
                console.log('Student auto-registered successfully in Supabase:', newStudent);
                
                // Trigger immediate refresh for admin page if open
                try {
                    localStorage.setItem('studentUpdateTrigger', Date.now().toString());
                    console.log('Student update trigger set for admin page');
                } catch(e) {
                    // Silently ignore storage errors
                }
            } catch (error) {
                // Fallback to localStorage
                let localStudents = JSON.parse(localStorage.getItem('students') || '[]');
                localStudents.push(newStudent);
                localStorage.setItem('students', JSON.stringify(localStudents));
                console.log('Student auto-registered to localStorage');
                
                // Trigger immediate refresh for admin page if open
                try {
                    localStorage.setItem('studentUpdateTrigger', Date.now().toString());
                    console.log('Student update trigger set for admin page (localStorage)');
                } catch(e) {
                    // Silently ignore storage errors
                }
            }
        } else if (existingStudent.name !== currentStudent.name) {
            // Update student name if changed
            existingStudent.name = currentStudent.name;
            existingStudent.lastUpdated = new Date().toISOString();
            
            try {
                // Use Supabase API to update student
                await supabaseAPI.students.upsert({ 
                    ...existingStudent,
                    name: currentStudent.name,
                    lastUpdated: existingStudent.lastUpdated
                });
            } catch (error) {
                // Update in localStorage
                let localStudents = JSON.parse(localStorage.getItem('students') || '[]');
                const index = localStudents.findIndex(s => s.studentId === currentStudent.studentId);
                if (index !== -1) {
                    localStudents[index] = existingStudent;
                    localStorage.setItem('students', JSON.stringify(localStudents));
                }
            }
        }
    } catch (error) {
        console.error('Error in auto-registration:', error);
    }
}

// Load assignments from storage or API
async function loadAssignments() {
    try {
        // Use Supabase API to load assignments
        const supabaseAssignments = await supabaseAPI.assignments.list();
        if (supabaseAssignments && supabaseAssignments.length > 0) {
            assignments = supabaseAssignments;
            console.log('Loaded from Supabase:', assignments.length);
        } else {
            throw new Error('No data from Supabase');
        }
    } catch (error) {
        console.log('Loading from localStorage due to:', error.message);
        // Load from localStorage
        assignments = JSON.parse(localStorage.getItem('assignments') || '[]');
        
        // Also load class assignments
        const classAssignments = JSON.parse(localStorage.getItem('classAssignments') || '{}');
        
        // Merge class assignments into assignments array
        Object.values(classAssignments).forEach(ca => {
            if (!assignments.find(a => a.id === ca.id)) {
                assignments.push(ca);
            }
        });
    }
    
    console.log('Loaded assignments count:', assignments.length);
    console.log('Assignments:', assignments);
    
    // 디버깅: 첫 번째 assignment 확인
    if (assignments.length > 0) {
        console.log('First assignment example:', assignments[0]);
    }
}

// Load sessions from storage or API
async function loadSessions() {
    try {
        // Use Supabase API to load sessions
        sessions = await supabaseAPI.sessions.list() || [];
    } catch (error) {
        sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
    }
}

// Check if student has an assignment
async function checkStudentAssignment() {
    try {
        // Reload assignments to get latest data
        await loadAssignments();
        await loadSessions();
        
        console.log('Current student:', currentStudent);
        console.log('Looking for class:', currentStudent.fullClass);
        console.log('All assignments:', assignments);
        
        // Debug: Show assignment structure
        assignments.forEach((a, index) => {
            console.log(`Assignment ${index}:`, {
                targetClass: a.targetClass,
                hasMissions: !!a.missions,
                missionsCount: a.missions ? a.missions.length : 0,
                id: a.id
            });
        });
        
        // Find class-based assignment for this student's class
        const classAssignment = assignments.find(a => {
            const hasTargetClass = a.targetClass === currentStudent.fullClass;
            const hasMissions = a.missions && a.missions.length > 0;
            const isActive = !a.status || a.status === 'active';
            
            if (hasTargetClass) {
                console.log('Checking class assignment:', {
                    id: a.id,
                    targetClass: a.targetClass,
                    hasMissions,
                    isActive,
                    status: a.status
                });
            }
            
            return hasTargetClass && hasMissions && isActive;
        });
        
        console.log('Class assignment found:', classAssignment);
        
        // Check if there's a specific assignment for this student
        let studentAssignment = assignments.find(a => 
            a.studentId === currentStudent.studentId && 
            a.targetClass === currentStudent.fullClass
        );
    
    // If no specific assignment but class has assignment, create auto-assignment
    if (!studentAssignment && classAssignment) {
        console.log('Creating auto-assignment for student');
        
        // Calculate which role this student should get based on their number
        const studentNumber = typeof currentStudent.number === 'number' ? 
            currentStudent.number : parseInt(currentStudent.number, 10);
        
        if (isNaN(studentNumber) || studentNumber < 1) {
            console.error('Invalid student number:', currentStudent.number);
            hideLoading();
            showNoRole();
            return;
        }
        
        const missions = classAssignment.missions;
        const roleIndex = (studentNumber - 1) % missions.length;
        const selectedMission = missions[roleIndex];
        
        console.log(`Student number: ${studentNumber}, Total missions: ${missions.length}, Role index: ${roleIndex}`);
        console.log('Selected mission:', selectedMission);
        
        studentAssignment = {
            id: `auto_${currentStudent.studentId}_${Date.now()}`,
            sessionId: classAssignment.sessionId,
            sessionName: classAssignment.sessionName,
            studentId: currentStudent.studentId,
            studentName: currentStudent.name,
            targetClass: currentStudent.fullClass,
            roleIndex: roleIndex,
            roleName: selectedMission.name || `역할 ${roleIndex + 1}`,
            roleContent: selectedMission.content || selectedMission.data,
            roleType: selectedMission.type || classAssignment.type,
            assignedAt: new Date().toISOString(),
            autoAssigned: true
        };
        
        // Save this auto-assignment
        await saveAutoAssignment(studentAssignment);
    }
    
        hideLoading();
        
        if (!studentAssignment) {
            // No assignment found
            showRole();
            showNoRole();
            startAutoRefresh();
        } else {
            currentAssignment = studentAssignment;
            
            // Mark as checked
            await markAssignmentAsChecked(currentAssignment);
            
            // Show the role
            showRole();
            displayRole();
            stopAutoRefresh();
        }
    } catch (error) {
        console.error('Error in checkStudentAssignment:', error);
        hideLoading();
        showError('역할 확인 중 오류가 발생했습니다: ' + error.message);
    }
}

// Save auto-assignment
async function saveAutoAssignment(assignment) {
    try {
        // Use Supabase API to create assignment
        await supabaseAPI.assignments.create(assignment);
        assignments.push(assignment);
    } catch (error) {
        // Save to localStorage
        assignments.push(assignment);
        localStorage.setItem('assignments', JSON.stringify(assignments));
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
        
        // Try to update via API
        if (assignment.id) {
            try {
                // Use Supabase API to update assignment
                await supabaseAPI.assignments.update(assignment.id, { 
                    checked: true, 
                    checkedAt: assignment.checkedAt 
                });
            } catch (error) {
                console.log('Failed to update check status via API');
            }
        }
    }
}

// Show role section
function showRole() {
    // Check if we have the required DOM elements
    const loginSection = document.getElementById('loginSection');
    const roleSection = document.getElementById('roleSection');
    const displayStudentId = document.getElementById('displayStudentId');
    const displayStudentName = document.getElementById('displayStudentName');
    
    if (!loginSection || !roleSection || !displayStudentId || !displayStudentName) {
        console.log('Student UI elements not found, skipping role show');
        return; // Exit if we don't have student UI elements
    }
    
    loginSection.classList.add('hidden');
    roleSection.classList.remove('hidden');
    
    // Display student info
    displayStudentId.textContent = currentStudent.studentId;
    displayStudentName.textContent = currentStudent.name;
}

// Show no role message
function showNoRole() {
    const noRoleElement = document.getElementById('noRoleMessage');
    const roleCardElement = document.getElementById('roleCard');
    
    if (!noRoleElement || !roleCardElement) {
        console.log('Student UI elements not found, skipping no role show');
        return; // Exit if we don't have student UI elements
    }
    
    noRoleElement.classList.remove('hidden');
    roleCardElement.classList.add('hidden');
}

// Legacy function - replaced by new unified displayRole below

// 완전 새로운 역할 표시 함수
function displayRole() {
    console.log('[Role Display] 역할 표시 시작:', currentAssignment);
    
    const mainRoleTitle = document.getElementById('mainRoleTitle');
    const roleImageContainer = document.getElementById('roleImageContainer');
    const mainRoleImage = document.getElementById('mainRoleImage');
    
    if (!mainRoleTitle) {
        console.error('[Role Display] mainRoleTitle 요소를 찾을 수 없음');
        return;
    }
    
    // 역할 이름 표시 (항상)
    let roleDisplayName = currentAssignment.roleName || currentAssignment.role_name || '역할';
    mainRoleTitle.textContent = roleDisplayName;
    
    // 역할 타입에 따른 처리
    const roleType = currentAssignment.roleType || currentAssignment.role_type || 'text';
    const roleContent = currentAssignment.roleContent || currentAssignment.role_content || '';
    
    console.log('[Role Display] 역할 정보:', {
        name: roleDisplayName,
        type: roleType,
        contentLength: roleContent?.length || 0
    });
    
    if (roleType === 'image' && roleContent && roleImageContainer && mainRoleImage) {
        // 이미지 역할: 이미지 표시
        roleImageContainer.classList.remove('hidden');
        mainRoleImage.src = roleContent;
        mainRoleImage.alt = roleDisplayName;
        console.log('[Role Display] 이미지 역할 표시 완료');
    } else {
        // 텍스트 역할: 이미지 숨김
        if (roleImageContainer) {
            roleImageContainer.classList.add('hidden');
        }
        console.log('[Role Display] 텍스트 역할 표시 완료');
    }
}

// 호환성을 위한 기존 함수 유지
function displayImageRole() {
    console.log('[Role Display] displayImageRole 호출 - 새로운 displayRole() 사용');
    displayRole();
}

function displayTextRole() {
    console.log('[Role Display] displayTextRole 호출 - 새로운 displayRole() 사용');
    displayRole();
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

// Check role again - GLOBAL FUNCTION
window.checkRoleAgain = async function() {
    showLoading();
    await checkStudentAssignment();
}

// Logout - GLOBAL FUNCTION
window.logout = function() {
    sessionStorage.removeItem('currentStudent');
    currentStudent = null;
    currentAssignment = null;
    
    // Reset form
    document.getElementById('loginStudentId').value = '';
    document.getElementById('loginStudentName').value = '';
    
    // Show login section
    document.getElementById('loginSection').classList.remove('hidden');
    document.getElementById('roleSection').classList.add('hidden');
    
    stopAutoRefresh();
}

// Teacher login functions - GLOBAL FUNCTIONS
window.showTeacherLogin = function() {
    document.getElementById('teacherLoginModal').classList.remove('hidden');
}

window.closeTeacherLogin = function() {
    document.getElementById('teacherLoginModal').classList.add('hidden');
    document.getElementById('teacherPassword').value = '';
}

window.teacherLogin = function(event) {
    event.preventDefault();
    
    const password = document.getElementById('teacherPassword').value;
    
    if (password === 'teacher123') {
        // Save teacher login status
        sessionStorage.setItem('teacherLoggedIn', 'true');
        // Redirect to admin page (v2)
        window.location.href = 'admin-v2.html';
    } else {
        showError('비밀번호가 올바르지 않습니다.');
        document.getElementById('teacherPassword').value = '';
    }
}

// Student login function for main page
window.studentLogin = function(event) {
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
    
    // 27명 제한 검증 (parseStudentId 함수 활용)
    const parsedStudent = window.parseStudentId(studentId);
    if (parsedStudent && parsedStudent.error) {
        showError('학번을 정확히 입력해주십시오.\n' + parsedStudent.error);
        return;
    }
    
    if (!parsedStudent) {
        showError('학번을 정확히 입력해주십시오.\n올바른 형식: 학년(1자리) + 반(1자리) + 번호(2자리, 01~27)');
        return;
    }
    
    // Open student page in new tab with parameters
    // 새 탭에서 열어서 줌 설정이 독립적으로 적용되도록 함
    window.open(`student.html?studentId=${encodeURIComponent(studentId)}&studentName=${encodeURIComponent(studentName)}`, '_blank');
}

// Auto-refresh for checking assignments
function startAutoRefresh() {
    if (refreshInterval) return;
    
    refreshInterval = setInterval(async () => {
        await loadAssignments();
        await loadSessions();
        await checkStudentAssignment();
    }, 30000); // Check every 30 seconds
}

function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

// Utility functions
function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.remove('hidden');
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.add('hidden');
}

function showError(message) {
    const errorMsg = document.getElementById('errorMessage');
    const errorModal = document.getElementById('errorModal');
    
    if (errorMsg) errorMsg.textContent = message;
    if (errorModal) errorModal.classList.remove('hidden');
}

window.closeError = function() {
    const errorModal = document.getElementById('errorModal');
    if (errorModal) errorModal.classList.add('hidden');
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    notification.innerHTML = `<i class="fas fa-check-circle mr-2"></i>${message}`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 3000);
}

// ==========================================
// CHEESE KIMBAP (치즈김밥) - SPINNER FUNCTIONS
// ==========================================

let spinnerLists = [];
let modalSpinnerLists = [];

// Initialize spinner lists on page load
document.addEventListener('DOMContentLoaded', function() {
    loadSpinnerListsForIndex();
});

// Load spinner lists for index page
async function loadSpinnerListsForIndex() {
    try {
        // Use Supabase API to load spinner lists
        spinnerLists = await supabaseAPI.config.get('spinner_lists') || [];
    } catch (error) {
        spinnerLists = JSON.parse(localStorage.getItem('spinner_lists') || '[]');
    }
    
    updateSavedListsDropdown();
}

// Update saved lists dropdown
function updateSavedListsDropdown() {
    const select = document.getElementById('savedListsSelect');
    if (!select) return;
    
    // Clear existing options except the first one
    select.innerHTML = '<option value="">불러오기</option>';
    
    if (spinnerLists.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = '저장된 목록 없음';
        option.disabled = true;
        select.appendChild(option);
        return;
    }
    
    // Add all lists directly without grouping
    spinnerLists.forEach(list => {
        const option = document.createElement('option');
        option.value = list.id;
        option.textContent = `${list.name} (${list.items.length}개)`;
        select.appendChild(option);
    });
}

// Load selected list from dropdown - GLOBAL FUNCTION
window.loadSelectedList = function() {
    const select = document.getElementById('savedListsSelect');
    const listId = select.value;
    
    if (!listId) return;
    
    const selectedList = spinnerLists.find(list => list.id === listId);
    if (!selectedList) {
        alert('선택한 목록을 찾을 수 없습니다.');
        return;
    }
    
    // Update textarea with selected list items
    const textarea = document.getElementById('wheelItems');
    if (textarea) {
        textarea.value = selectedList.items.join('\n');
        
        // Trigger wheel update if the function exists
        if (typeof updateWheel === 'function') {
            updateWheel();
        }
        
        showNotification(`"${selectedList.name}" 목록이 불러와졌습니다!`);
    }
    
    // Reset dropdown
    select.value = '';
}

// Refresh saved lists - GLOBAL FUNCTION
window.refreshSavedLists = function() {
    loadSpinnerListsForIndex();
    showNotification('목록이 새로고침되었습니다.');
}

// Load saved wheel modal - GLOBAL FUNCTION (for backward compatibility)
window.loadSavedWheel = function() {
    // Show the modal instead of the old function
    showSavedListsModal();
}

// Show saved lists modal
function showSavedListsModal() {
    loadModalSpinnerLists();
    document.getElementById('savedListsModal').classList.remove('hidden');
}

// Close saved lists modal - GLOBAL FUNCTION
window.closeSavedListsModal = function() {
    document.getElementById('savedListsModal').classList.add('hidden');
}

// Load spinner lists for modal
async function loadModalSpinnerLists() {
    try {
        // Use Supabase API to load spinner lists
        modalSpinnerLists = await supabaseAPI.config.get('spinner_lists') || [];
    } catch (error) {
        modalSpinnerLists = JSON.parse(localStorage.getItem('spinner_lists') || '[]');
    }
    
    displayModalSpinnerLists();
}

// Display spinner lists in modal
function displayModalSpinnerLists() {
    const container = document.getElementById('modalSpinnerLists');
    if (!container) return;
    
    if (modalSpinnerLists.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-folder-open text-4xl mb-3"></i>
                <p>저장된 목록이 없습니다</p>
                <p class="text-sm">관리자 페이지에서 목록을 생성해보세요</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = modalSpinnerLists.map(list => `
        <div class="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
             onclick="selectSpinnerList('${list.id}')">
            <div class="flex justify-between items-start">
                <div>
                    <h4 class="font-semibold text-gray-800">${list.name}</h4>
                    <p class="text-sm text-gray-600">
                        <i class="fas fa-list mr-1"></i>
                        ${list.items.length}개 항목
                    </p>
                </div>
                <i class="fas fa-chevron-right text-gray-400"></i>
            </div>
            <div class="mt-2 text-xs text-gray-600">
                <div class="flex flex-wrap gap-1">
                    ${list.items.slice(0, 4).map(item => `
                        <span class="bg-gray-100 px-2 py-1 rounded">${item}</span>
                    `).join('')}
                    ${list.items.length > 4 ? `<span class="px-2 py-1">... +${list.items.length - 4}개</span>` : ''}
                </div>
            </div>
        </div>
    `).join('');
}



// Select spinner list from modal - GLOBAL FUNCTION
window.selectSpinnerList = function(listId) {
    const selectedList = modalSpinnerLists.find(list => list.id === listId);
    if (!selectedList) {
        alert('선택한 목록을 찾을 수 없습니다.');
        return;
    }
    
    // Update textarea with selected list items
    const textarea = document.getElementById('wheelItems');
    if (textarea) {
        textarea.value = selectedList.items.join('\n');
        
        // Trigger wheel update if the function exists
        if (typeof updateWheel === 'function') {
            updateWheel();
        }
        
        showNotification(`"${selectedList.name}" 목록이 불러와졌습니다!`);
    }
    
    // Close modal
    closeSavedListsModal();
}