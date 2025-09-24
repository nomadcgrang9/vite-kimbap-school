// 관리자 학습안내 관리 모듈
// 학생페이지 학습안내와 완전 연동

let currentLearningGuides = null;
let guidesModuleLoaded = false;

// 모듈 로드 함수
async function loadGuidesModule() {
    console.log('학습안내 관리 모듈 로드 중...');
    updateGuidesModuleStatus('loading', '모듈을 로드하는 중입니다...');
    
    try {
        // 학습안내 데이터베이스 스키마 초기화 (학생페이지와 동일)
        await initializeLearningGuidesSchema();
        
        // 기존 데이터 로드
        await loadLearningGuidesData();
        
        // UI 생성
        createGuidesInterface();
        
        // 로드된 데이터로 UI 채우기
        populateUIWithData();
        
        guidesModuleLoaded = true;
        updateGuidesModuleStatus('loaded', '학습안내 관리가 성공적으로 로드되었습니다.');
        
    } catch (error) {
        console.error('학습안내 관리 모듈 로드 실패:', error);
        updateGuidesModuleStatus('error', '모듈 로드 중 오류가 발생했습니다.');
    }
}

// 학습안내 데이터베이스 스키마 초기화 (학생페이지와 동일)
async function initializeLearningGuidesSchema() {
    try {
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
        console.log('학습안내 스키마 초기화 완료');
    } catch (error) {
        console.error('학습안내 스키마 초기화 실패:', error);
        throw error;
    }
}

// 기존 학습안내 데이터 로드
async function loadLearningGuidesData() {
    try {
        const response = await smartFetch('tables/learning_guides?limit=1');
        
        if (response.ok) {
            const result = await response.json();
            if (result.data && result.data.length > 0) {
                currentLearningGuides = result.data[0];
            } else {
                // 데이터가 없으면 기본 구조 생성
                currentLearningGuides = {
                    id: 'main_guide',
                    front_content: '아직 학습안내가 없습니다.',
                    grade_1: '',
                    grade_2: '',
                    grade_3: '',
                    grade_4: '',
                    grade_5: '',
                    grade_6: '',
                    updated_at: new Date().toISOString()
                };
            }
        } else {
            throw new Error('학습안내 데이터 로드 실패');
        }
        
        console.log('학습안내 데이터 로드 완료:', currentLearningGuides);
    } catch (error) {
        console.error('학습안내 데이터 로드 오류:', error);
        
        // 폴백: 빈 구조 생성
        currentLearningGuides = {
            id: 'main_guide',
            front_content: '아직 학습안내가 없습니다.',
            grade_1: '',
            grade_2: '',
            grade_3: '',
            grade_4: '',
            grade_5: '',
            grade_6: '',
            updated_at: new Date().toISOString()
        };
    }
}

// 학습안내 관리 UI 생성
function createGuidesInterface() {
    const modalHTML = `
        <div id="guidesModal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50">
            <div class="flex items-center justify-center min-h-screen p-4">
                <div class="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
                    
                    <!-- Header -->
                    <div class="bg-indigo-600 text-white px-6 py-4 flex justify-between items-center">
                        <h2 class="text-xl font-bold">
                            <i class="fas fa-book mr-2"></i>학습안내 관리
                        </h2>
                        <button onclick="closeGuidesModal()" class="text-white hover:text-gray-200">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    
                    <!-- Content -->
                    <div class="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
                        
                        <!-- 탭 메뉴 -->
                        <div class="mb-6">
                            <div class="flex border-b border-gray-200">
                                <button onclick="switchToFrontTab()" 
                                        id="frontTab"
                                        class="px-4 py-2 font-medium text-sm border-b-2 transition-colors border-indigo-500 text-indigo-600">
                                    📢 카드앞면
                                </button>
                                ${[1,2,3,4,5,6].map(grade => `
                                    <button onclick="switchGradeTab(${grade})" 
                                            id="gradeTab${grade}"
                                            class="px-4 py-2 font-medium text-sm border-b-2 transition-colors border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300">
                                        ${grade}학년
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                        
                        <!-- 편집 영역 -->
                        <div class="max-w-4xl mx-auto">
                            
                            <!-- 편집기 -->
                            <div class="space-y-4">
                                <div class="flex justify-between items-center">
                                    <h3 class="text-lg font-semibold text-gray-800">
                                        <span id="currentTabTitle">📢 카드앞면</span> 편집
                                    </h3>
                                    <div class="flex space-x-2">
                                        <button onclick="clearCurrentContent()" 
                                                class="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600">
                                            <i class="fas fa-eraser mr-1"></i>지우기
                                        </button>
                                        <button onclick="saveCurrentContent()" 
                                                class="bg-indigo-500 text-white px-3 py-1 rounded text-sm hover:bg-indigo-600">
                                            <i class="fas fa-save mr-1"></i>저장
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-gray-700">
                                        학습안내 내용
                                        <span class="text-xs text-gray-500 ml-2">
                                            (URL은 자동으로 링크로 변환됩니다)
                                        </span>
                                    </label>
                                    <textarea id="gradeContentEditor" 
                                              class="w-full h-80 border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                              placeholder="내용을 입력하세요..."></textarea>
                                </div>
                                
                                <div class="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                                    <strong>💡 사용법:</strong><br>
                                    • URL을 입력하면 학생화면에서 자동으로 클릭 가능한 링크로 표시됩니다<br>
                                    • 빈 줄로 문단을 구분할 수 있습니다<br>
                                    • 저장 후 학생들이 즉시 확인할 수 있습니다
                                </div>
                            </div>
                        </div>
                        
                    </div>
                    
                    <!-- Footer -->
                    <div class="bg-gray-50 px-6 py-4 flex justify-between items-center">
                        <div class="text-sm text-gray-600">
                            <i class="fas fa-info-circle mr-1"></i>
                            마지막 수정: <span id="lastUpdated">-</span>
                        </div>
                        <div class="flex space-x-3">
                            <button onclick="saveAllGrades()" 
                                    class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition">
                                <i class="fas fa-save mr-2"></i>전체 저장
                            </button>
                            <button onclick="closeGuidesModal()" 
                                    class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition">
                                <i class="fas fa-times mr-2"></i>닫기
                            </button>
                        </div>
                    </div>
                    
                </div>
            </div>
        </div>
    `;
    
    // 기존 모달이 있다면 제거
    const existingModal = document.getElementById('guidesModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // 새 모달 추가
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // 모달 표시 및 초기 설정
    document.getElementById('guidesModal').classList.remove('hidden');
    
    // 앞면 탭 활성화
    switchToFrontTab();
    
    // 마지막 수정 시간 표시
    updateLastModifiedTime();
}

// 앞면 탭으로 전환
function switchToFrontTab() {
    // 현재 편집 중인 내용 저장
    saveCurrentEditingContent();
    
    // 모든 탭 비활성화
    deactivateAllTabs();
    
    // 앞면 탭 활성화
    const frontTab = document.getElementById('frontTab');
    frontTab.className = 'px-4 py-2 font-medium text-sm border-b-2 border-indigo-500 text-indigo-600';
    
    // 제목 및 내용 업데이트
    document.getElementById('currentTabTitle').textContent = '📢 카드앞면';
    
    const frontContent = currentLearningGuides ? currentLearningGuides.front_content || '' : '';
    document.getElementById('gradeContentEditor').value = frontContent;
    document.getElementById('gradeContentEditor').placeholder = '카드 앞면에 표시될 공통 내용을 입력하세요.\n\n예시:\n📢 오늘의 공지\n수학 시험이 다음주 화요일에 있습니다.\n\n참고 링크:\nhttps://example.com/notice';
}

// 학년 탭 전환
function switchGradeTab(grade) {
    // 현재 편집 중인 내용 저장
    saveCurrentEditingContent();
    
    // 모든 탭 비활성화
    deactivateAllTabs();
    
    // 현재 학년 탭 활성화
    const gradeTab = document.getElementById(`gradeTab${grade}`);
    gradeTab.className = 'px-4 py-2 font-medium text-sm border-b-2 border-indigo-500 text-indigo-600';
    
    // 제목 및 내용 업데이트
    document.getElementById('currentTabTitle').textContent = `${grade}학년 뒷면`;
    
    const gradeContent = currentLearningGuides ? currentLearningGuides[`grade_${grade}`] || '' : '';
    document.getElementById('gradeContentEditor').value = gradeContent;
    document.getElementById('gradeContentEditor').placeholder = `${grade}학년 학습안내 내용을 입력하세요.\n\n예시:\n오늘의 학습 주제: 분수의 덧셈과 뺄셈\n\n참고자료:\nhttps://example.com/math-resources\nhttps://youtube.com/watch?v=example\n\n숙제:\n교과서 45-47페이지 문제 풀기`;
}

// 모든 탭 비활성화
function deactivateAllTabs() {
    // 앞면 탭 비활성화
    const frontTab = document.getElementById('frontTab');
    frontTab.className = 'px-4 py-2 font-medium text-sm border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';
    
    // 학년 탭들 비활성화
    for (let i = 1; i <= 6; i++) {
        const tab = document.getElementById(`gradeTab${i}`);
        tab.className = 'px-4 py-2 font-medium text-sm border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';
    }
}

// 현재 편집 중인 내용을 데이터에 저장 (탭 전환 시)
function saveCurrentEditingContent() {
    const currentContent = document.getElementById('gradeContentEditor').value;
    
    if (currentLearningGuides) {
        // 현재 활성 탭 확인
        const frontTab = document.getElementById('frontTab');
        if (frontTab.className.includes('border-indigo-500')) {
            // 앞면 탭이 활성화된 상태
            currentLearningGuides.front_content = currentContent;
        } else {
            // 학년 탭이 활성화된 상태
            const activeGrade = getCurrentGrade();
            if (activeGrade) {
                currentLearningGuides[`grade_${activeGrade}`] = currentContent;
            }
        }
    }
}

// 현재 활성 학년 가져오기 (학년 탭이 활성화된 경우에만)
function getCurrentGrade() {
    for (let i = 1; i <= 6; i++) {
        const tab = document.getElementById(`gradeTab${i}`);
        if (tab.className.includes('border-indigo-500')) {
            return i;
        }
    }
    return null;
}

// 현재 활성 탭 타입 확인 (개선된 버전)
function getCurrentTabType() {
    console.log('[getCurrentTabType] 탭 타입 확인 시작');
    
    // 앞면 탭 확인 - 여러 방법으로 검증
    const frontTab = document.getElementById('frontTab');
    if (frontTab) {
        const hasActiveClass = frontTab.className.includes('border-indigo-500') || frontTab.className.includes('text-indigo-600');
        console.log('[getCurrentTabType] 앞면 탭 상태:', {
            className: frontTab.className,
            hasActiveClass: hasActiveClass
        });
        
        if (hasActiveClass) {
            console.log('[getCurrentTabType] 결과: front');
            return 'front';
        }
    }
    
    // 학년 탭 확인
    const activeGrade = getCurrentGrade();
    if (activeGrade) {
        console.log('[getCurrentTabType] 결과: grade (', activeGrade, '학년)');
        return 'grade';
    }
    
    // 기본값은 앞면
    console.log('[getCurrentTabType] 결과: front (기본값)');
    return 'front';
}

// 현재 내용 저장 (앞면 또는 학년별) - 개선된 버전
async function saveCurrentContent() {
    console.log('[Save] 저장 시작');
    
    const tabType = getCurrentTabType();
    const content = document.getElementById('gradeContentEditor').value;
    
    console.log('[Save] 상세 정보:', {
        tabType: tabType,
        contentLength: content ? content.length : 0,
        contentPreview: content ? content.substring(0, 50) + '...' : 'empty',
        currentLearningGuides: currentLearningGuides
    });
    
    try {
        // 기본 데이터 구조 생성
        if (!currentLearningGuides) {
            console.log('[Save] currentLearningGuides가 없어서 새로 생성');
            currentLearningGuides = {
                id: 'main_guide',
                front_content: '아직 학습안내가 없습니다.',
                grade_1: '', grade_2: '', grade_3: '', grade_4: '', grade_5: '', grade_6: '',
                updated_at: new Date().toISOString()
            };
        }
        
        if (tabType === 'front') {
            console.log('[Save] 앞면 내용 저장 시작');
            console.log('[Save] 기존 front_content:', currentLearningGuides.front_content);
            console.log('[Save] 새로운 front_content:', content);
            
            // 앞면 내용 저장
            currentLearningGuides.front_content = content;
            currentLearningGuides.updated_at = new Date().toISOString();
            
            console.log('[Save] DB 저장 시작...');
            await saveLearningGuidesToDB();
            console.log('[Save] 앞면 저장 완료!');
            alert('✅ 카드 앞면 내용이 저장되었습니다.');
            
        } else if (tabType === 'grade') {
            const grade = getCurrentGrade();
            console.log('[Save] 학년별 내용 저장 시작 -', grade, '학년');
            
            if (grade) {
                const fieldName = `grade_${grade}`;
                console.log('[Save] 기존', fieldName, ':', currentLearningGuides[fieldName]);
                console.log('[Save] 새로운', fieldName, ':', content);
                
                currentLearningGuides[fieldName] = content;
                currentLearningGuides.updated_at = new Date().toISOString();
                
                console.log('[Save] DB 저장 시작...');
                await saveLearningGuidesToDB();
                console.log('[Save]', grade, '학년 저장 완료!');
                alert(`✅ ${grade}학년 학습안내가 저장되었습니다.`);
            } else {
                console.error('[Save] 학년 정보를 찾을 수 없습니다!');
                alert('학년 정보를 찾을 수 없습니다. 다시 시도해주세요.');
            }
        } else {
            console.error('[Save] 알 수 없는 탭 타입:', tabType);
            alert('저장할 탭을 찾을 수 없습니다. 다시 시도해주세요.');
        }
        
        updateLastModifiedTime();
        
    } catch (error) {
        console.error('[Save] 저장 오류:', error);
        alert('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
}

// 전체 저장 (앞면 + 모든 학년)
async function saveAllGrades() {
    if (!confirm('앞면 내용과 모든 학년의 학습안내를 저장하시겠습니까?')) {
        return;
    }
    
    try {
        // 현재 편집 중인 내용도 포함
        saveCurrentEditingContent();
        
        if (currentLearningGuides) {
            currentLearningGuides.updated_at = new Date().toISOString();
        }
        
        // 데이터베이스 저장
        await saveLearningGuidesToDB();
        
        alert('✅ 앞면 내용과 모든 학년의 학습안내가 저장되었습니다.');
        updateLastModifiedTime();
        
    } catch (error) {
        console.error('전체 저장 오류:', error);
        alert('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
}

// 데이터베이스에 저장
async function saveLearningGuidesToDB() {
    try {
        console.log('[Guides] 저장 시작:', currentLearningGuides);
        
        // 먼저 로컬스토리지에 백업
        const backupData = {
            front_content: currentLearningGuides.front_content || '아직 학습안내가 없습니다.',
            grade_1: currentLearningGuides.grade_1 || '',
            grade_2: currentLearningGuides.grade_2 || '',
            grade_3: currentLearningGuides.grade_3 || '',
            grade_4: currentLearningGuides.grade_4 || '',
            grade_5: currentLearningGuides.grade_5 || '',
            grade_6: currentLearningGuides.grade_6 || ''
        };
        localStorage.setItem('learningGuides', JSON.stringify(backupData));
        console.log('[Guides] 로컬스토리지 백업 완료');
        
        // RESTful API로 저장 시도
        try {
            // 기존 데이터 확인
            const checkResponse = await smartFetch('tables/learning_guides?limit=1');
            
            let response;
            if (checkResponse.ok) {
                const checkResult = await checkResponse.json();
                
                if (checkResult.data && checkResult.data.length > 0) {
                    // 업데이트
                    const existingId = checkResult.data[0].id;
                    console.log('[Guides] 기존 데이터 업데이트:', existingId);
                    
                    response = await smartFetch(`tables/learning_guides/${existingId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(currentLearningGuides)
                    });
                } else {
                    // 새로 생성
                    console.log('[Guides] 새 데이터 생성');
                    
                    response = await smartFetch('tables/learning_guides', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(currentLearningGuides)
                    });
                }
                
                if (response && response.ok) {
                    console.log('[Guides] RESTful API 저장 성공');
                } else {
                    console.warn('[Guides] RESTful API 저장 실패, 로컬스토리지만 사용');
                }
            } else {
                console.warn('[Guides] 테이블 접근 실패, 로컬스토리지만 사용');
            }
        } catch (apiError) {
            console.warn('[Guides] API 저장 오류, 로컬스토리지만 사용:', apiError);
        }
        
        console.log('[Guides] 저장 완료');
        
    } catch (error) {
        console.error('[Guides] 저장 중 오류:', error);
        throw error;
    }
}

// 현재 내용 지우기 (앞면 또는 학년별)
function clearCurrentContent() {
    const tabType = getCurrentTabType();
    
    let confirmMessage = '';
    if (tabType === 'front') {
        confirmMessage = '카드 앞면 내용을 모두 지우시겠습니까?';
    } else {
        const grade = getCurrentGrade();
        confirmMessage = `${grade}학년 학습안내 내용을 모두 지우시겠습니까?`;
    }
    
    if (confirm(confirmMessage)) {
        document.getElementById('gradeContentEditor').value = '';
    }
}

// 미리보기 관련 함수들 제거됨 - 요청에 따라 미리보기 기능 불필요

// 마지막 수정 시간 업데이트
function updateLastModifiedTime() {
    const lastUpdatedElement = document.getElementById('lastUpdated');
    if (lastUpdatedElement && currentLearningGuides && currentLearningGuides.updated_at) {
        const date = new Date(currentLearningGuides.updated_at);
        lastUpdatedElement.textContent = date.toLocaleDateString('ko-KR') + ' ' + date.toLocaleTimeString('ko-KR');
    }
}

// 모달 닫기
function closeGuidesModal() {
    const modal = document.getElementById('guidesModal');
    if (modal) {
        modal.classList.add('hidden');
        setTimeout(() => modal.remove(), 300);
    }
}

// 로드된 데이터로 UI 채우기
function populateUIWithData() {
    console.log('[Guides] UI 데이터 채우기 시작:', currentLearningGuides);
    
    if (!currentLearningGuides) {
        console.warn('[Guides] 채울 데이터가 없습니다.');
        return;
    }
    
    try {
        // 현재 활성화된 탭의 내용 설정
        const currentTabType = getCurrentTabType();
        
        if (currentTabType === 'front') {
            // 앞면 탭이 활성화되어 있으면 앞면 내용 설정
            const frontContent = currentLearningGuides.front_content || '';
            const editor = document.getElementById('gradeContentEditor');
            if (editor) {
                editor.value = frontContent;
                console.log('[Guides] 앞면 내용 설정 완료:', frontContent.substring(0, 50) + '...');
            }
        } else {
            // 학년 탭이 활성화되어 있으면 해당 학년 내용 설정 
            const activeGrade = getCurrentGrade();
            if (activeGrade) {
                const gradeContent = currentLearningGuides[`grade_${activeGrade}`] || '';
                const editor = document.getElementById('gradeContentEditor');
                if (editor) {
                    editor.value = gradeContent;
                    console.log(`[Guides] ${activeGrade}학년 내용 설정 완료:`, gradeContent.substring(0, 50) + '...');
                }
            }
        }
        
        // 마지막 수정 시간 업데이트
        updateLastModifiedTime();
        
        console.log('[Guides] UI 데이터 채우기 완료');
        
    } catch (error) {
        console.error('[Guides] UI 데이터 채우기 오류:', error);
    }
}

// 모듈 상태 업데이트
function updateGuidesModuleStatus(status, message) {
    const statusElement = document.getElementById('guidesModuleStatus');
    if (statusElement) {
        let className, icon;
        switch (status) {
            case 'loading':
                className = 'text-blue-600';
                icon = 'fas fa-spinner fa-spin';
                break;
            case 'loaded':
                className = 'text-green-600';
                icon = 'fas fa-check-circle';
                break;
            case 'error':
                className = 'text-red-600';
                icon = 'fas fa-exclamation-circle';
                break;
            default:
                className = 'text-gray-600';
                icon = 'fas fa-info-circle';
        }
        
        statusElement.className = `mt-2 text-xs ${className}`;
        statusElement.innerHTML = `<i class="${icon} mr-1"></i>${message}`;
    }
}

// 전역 함수로 노출
window.loadGuidesModule = loadGuidesModule;
window.switchToFrontTab = switchToFrontTab;
window.switchGradeTab = switchGradeTab;
window.saveCurrentContent = saveCurrentContent;
window.saveAllGrades = saveAllGrades;
window.clearCurrentContent = clearCurrentContent;
window.closeGuidesModal = closeGuidesModal;

// 실시간 미리보기 기능 제거됨