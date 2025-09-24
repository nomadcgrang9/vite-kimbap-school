// ================================================
// 돌림판 관리 모듈 (admin-spinner.js)
// 2025-01-20
// ================================================

console.log('[admin-spinner.js] 돌림판 관리 모듈 로드 시작');

// ================================================
// 네임스페이스 및 초기화
// ================================================
window.SpinnerAdmin = {
    data: {
        spinnerLists: [],
        currentEditingId: null
    },
    ui: {
        container: null,
        initialized: false
    },
    
    // 초기화
    init: function() {
        console.log('[SpinnerAdmin] 초기화 시작');
        
        // 컨테이너 생성
        this.createUI();
        
        // 데이터 로드
        this.loadSpinnerLists();
        
        this.ui.initialized = true;
        console.log('[SpinnerAdmin] 초기화 완료');
    },
    
    // UI 생성
    createUI: function() {
        console.log('[SpinnerAdmin] UI 생성 시작');
        
        // 모달 생성
        const modal = document.createElement('div');
        modal.id = 'spinnerModal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 hidden z-50';
        modal.innerHTML = `
            <div class="flex items-center justify-center min-h-screen p-4">
                <div class="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
                    <!-- 헤더 -->
                    <div class="bg-yellow-500 text-white px-6 py-4 flex justify-between items-center">
                        <h2 class="text-xl font-bold">
                            <i class="fas fa-wheel mr-2"></i>돌림판 관리
                        </h2>
                        <button onclick="SpinnerAdmin.closeModal()" class="text-white hover:text-gray-200">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    
                    <!-- 컨텐츠 -->
                    <div class="p-6 overflow-y-auto max-h-[80vh]">
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            
                            <!-- 왼쪽: 목록 관리 -->
                            <div class="space-y-4">
                                <div class="flex justify-between items-center">
                                    <h3 class="text-lg font-bold text-gray-700">
                                        <i class="fas fa-list mr-2"></i>목록 관리
                                    </h3>
                                    <button onclick="SpinnerAdmin.showCreateForm()" 
                                            class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition text-sm">
                                        <i class="fas fa-plus mr-2"></i>새 목록 만들기
                                    </button>
                                </div>
                                
                                <!-- 목록 목록 -->
                                <div id="spinnerListsContainer" class="space-y-3 max-h-96 overflow-y-auto">
                                    <!-- 목록들이 여기에 표시됩니다 -->
                                </div>
                            </div>
                            
                            <!-- 오른쪽: 목록 편집 -->
                            <div class="space-y-4">
                                <h3 class="text-lg font-bold text-gray-700">
                                    <i class="fas fa-edit mr-2"></i>목록 편집
                                </h3>
                                
                                <!-- 편집 폼 -->
                                <div id="editForm" class="space-y-4 hidden">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">목록 이름</label>
                                        <input type="text" id="listNameInput" placeholder="목록 이름을 입력하세요" 
                                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500">
                                    </div>
                                    
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">
                                            항목 목록 (한 줄에 하나씩)
                                        </label>
                                        <textarea id="itemsTextarea" rows="10" placeholder="항목1&#10;항목2&#10;항목3&#10;..."
                                                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 font-mono"></textarea>
                                        <p class="text-xs text-gray-500 mt-1">
                                            <i class="fas fa-info-circle mr-1"></i>
                                            현재 <span id="itemCount">0</span>개 항목
                                        </p>
                                    </div>
                                    
                                    <!-- 미리보기 -->
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">미리보기</label>
                                        <div id="itemsPreview" class="border border-gray-200 rounded-md p-3 min-h-20 bg-gray-50">
                                            <p class="text-gray-500 text-sm">항목을 입력하면 미리보기가 표시됩니다.</p>
                                        </div>
                                    </div>
                                    
                                    <!-- 버튼들 -->
                                    <div class="flex space-x-3">
                                        <button onclick="SpinnerAdmin.saveList()" 
                                                class="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition">
                                            <i class="fas fa-save mr-2"></i>저장
                                        </button>
                                        <button onclick="SpinnerAdmin.cancelEdit()" 
                                                class="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600 transition">
                                            <i class="fas fa-times mr-2"></i>취소
                                        </button>
                                    </div>
                                </div>
                                
                                <!-- 초기 안내 -->
                                <div id="initialGuide" class="text-center py-8 text-gray-500">
                                    <i class="fas fa-hand-pointer text-4xl mb-4"></i>
                                    <p class="text-lg font-medium">목록을 선택하여 편집하세요</p>
                                    <p class="text-sm">왼쪽에서 목록을 클릭하거나 새로 만들어보세요.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.ui.container = modal;
        
        // 실시간 미리보기 이벤트
        setTimeout(() => {
            const textarea = document.getElementById('itemsTextarea');
            const nameInput = document.getElementById('listNameInput');
            if (textarea) {
                textarea.addEventListener('input', () => this.updatePreview());
            }
            if (nameInput) {
                nameInput.addEventListener('input', () => this.updatePreview());
            }
        }, 100);
        
        console.log('[SpinnerAdmin] UI 생성 완료');
    },
    
    // 모달 열기
    openModal: function() {
        console.log('[SpinnerAdmin] 모달 열기');
        
        this.ui.container.classList.remove('hidden');
        this.refreshData();
    },
    
    // 모달 닫기
    closeModal: function() {
        console.log('[SpinnerAdmin] 모달 닫기');
        this.ui.container.classList.add('hidden');
        this.cancelEdit();
    },
    
    // 돌림판 목록 데이터 로드
    loadSpinnerLists: async function() {
        console.log('[SpinnerAdmin] 돌림판 목록 로드 시작');
        
        try {
            // Supabase에서 로드 시도
            if (typeof supabaseAPI !== 'undefined' && supabaseAPI.config) {
                this.data.spinnerLists = await supabaseAPI.config.get('spinner_lists') || [];
                console.log('[SpinnerAdmin] Supabase에서 로드:', this.data.spinnerLists.length + '개');
            } else {
                throw new Error('Supabase API 사용 불가');
            }
        } catch (error) {
            console.log('[SpinnerAdmin] localStorage 백업 사용:', error.message);
            // localStorage 백업 사용
            this.data.spinnerLists = JSON.parse(localStorage.getItem('spinner_lists') || '[]');
        }
        
        console.log('[SpinnerAdmin] 총 로드된 목록:', this.data.spinnerLists.length + '개');
    },
    
    // 목록 저장 (Supabase + localStorage)
    saveSpinnerLists: async function() {
        console.log('[SpinnerAdmin] 돌림판 목록 저장 시작');
        
        try {
            // Supabase에 저장 시도
            if (typeof supabaseAPI !== 'undefined' && supabaseAPI.config) {
                await supabaseAPI.config.set('spinner_lists', this.data.spinnerLists);
                console.log('[SpinnerAdmin] Supabase에 저장 완료');
            } else {
                throw new Error('Supabase API 사용 불가');
            }
        } catch (error) {
            console.log('[SpinnerAdmin] Supabase 저장 실패:', error.message);
        }
        
        // 항상 localStorage에도 백업 저장
        localStorage.setItem('spinner_lists', JSON.stringify(this.data.spinnerLists));
        console.log('[SpinnerAdmin] localStorage 백업 저장 완료');
    },
    
    // UI 업데이트
    updateListsUI: function() {
        console.log('[SpinnerAdmin] 목록 UI 업데이트');
        
        const container = document.getElementById('spinnerListsContainer');
        if (!container) return;
        
        if (this.data.spinnerLists.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-wheel text-4xl mb-4"></i>
                    <p class="text-lg font-medium">저장된 돌림판 목록이 없습니다</p>
                    <p class="text-sm">새 목록을 만들어보세요.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.data.spinnerLists.map(list => `
            <div class="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition ${this.data.currentEditingId === list.id ? 'border-yellow-500 bg-yellow-50' : ''}"
                 onclick="SpinnerAdmin.editList('${list.id}')">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h4 class="font-semibold text-gray-800 mb-1">${this.escapeHtml(list.name)}</h4>
                        <p class="text-sm text-gray-600 mb-2">
                            <i class="fas fa-list mr-1"></i>
                            ${list.items.length}개 항목
                        </p>
                        <div class="flex flex-wrap gap-1">
                            ${list.items.slice(0, 5).map(item => `
                                <span class="bg-gray-100 text-xs px-2 py-1 rounded">${this.escapeHtml(item)}</span>
                            `).join('')}
                            ${list.items.length > 5 ? `<span class="text-xs text-gray-500 px-2 py-1">+${list.items.length - 5}개...</span>` : ''}
                        </div>
                    </div>
                    <div class="flex space-x-2 ml-4">
                        <button onclick="event.stopPropagation(); SpinnerAdmin.duplicateList('${list.id}')" 
                                class="text-blue-500 hover:text-blue-700 text-sm" title="복사">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button onclick="event.stopPropagation(); SpinnerAdmin.deleteList('${list.id}')" 
                                class="text-red-500 hover:text-red-700 text-sm" title="삭제">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    },
    
    // 새 목록 만들기 폼 표시
    showCreateForm: function() {
        console.log('[SpinnerAdmin] 새 목록 만들기 폼 표시');
        
        this.data.currentEditingId = null;
        
        // 폼 초기화
        document.getElementById('listNameInput').value = '';
        document.getElementById('itemsTextarea').value = '';
        
        // 폼 표시
        document.getElementById('editForm').classList.remove('hidden');
        document.getElementById('initialGuide').classList.add('hidden');
        
        // 이름 입력에 포커스
        setTimeout(() => {
            document.getElementById('listNameInput').focus();
        }, 100);
        
        this.updatePreview();
    },
    
    // 기존 목록 편집
    editList: function(listId) {
        console.log('[SpinnerAdmin] 목록 편집:', listId);
        
        const list = this.data.spinnerLists.find(l => l.id === listId);
        if (!list) {
            alert('목록을 찾을 수 없습니다.');
            return;
        }
        
        this.data.currentEditingId = listId;
        
        // 폼에 데이터 채우기
        document.getElementById('listNameInput').value = list.name;
        document.getElementById('itemsTextarea').value = list.items.join('\n');
        
        // 폼 표시
        document.getElementById('editForm').classList.remove('hidden');
        document.getElementById('initialGuide').classList.add('hidden');
        
        // UI 업데이트 (선택 상태 표시)
        this.updateListsUI();
        this.updatePreview();
    },
    
    // 목록 저장
    saveList: async function() {
        console.log('[SpinnerAdmin] 목록 저장 시작');
        
        const nameInput = document.getElementById('listNameInput');
        const itemsTextarea = document.getElementById('itemsTextarea');
        
        const name = nameInput.value.trim();
        const itemsText = itemsTextarea.value.trim();
        
        if (!name) {
            alert('목록 이름을 입력해주세요.');
            nameInput.focus();
            return;
        }
        
        if (!itemsText) {
            alert('최소 1개 이상의 항목을 입력해주세요.');
            itemsTextarea.focus();
            return;
        }
        
        // 항목 파싱
        const items = itemsText.split('\n')
            .map(item => item.trim())
            .filter(item => item.length > 0);
        
        if (items.length === 0) {
            alert('유효한 항목이 없습니다.');
            itemsTextarea.focus();
            return;
        }
        
        // 로딩 표시
        const saveButton = event.target;
        const originalText = saveButton.innerHTML;
        saveButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>저장 중...';
        saveButton.disabled = true;
        
        try {
            if (this.data.currentEditingId) {
                // 기존 목록 수정
                const listIndex = this.data.spinnerLists.findIndex(l => l.id === this.data.currentEditingId);
                if (listIndex !== -1) {
                    this.data.spinnerLists[listIndex] = {
                        ...this.data.spinnerLists[listIndex],
                        name: name,
                        items: items,
                        updated_at: new Date().toISOString()
                    };
                    console.log('[SpinnerAdmin] 목록 수정 완료:', name);
                }
            } else {
                // 새 목록 생성
                const newList = {
                    id: 'spinner_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    name: name,
                    items: items,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                this.data.spinnerLists.push(newList);
                console.log('[SpinnerAdmin] 새 목록 생성 완료:', name);
            }
            
            // 저장
            await this.saveSpinnerLists();
            
            // UI 업데이트
            this.updateListsUI();
            this.cancelEdit();
            
            alert(`목록 "${name}"이(가) 저장되었습니다!\n항목 수: ${items.length}개`);
            
        } catch (error) {
            console.error('[SpinnerAdmin] 목록 저장 실패:', error);
            alert('저장 중 오류가 발생했습니다: ' + error.message);
        } finally {
            // 버튼 복원
            saveButton.innerHTML = originalText;
            saveButton.disabled = false;
        }
    },
    
    // 편집 취소
    cancelEdit: function() {
        console.log('[SpinnerAdmin] 편집 취소');
        
        this.data.currentEditingId = null;
        
        // 폼 숨기기
        document.getElementById('editForm').classList.add('hidden');
        document.getElementById('initialGuide').classList.remove('hidden');
        
        // UI 업데이트
        this.updateListsUI();
    },
    
    // 목록 복사
    duplicateList: async function(listId) {
        console.log('[SpinnerAdmin] 목록 복사:', listId);
        
        const list = this.data.spinnerLists.find(l => l.id === listId);
        if (!list) {
            alert('목록을 찾을 수 없습니다.');
            return;
        }
        
        const newName = prompt('복사할 목록의 이름을 입력하세요:', list.name + ' (복사본)');
        if (!newName || !newName.trim()) return;
        
        try {
            const newList = {
                id: 'spinner_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                name: newName.trim(),
                items: [...list.items],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            this.data.spinnerLists.push(newList);
            await this.saveSpinnerLists();
            
            this.updateListsUI();
            
            alert(`목록 "${newName}"이(가) 복사되었습니다!`);
            
        } catch (error) {
            console.error('[SpinnerAdmin] 목록 복사 실패:', error);
            alert('복사 중 오류가 발생했습니다: ' + error.message);
        }
    },
    
    // 목록 삭제
    deleteList: async function(listId) {
        console.log('[SpinnerAdmin] 목록 삭제:', listId);
        
        const list = this.data.spinnerLists.find(l => l.id === listId);
        if (!list) {
            alert('목록을 찾을 수 없습니다.');
            return;
        }
        
        if (!confirm(`"${list.name}" 목록을 정말 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
            return;
        }
        
        try {
            this.data.spinnerLists = this.data.spinnerLists.filter(l => l.id !== listId);
            await this.saveSpinnerLists();
            
            // 현재 편집 중인 목록이었다면 편집 취소
            if (this.data.currentEditingId === listId) {
                this.cancelEdit();
            }
            
            this.updateListsUI();
            
            alert(`목록 "${list.name}"이(가) 삭제되었습니다.`);
            
        } catch (error) {
            console.error('[SpinnerAdmin] 목록 삭제 실패:', error);
            alert('삭제 중 오류가 발생했습니다: ' + error.message);
        }
    },
    
    // 실시간 미리보기 업데이트
    updatePreview: function() {
        const nameInput = document.getElementById('listNameInput');
        const itemsTextarea = document.getElementById('itemsTextarea');
        const itemCount = document.getElementById('itemCount');
        const preview = document.getElementById('itemsPreview');
        
        if (!nameInput || !itemsTextarea || !itemCount || !preview) return;
        
        const name = nameInput.value.trim();
        const itemsText = itemsTextarea.value.trim();
        
        let items = [];
        if (itemsText) {
            items = itemsText.split('\n')
                .map(item => item.trim())
                .filter(item => item.length > 0);
        }
        
        // 항목 수 업데이트
        itemCount.textContent = items.length;
        
        // 미리보기 업데이트
        if (items.length === 0) {
            preview.innerHTML = '<p class="text-gray-500 text-sm">항목을 입력하면 미리보기가 표시됩니다.</p>';
        } else {
            preview.innerHTML = `
                <div class="space-y-2">
                    <p class="font-medium text-gray-700">${this.escapeHtml(name || '(이름 없음)')}</p>
                    <div class="flex flex-wrap gap-2">
                        ${items.map((item, index) => `
                            <span class="bg-yellow-100 text-yellow-800 text-sm px-2 py-1 rounded border">
                                ${index + 1}. ${this.escapeHtml(item)}
                            </span>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    },
    
    // 데이터 새로고침
    refreshData: async function() {
        console.log('[SpinnerAdmin] 데이터 새로고침');
        
        await this.loadSpinnerLists();
        this.updateListsUI();
    },
    
    // HTML 이스케이프 유틸리티
    escapeHtml: function(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }
};

// ================================================
// 전역 함수 (admin-v2.html에서 호출)
// ================================================
window.loadSpinnerModule = function() {
    console.log('[loadSpinnerModule] 돌림판 관리 모듈 로드 및 실행');
    
    try {
        // 초기화 및 모달 열기
        if (!window.SpinnerAdmin.ui.initialized) {
            console.log('[loadSpinnerModule] 초기화 시작');
            window.SpinnerAdmin.init();
        } else {
            console.log('[loadSpinnerModule] 이미 초기화됨 - 데이터 갱신');
        }
        
        // 모달 열기 전에 데이터 먼저 로드
        window.SpinnerAdmin.loadSpinnerLists().then(() => {
            window.SpinnerAdmin.openModal();
        });
        
        // 로드 상태 업데이트
        const statusDiv = document.getElementById('spinnerModuleStatus');
        if (statusDiv) {
            statusDiv.innerHTML = '<span class="text-green-500">✅ 실행 중</span>';
        }
        
        console.log('[loadSpinnerModule] 모듈 실행 완료');
        
    } catch (error) {
        console.error('[loadSpinnerModule] 돌림판 관리 모듈 실행 실패:', error);
        
        const statusDiv = document.getElementById('spinnerModuleStatus');
        if (statusDiv) {
            statusDiv.innerHTML = '<span class="text-red-500">❌ 실행 실패</span>';
        }
        
        alert('돌림판 관리 모듈 실행 중 오류가 발생했습니다: ' + error.message);
    }
};

console.log('[admin-spinner.js] 돌림판 관리 모듈 로드 완료');