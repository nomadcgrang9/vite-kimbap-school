// ================================================
// 학생 관리 모듈 (admin-students.js)
// 2025-01-20
// ================================================

console.log('[admin-students.js] 학생 관리 모듈 로드 시작');

// ================================================
// 네임스페이스 및 초기화
// ================================================
window.StudentsAdmin = {
    data: {
        students: [],
        classTabs: {},
        totalStudents: 0,
        gradeSettings: {
            // 학년별 최대 학급 수
            maxClasses: {
                1: 10, 2: 10, 3: 10, 4: 10, 5: 10, 6: 10
            },
            // 노출할 학년 설정
            visibleGrades: {
                1: true, 2: true, 3: true, 4: true, 5: true, 6: true
            }
        }
    },
    ui: {
        container: null,
        initialized: false
    },
    
    // 초기화
    init: async function() {
        console.log('[StudentsAdmin] 초기화 시작');
        
        // 설정 로드
        this.loadSettings();
        
        // 컨테이너 생성
        this.createUI();
        
        // 데이터 로드
        await this.loadStudents();
        
        // 실시간 업데이트 트리거 감지
        this.startUpdateListener();
        
        this.ui.initialized = true;
        console.log('[StudentsAdmin] 초기화 완료');
    },
    
    // UI 생성
    createUI: function() {
        console.log('[StudentsAdmin] UI 생성 시작');
        
        // 모달 생성
        const modal = document.createElement('div');
        modal.id = 'studentsModal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 hidden z-50';
        modal.innerHTML = `
            <div class="flex items-center justify-center min-h-screen p-4">
                <div class="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
                    <!-- 헤더 -->
                    <div class="bg-green-500 text-white px-6 py-4 flex justify-between items-center">
                        <h2 class="text-xl font-bold">
                            <i class="fas fa-users mr-2"></i>학생 관리
                        </h2>
                        <button onclick="StudentsAdmin.closeModal()" class="text-white hover:text-gray-200">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    
                    <!-- 컨텐츠 -->
                    <div class="p-6 overflow-y-auto max-h-[80vh]">
                        
                        <!-- 설정 및 새로고침 버튼 -->
                        <div class="mb-4 flex justify-between items-center">
                            <h3 class="text-lg font-bold text-gray-700">
                                <i class="fas fa-list mr-2"></i>학급별 명단
                            </h3>
                            <div class="flex space-x-2">
                                <button onclick="StudentsAdmin.showGradeSettings()" 
                                        class="bg-purple-500 text-white px-3 py-2 rounded hover:bg-purple-600 transition text-sm">
                                    <i class="fas fa-eye mr-1"></i>학년 노출
                                </button>
                                <button onclick="StudentsAdmin.showMaxClassSettings()" 
                                        class="bg-orange-500 text-white px-3 py-2 rounded hover:bg-orange-600 transition text-sm">
                                    <i class="fas fa-cog mr-1"></i>학급 설정
                                </button>
                                <button onclick="StudentsAdmin.refreshData()" 
                                        class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition">
                                    <i class="fas fa-sync-alt mr-2"></i>새로고침
                                </button>
                            </div>
                        </div>
                        
                        <!-- 학급 탭 -->
                        <div id="classTabs" class="flex space-x-2 mb-4">
                            <!-- 학급 탭들이 여기에 표시됩니다 -->
                        </div>
                        
                        <!-- 학생 목록 -->
                        <div id="studentsList" class="bg-white border rounded-lg">
                            <!-- 학생 목록이 여기에 표시됩니다 -->
                        </div>
                        
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.ui.container = modal;
        
        console.log('[StudentsAdmin] UI 생성 완료');
    },
    
    // 모달 열기
    openModal: function() {
        console.log('[StudentsAdmin] 모달 열기');
        
        this.ui.container.classList.remove('hidden');
        
        // 강제로 데이터 로드 (지연 시간 추가)
        setTimeout(() => {
            console.log('[StudentsAdmin] 강제 데이터 로드 시작');
            this.refreshData();
        }, 100);
        
        // 추가 안전장치 - 1초 후 한번 더
        setTimeout(() => {
            if (!this.data.students || this.data.students.length === 0) {
                console.log('[StudentsAdmin] 추가 안전장치 - 데이터 재로드');
                this.refreshData();
            }
        }, 1000);
    },
    
    // 모달 닫기
    closeModal: function() {
        console.log('[StudentsAdmin] 모달 닫기');
        this.ui.container.classList.add('hidden');
    },
    
    // 학생 데이터 로드
    loadStudents: async function() {
        console.log('[StudentsAdmin] 학생 데이터 로드 시작');
        
        try {
            // Supabase 직접 연결 시도 (supabaseAPI 사용)
            let students = [];
            
            try {
                if (typeof supabaseAPI !== 'undefined' && supabaseAPI.students) {
                    console.log('[StudentsAdmin] Supabase API를 통해 학생 데이터 로드 시도...');
                    students = await supabaseAPI.students.getAll() || [];
                    console.log('[StudentsAdmin] Supabase에서 학생 데이터 로드 성공:', students.length + '명');
                } else {
                    throw new Error('supabaseAPI를 사용할 수 없음');
                }
            } catch (supabaseError) {
                console.log('[StudentsAdmin] Supabase 로드 실패, localStorage 폴백:', supabaseError.message);
                
                // localStorage 폴백
                const studentsData = localStorage.getItem('students');
                if (studentsData) {
                    students = JSON.parse(studentsData);
                    console.log('[StudentsAdmin] localStorage에서 학생 데이터 로드:', students.length + '명');
                }
            }
            
            if (students.length > 0) {
                // Supabase 데이터와 localStorage 데이터 필드명 통일
                students = students.map(student => ({
                    ...student,
                    studentId: student.student_id || student.studentId,
                    classNum: student.class_num || student.classNum,
                    fullClass: student.full_class || student.fullClass
                }));
                
                // 즉시 오류 데이터 정리
                const beforeCount = students.length;
                students = students.filter(student => {
                    if (!student.studentId || student.studentId.length !== 4) return false;
                    
                    const grade = parseInt(student.studentId.charAt(0));
                    const classNum = parseInt(student.studentId.charAt(1));
                    const number = parseInt(student.studentId.substring(2, 4));
                    
                    // 27명 초과 제거
                    if (number < 1 || number > 27) {
                        console.log('[StudentsAdmin] 제거됨 - 27명 초과:', student.studentId);
                        return false;
                    }
                    
                    // 학년 노출 설정 확인
                    if (!this.data.gradeSettings.visibleGrades[grade]) {
                        console.log('[StudentsAdmin] 제외됨 - 학년 숨김:', student.studentId, `(${grade}학년)`);
                        return false;
                    }
                    
                    // 학년별 최대 학급 수 초과 제거
                    const maxClassForGrade = this.data.gradeSettings.maxClasses[grade] || 10;
                    if (classNum > maxClassForGrade) {
                        console.log('[StudentsAdmin] 제거됨 - 최대 학급 수 초과:', student.studentId, `(${grade}학년 ${classNum}반 > ${maxClassForGrade}반)`);
                        return false;
                    }
                    
                    return true;
                });
                
                // 정리된 데이터가 있으면 다시 저장
                if (beforeCount !== students.length) {
                    localStorage.setItem('students', JSON.stringify(students));
                    localStorage.setItem('studentUpdateTrigger', Date.now().toString());
                    console.log('[StudentsAdmin] 오류 데이터 정리:', beforeCount, '→', students.length, '(제거:', beforeCount - students.length, '명)');
                }
                
                this.data.students = students;
            } else {
                this.data.students = [];
                console.log('[StudentsAdmin] localStorage에 학생 데이터 없음');
            }
            
            // 학급별로 분류
            this.classifyStudents();
            
        } catch (error) {
            console.error('[StudentsAdmin] 학생 데이터 로드 실패:', error);
            this.data.students = [];
        }
    },
    
    // 설정 로드
    loadSettings: function() {
        // 학년별 최대 학급 수 설정 로드
        const savedMaxClasses = localStorage.getItem('adminGradeMaxClasses');
        if (savedMaxClasses) {
            this.data.gradeSettings.maxClasses = JSON.parse(savedMaxClasses);
        }
        
        // 학년 노출 설정 로드
        const savedVisibleGrades = localStorage.getItem('adminVisibleGrades');
        if (savedVisibleGrades) {
            this.data.gradeSettings.visibleGrades = JSON.parse(savedVisibleGrades);
        }
        
        console.log('[StudentsAdmin] 설정 로드됨:', this.data.gradeSettings);
    },
    
    // 설정 저장
    saveSettings: function() {
        localStorage.setItem('adminGradeMaxClasses', JSON.stringify(this.data.gradeSettings.maxClasses));
        localStorage.setItem('adminVisibleGrades', JSON.stringify(this.data.gradeSettings.visibleGrades));
        console.log('[StudentsAdmin] 설정 저장됨:', this.data.gradeSettings);
    },
    
    // 학급별 분류 (동적 탭 생성, 이미 정리된 데이터 사용)
    classifyStudents: function() {
        console.log('[StudentsAdmin] 학급별 분류 시작 (동적 탭)');
        
        // 초기화
        this.data.classTabs = {};
        
        // 학생들을 학급별로 분류 (이미 정리된 데이터)
        this.data.students.forEach(student => {
            // 학급 정보 추출
            let classKey = student.fullClass || student.class_info;
            
            // fullClass가 없으면 학번에서 추출
            if (!classKey && student.studentId && student.studentId.length === 4) {
                const grade = parseInt(student.studentId.charAt(0));
                const classNum = parseInt(student.studentId.charAt(1));
                classKey = `${grade}-${classNum}`;
            }
            
            // 기본값
            if (!classKey) {
                classKey = '미분류';
            }
            
            // 학급별 배열 생성
            if (!this.data.classTabs[classKey]) {
                this.data.classTabs[classKey] = [];
            }
            
            this.data.classTabs[classKey].push(student);
        });
        
        // 총 학생 수 계산
        this.data.totalStudents = this.data.students.length;
        
        // 학급별 현황 로그
        const classInfo = Object.keys(this.data.classTabs)
            .sort()
            .reduce((acc, key) => {
                acc[key] = this.data.classTabs[key].length;
                return acc;
            }, {});
        
        console.log('[StudentsAdmin] 학급별 분류 완료:', {
            ...classInfo,
            총합: this.data.totalStudents,
            최대학급수: this.data.maxClassNumber
        });
    },
    

    
    // 학급 탭 업데이트 (동적)
    updateClassTabs: function() {
        console.log('[StudentsAdmin] 학급 탭 업데이트 (동적)');
        
        const tabsContainer = document.getElementById('classTabs');
        if (!tabsContainer) return;
        
        // 전체 탭 먼저 추가
        let tabs = [
            { key: 'all', name: '전체', count: this.data.totalStudents, color: 'gray' }
        ];
        
        // 학급별 탭 동적 생성 (학급명 순으로 정렬)
        const classKeys = Object.keys(this.data.classTabs).sort();
        const colors = ['blue', 'green', 'purple', 'orange', 'indigo', 'pink', 'red', 'yellow'];
        
        classKeys.forEach((classKey, index) => {
            const count = this.data.classTabs[classKey].length;
            if (count > 0) {  // 학생이 있는 학급만 표시
                tabs.push({
                    key: classKey,
                    name: `${classKey}반`,
                    count: count,
                    color: colors[index % colors.length]
                });
            }
        });
        
        // 탭 HTML 생성
        tabsContainer.innerHTML = tabs.map(tab => `
            <button onclick="StudentsAdmin.showClass('${tab.key}')" 
                    class="px-3 py-2 rounded-lg bg-${tab.color}-100 text-${tab.color}-700 hover:bg-${tab.color}-200 transition text-sm">
                ${tab.name} (${tab.count}명)
            </button>
        `).join('');
        
        console.log('[StudentsAdmin] 동적 탭 생성 완료:', tabs.map(t => t.name));
    },
    
    // 특정 학급 표시
    showClass: function(classKey) {
        console.log('[StudentsAdmin] 학급 표시:', classKey);
        
        const listContainer = document.getElementById('studentsList');
        if (!listContainer) return;
        
        let students = [];
        if (classKey === 'all') {
            students = this.data.students;
        } else {
            students = this.data.classTabs[classKey] || [];
        }
        
        if (students.length === 0) {
            listContainer.innerHTML = `
                <div class="p-8 text-center text-gray-500">
                    <i class="fas fa-user-slash text-4xl mb-4"></i>
                    <p class="text-lg">등록된 학생이 없습니다.</p>
                </div>
            `;
            return;
        }
        
        // 최근 로그인순으로 정렬
        students.sort((a, b) => new Date(b.lastLogin || 0) - new Date(a.lastLogin || 0));
        
        listContainer.innerHTML = `
            <div class="overflow-x-auto">
                <table class="min-w-full">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">학번</th>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">학급</th>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">번호</th>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">마지막 로그인</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${students.map(student => `
                            <tr class="hover:bg-gray-50">
                                <td class="px-4 py-2 text-sm font-medium text-gray-900">${student.studentId}</td>
                                <td class="px-4 py-2 text-sm text-gray-900">${student.name}</td>
                                <td class="px-4 py-2 text-sm text-gray-600">${student.fullClass || student.class_info}</td>
                                <td class="px-4 py-2 text-sm text-gray-600">${student.number || '-'}</td>
                                <td class="px-4 py-2 text-sm text-gray-500">
                                    ${student.lastLogin ? new Date(student.lastLogin).toLocaleString('ko-KR') : '미로그인'}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },
    
    // 데이터 새로고침
    refreshData: async function() {
        console.log('[StudentsAdmin] 데이터 새로고침');
        
        try {
            // 학급 탭 컨테이너에 로딩 표시
            const tabsContainer = document.getElementById('classTabs');
            if (tabsContainer) {
                tabsContainer.innerHTML = '<div class="text-center text-gray-500 py-4">데이터 로딩 중...</div>';
            }
            
            // 학생 목록 컨테이너에 로딩 표시
            const listContainer = document.getElementById('studentsList');
            if (listContainer) {
                listContainer.innerHTML = '<div class="text-center text-gray-500 py-8">학생 데이터 로딩 중...</div>';
            }
            
            // 데이터 다시 로드
            await this.loadStudents();
            
            // UI 업데이트 (약간의 지연 후)
            setTimeout(() => {
                this.updateClassTabs();
                this.showClass('all'); // 전체 보기로 초기화
                
                console.log('[StudentsAdmin] 새로고침 완료 - 학생 수:', this.data.totalStudents);
                
                // 데이터가 없으면 에러 메시지 표시
                if (this.data.totalStudents === 0) {
                    const listContainer = document.getElementById('studentsList');
                    if (listContainer) {
                        listContainer.innerHTML = `
                            <div class="p-8 text-center text-red-500">
                                <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                                <p class="text-lg font-bold">학생 데이터를 불러올 수 없습니다</p>
                                <p class="text-sm">localStorage에 저장된 데이터가 없습니다.</p>
                                <button onclick="StudentsAdmin.refreshData()" class="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
                                    다시 시도
                                </button>
                            </div>
                        `;
                    }
                }
            }, 50);
            
        } catch (error) {
            console.error('[StudentsAdmin] 새로고침 중 오류:', error);
            
            const listContainer = document.getElementById('studentsList');
            if (listContainer) {
                listContainer.innerHTML = `
                    <div class="p-8 text-center text-red-500">
                        <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                        <p class="text-lg font-bold">오류가 발생했습니다</p>
                        <p class="text-sm">${error.message}</p>
                        <button onclick="StudentsAdmin.refreshData()" class="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
                            다시 시도
                        </button>
                    </div>
                `;
            }
        }
    },
    
    // 실시간 업데이트 리스너
    startUpdateListener: function() {
        console.log('[StudentsAdmin] 실시간 업데이트 리스너 시작');
        
        let lastTrigger = localStorage.getItem('studentUpdateTrigger') || '0';
        
        setInterval(() => {
            const currentTrigger = localStorage.getItem('studentUpdateTrigger') || '0';
            if (currentTrigger !== lastTrigger) {
                console.log('[StudentsAdmin] 학생 데이터 변경 감지, 자동 새로고침');
                this.refreshData();
                lastTrigger = currentTrigger;
            }
        }, 2000); // 2초마다 체크
        
        console.log('[StudentsAdmin] 실시간 업데이트 리스너 설정 완료');
    },
    
    // 학년 노출 설정 모달 표시
    showGradeSettings: function() {
        console.log('[StudentsAdmin] 학년 노출 설정 모달 표시');
        
        const gradeModal = document.createElement('div');
        gradeModal.id = 'gradeSettingsModal';
        gradeModal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
        
        const gradeCheckboxes = [];
        for (let grade = 1; grade <= 6; grade++) {
            const isChecked = this.data.gradeSettings.visibleGrades[grade];
            gradeCheckboxes.push(`
                <label class="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" id="grade${grade}Visible" ${isChecked ? 'checked' : ''} 
                           class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500">
                    <span class="text-sm font-medium text-gray-700">${grade}학년 명단 표시</span>
                </label>
            `);
        }
        
        gradeModal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div class="bg-purple-500 text-white px-6 py-4 rounded-t-lg">
                    <h3 class="text-lg font-bold">
                        <i class="fas fa-eye mr-2"></i>학년별 노출 설정
                    </h3>
                </div>
                <div class="p-6">
                    <div class="mb-4">
                        <p class="text-sm text-gray-600 mb-4">학생 관리에서 표시할 학년을 선택하세요.</p>
                        <div class="space-y-2">
                            ${gradeCheckboxes.join('')}
                        </div>
                    </div>
                    <div class="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                        <p class="text-sm text-blue-800">
                            <i class="fas fa-info-circle mr-2"></i>
                            체크 해제된 학년의 학생들은 학생 관리에서 숨겨집니다.
                        </p>
                    </div>
                    <div class="flex space-x-3">
                        <button onclick="StudentsAdmin.saveGradeSettings()" 
                                class="flex-1 bg-purple-500 text-white py-2 rounded hover:bg-purple-600 transition">
                            <i class="fas fa-save mr-2"></i>저장
                        </button>
                        <button onclick="StudentsAdmin.closeGradeSettings()" 
                                class="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600 transition">
                            <i class="fas fa-times mr-2"></i>취소
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(gradeModal);
    },

    // 최대 학급 설정 모달 표시
    showMaxClassSettings: function() {
        console.log('[StudentsAdmin] 학년별 최대 학급 설정 모달 표시');
        
        const settingsModal = document.createElement('div');
        settingsModal.id = 'maxClassSettingsModal';
        settingsModal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
        
        const gradeInputs = [];
        for (let grade = 1; grade <= 6; grade++) {
            const currentMax = this.data.gradeSettings.maxClasses[grade];
            const isVisible = this.data.gradeSettings.visibleGrades[grade];
            gradeInputs.push(`
                <div class="flex items-center space-x-3 p-3 border rounded-lg ${!isVisible ? 'bg-gray-100 opacity-50' : ''}">
                    <label class="flex-1 text-sm font-medium text-gray-700">${grade}학년</label>
                    <input type="number" id="maxClass${grade}" min="1" max="50" value="${currentMax}" 
                           ${!isVisible ? 'disabled' : ''}
                           class="w-16 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500">
                    <span class="text-sm text-gray-500">반까지</span>
                </div>
            `);
        }
        
        settingsModal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div class="bg-orange-500 text-white px-6 py-4 rounded-t-lg">
                    <h3 class="text-lg font-bold">
                        <i class="fas fa-cog mr-2"></i>학년별 최대 학급 수 설정
                    </h3>
                </div>
                <div class="p-6">
                    <div class="mb-4">
                        <p class="text-sm text-gray-600 mb-4">각 학년별로 표시할 최대 학급 수를 설정하세요.</p>
                        <div class="space-y-2">
                            ${gradeInputs.join('')}
                        </div>
                    </div>
                    <div class="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                        <p class="text-sm text-yellow-800">
                            <i class="fas fa-info-circle mr-2"></i>
                            설정한 수보다 큰 반 번호는 자동으로 숨겨집니다.<br>
                            (예: 3학년 5반 설정 시 → 6반 이상 숨김)
                        </p>
                    </div>
                    <div class="flex space-x-3">
                        <button onclick="StudentsAdmin.saveMaxClassSettings()" 
                                class="flex-1 bg-orange-500 text-white py-2 rounded hover:bg-orange-600 transition">
                            <i class="fas fa-save mr-2"></i>저장
                        </button>
                        <button onclick="StudentsAdmin.closeMaxClassSettings()" 
                                class="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600 transition">
                            <i class="fas fa-times mr-2"></i>취소
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(settingsModal);
    },
    
    // 학년 노출 설정 저장
    saveGradeSettings: function() {
        console.log('[StudentsAdmin] 학년 노출 설정 저장 시작');
        
        for (let grade = 1; grade <= 6; grade++) {
            const checkbox = document.getElementById(`grade${grade}Visible`);
            if (checkbox) {
                this.data.gradeSettings.visibleGrades[grade] = checkbox.checked;
            }
        }
        
        this.saveSettings();
        
        // 설정 변경 후 데이터 새로고침
        this.refreshData();
        
        // 모달 닫기
        this.closeGradeSettings();
        
        // 성공 메시지
        const visibleGradesList = [];
        for (let grade = 1; grade <= 6; grade++) {
            if (this.data.gradeSettings.visibleGrades[grade]) {
                visibleGradesList.push(grade + '학년');
            }
        }
        alert(`학년 노출 설정이 저장되었습니다.\n표시될 학년: ${visibleGradesList.join(', ')}`);
    },
    
    // 학년 노출 설정 모달 닫기
    closeGradeSettings: function() {
        const modal = document.getElementById('gradeSettingsModal');
        if (modal) {
            modal.remove();
        }
    },

    // 최대 학급 설정 저장
    saveMaxClassSettings: function() {
        console.log('[StudentsAdmin] 학년별 최대 학급 설정 저장 시작');
        
        for (let grade = 1; grade <= 6; grade++) {
            const input = document.getElementById(`maxClass${grade}`);
            if (input && !input.disabled) {
                const value = parseInt(input.value);
                if (isNaN(value) || value < 1 || value > 50) {
                    alert(`${grade}학년의 최대 학급 수를 1~50 사이로 입력해주세요.`);
                    return;
                }
                this.data.gradeSettings.maxClasses[grade] = value;
            }
        }
        
        this.saveSettings();
        
        // 설정 변경 후 데이터 새로고림
        this.refreshData();
        
        // 모달 닫기
        this.closeMaxClassSettings();
        
        // 성공 메시지
        const settingsList = [];
        for (let grade = 1; grade <= 6; grade++) {
            if (this.data.gradeSettings.visibleGrades[grade]) {
                settingsList.push(`${grade}학년: ${this.data.gradeSettings.maxClasses[grade]}반까지`);
            }
        }
        alert(`학년별 최대 학급 설정이 저장되었습니다.\n\n${settingsList.join('\n')}`);
    },
    
    // 최대 학급 설정 모달 닫기
    closeMaxClassSettings: function() {
        const modal = document.getElementById('maxClassSettingsModal');
        if (modal) {
            modal.remove();
        }
    },
    

};

// ================================================
// 전역 함수 (admin-v2.html에서 호출)
// ================================================
window.loadStudentsModule = async function() {
    console.log('[loadStudentsModule] 학생 관리 모듈 로드 및 실행');
    
    try {
        // 초기화 강화
        if (!window.StudentsAdmin.ui.initialized) {
            console.log('[loadStudentsModule] 초기화 시작');
            await window.StudentsAdmin.init();
        } else {
            console.log('[loadStudentsModule] 이미 초기화됨 - 데이터 갱신');
        }
        
        // 모달 열기 전에 데이터 먼저 로드
        await window.StudentsAdmin.loadStudents();
        
        // 모달 열기
        window.StudentsAdmin.openModal();
        
        // 로드 상태 업데이트
        const statusDiv = document.getElementById('studentsModuleStatus');
        if (statusDiv) {
            statusDiv.innerHTML = '<span class="text-green-500">✅ 실행 중</span>';
        }
        
        console.log('[loadStudentsModule] 모듈 실행 완료');
        
    } catch (error) {
        console.error('[loadStudentsModule] 학생 관리 모듈 실행 실패:', error);
        
        const statusDiv = document.getElementById('studentsModuleStatus');
        if (statusDiv) {
            statusDiv.innerHTML = '<span class="text-red-500">❌ 실행 실패</span>';
        }
        
        alert('학생 관리 모듈 실행 중 오류가 발생했습니다: ' + error.message);
    }
};

console.log('[admin-students.js] 학생 관리 모듈 로드 완료');