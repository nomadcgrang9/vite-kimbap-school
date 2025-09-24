// Admin Lucky Draw Module for Managing Drawing Messages
// 관리자 뽑기 메시지 관리 모듈

// ============ GLOBAL VARIABLES ============
let luckyDrawMessages = []; // 현재 로드된 뽑기 메시지 목록

// ============ MODULE INITIALIZATION ============
async function initializeLuckyDrawModule() {
    console.log('[LuckyDraw] 모듈 초기화 시작');
    
    try {
        // 뽑기 메시지 목록 로드
        await loadLuckyDrawMessages();
        
        console.log('[LuckyDraw] 모듈 초기화 완료');
        return true;
    } catch (error) {
        console.error('[LuckyDraw] 모듈 초기화 실패:', error);
        return false;
    }
}

// ============ MESSAGE LIST MANAGEMENT ============
async function loadLuckyDrawMessages() {
    console.log('[LuckyDraw] 뽑기 메시지 목록 로드 시작');
    try {
        const response = await fetch('tables/lucky_draw_messages?limit=1000');
        console.log(`[LuckyDraw] API 응답 상태: ${response.status}`);
        
        if (response.ok) {
            const result = await response.json();
            luckyDrawMessages = result.data || [];
            console.log(`[LuckyDraw] 뽑기 메시지 로드 완료: ${luckyDrawMessages.length}개`);
            
            // UI 업데이트
            renderLuckyDrawMessages();
        } else {
            throw new Error(`API 오류: ${response.status}`);
        }
    } catch (error) {
        console.error('[LuckyDraw] 메시지 로드 실패:', error);
        showError('뽑기 메시지 로드에 실패했습니다.');
    }
}

// ============ UI RENDERING ============
function renderLuckyDrawMessages() {
    const container = document.getElementById('luckyDrawMessagesContainer');
    if (!container) return;

    if (luckyDrawMessages.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-inbox text-4xl mb-4"></i>
                <p>등록된 뽑기 메시지가 없습니다.</p>
            </div>
        `;
        return;
    }

    const messagesHtml = luckyDrawMessages.map((message, index) => `
        <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between">
                <div class="flex-1">
                    <div class="flex items-center space-x-2">
                        <span class="text-sm text-gray-500">#${index + 1}</span>
                        <span class="font-medium text-gray-800">${escapeHtml(message.message_text)}</span>
                        ${message.is_active ? 
                            '<span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">활성</span>' :
                            '<span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">비활성</span>'
                        }
                    </div>
                    <div class="text-xs text-gray-400 mt-1">
                        생성: ${formatDate(message.created_at)}
                    </div>
                </div>
                <div class="flex space-x-2">
                    <button onclick="editLuckyDrawMessage('${message.id}')" 
                            class="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition">
                        <i class="fas fa-edit mr-1"></i>편집
                    </button>
                    <button onclick="toggleMessageStatus('${message.id}', ${!message.is_active})" 
                            class="px-3 py-1 ${message.is_active ? 'bg-gray-500' : 'bg-green-500'} text-white text-sm rounded hover:opacity-80 transition">
                        <i class="fas fa-${message.is_active ? 'eye-slash' : 'eye'} mr-1"></i>${message.is_active ? '비활성' : '활성'}
                    </button>
                    <button onclick="deleteLuckyDrawMessage('${message.id}')" 
                            class="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition">
                        <i class="fas fa-trash mr-1"></i>삭제
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = messagesHtml;
}

// ============ MESSAGE CRUD OPERATIONS ============
async function addLuckyDrawMessage() {
    const messageText = document.getElementById('newMessageText').value.trim();
    
    if (!messageText) {
        showError('메시지를 입력해주세요.');
        return;
    }

    try {
        const response = await fetch('tables/lucky_draw_messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message_text: messageText,
                is_active: true
            })
        });

        if (response.ok) {
            document.getElementById('newMessageText').value = '';
            await loadLuckyDrawMessages();
            showSuccess('뽑기 메시지가 추가되었습니다.');
        } else {
            throw new Error(`추가 실패: ${response.status}`);
        }
    } catch (error) {
        console.error('[LuckyDraw] 메시지 추가 실패:', error);
        showError('메시지 추가에 실패했습니다.');
    }
}

async function editLuckyDrawMessage(messageId) {
    const message = luckyDrawMessages.find(m => m.id === messageId);
    if (!message) return;

    const newText = prompt('메시지를 수정하세요:', message.message_text);
    if (!newText || newText.trim() === '') return;

    try {
        const response = await fetch(`tables/lucky_draw_messages/${messageId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...message,
                message_text: newText.trim(),
                updated_at: new Date().toISOString()
            })
        });

        if (response.ok) {
            await loadLuckyDrawMessages();
            showSuccess('메시지가 수정되었습니다.');
        } else {
            throw new Error(`수정 실패: ${response.status}`);
        }
    } catch (error) {
        console.error('[LuckyDraw] 메시지 수정 실패:', error);
        showError('메시지 수정에 실패했습니다.');
    }
}

async function toggleMessageStatus(messageId, newStatus) {
    const message = luckyDrawMessages.find(m => m.id === messageId);
    if (!message) return;

    try {
        const response = await fetch(`tables/lucky_draw_messages/${messageId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...message,
                is_active: newStatus,
                updated_at: new Date().toISOString()
            })
        });

        if (response.ok) {
            await loadLuckyDrawMessages();
            showSuccess(`메시지가 ${newStatus ? '활성화' : '비활성화'}되었습니다.`);
        } else {
            throw new Error(`상태 변경 실패: ${response.status}`);
        }
    } catch (error) {
        console.error('[LuckyDraw] 메시지 상태 변경 실패:', error);
        showError('메시지 상태 변경에 실패했습니다.');
    }
}

async function deleteLuckyDrawMessage(messageId) {
    const message = luckyDrawMessages.find(m => m.id === messageId);
    if (!message) return;

    if (!confirm(`"${message.message_text}" 메시지를 정말 삭제하시겠습니까?`)) {
        return;
    }

    try {
        const response = await fetch(`tables/lucky_draw_messages/${messageId}`, {
            method: 'DELETE'
        });

        if (response.ok || response.status === 204) {
            await loadLuckyDrawMessages();
            showSuccess('메시지가 삭제되었습니다.');
        } else {
            throw new Error(`삭제 실패: ${response.status}`);
        }
    } catch (error) {
        console.error('[LuckyDraw] 메시지 삭제 실패:', error);
        showError('메시지 삭제에 실패했습니다.');
    }
}

// ============ UTILITY FUNCTIONS ============
function formatDate(dateString) {
    return new Date(dateString).toLocaleString('ko-KR');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showSuccess(message) {
    const status = document.getElementById('luckyDrawModuleStatus');
    if (status) {
        status.innerHTML = `<span class="text-green-600">✅ ${message}</span>`;
        setTimeout(() => status.innerHTML = '', 3000);
    }
}

function showError(message) {
    const status = document.getElementById('luckyDrawModuleStatus');
    if (status) {
        status.innerHTML = `<span class="text-red-600">❌ ${message}</span>`;
        setTimeout(() => status.innerHTML = '', 5000);
    }
}

// ============ MODULE LOADER FUNCTION ============
async function loadLuckyDrawModule() {
    const status = document.getElementById('luckyDrawModuleStatus');
    if (!status) return;

    status.innerHTML = '<span class="text-blue-600">🔄 뽑기 관리 모듈 로딩 중...</span>';

    // 모달 HTML 생성
    const modalHtml = `
        <div id="luckyDrawModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="closeLuckyDrawModal()">
            <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto m-4" onclick="event.stopPropagation()">
                <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
                    <div class="flex items-center justify-between">
                        <h2 class="text-xl font-bold text-gray-800">
                            <i class="fas fa-gift text-purple-500 mr-2"></i>
                            오늘의 뽑기 관리
                        </h2>
                        <button onclick="closeLuckyDrawModal()" class="text-gray-500 hover:text-gray-700">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                </div>

                <div class="p-6 space-y-6">
                    <!-- 새 메시지 추가 -->
                    <div class="bg-gray-50 rounded-lg p-4">
                        <h3 class="font-bold text-gray-800 mb-3">
                            <i class="fas fa-plus-circle text-green-500 mr-2"></i>
                            새 뽑기 메시지 추가
                        </h3>
                        <div class="flex space-x-2">
                            <input type="text" id="newMessageText" placeholder="뽑기 메시지를 입력하세요... (예: 김밥추가 선생님께 직접 말씀드리기)" 
                                   class="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500">
                            <button onclick="addLuckyDrawMessage()" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition">
                                <i class="fas fa-plus mr-1"></i>추가
                            </button>
                        </div>
                    </div>

                    <!-- 메시지 목록 -->
                    <div>
                        <h3 class="font-bold text-gray-800 mb-3">
                            <i class="fas fa-list text-blue-500 mr-2"></i>
                            등록된 뽑기 메시지
                        </h3>
                        <div id="luckyDrawMessagesContainer" class="space-y-3">
                            <div class="text-center py-8 text-gray-500">
                                <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                                <p>로딩 중...</p>
                            </div>
                        </div>
                    </div>

                    <!-- 통계 정보 -->
                    <div class="bg-blue-50 rounded-lg p-4">
                        <h3 class="font-bold text-gray-800 mb-2">
                            <i class="fas fa-chart-bar text-blue-500 mr-2"></i>
                            뽑기 통계
                        </h3>
                        <p class="text-sm text-gray-600">
                            총 <span id="totalMessagesCount">0</span>개의 메시지가 등록되어 있습니다.
                            (활성: <span id="activeMessagesCount">0</span>개)
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `;

    // 모달 추가
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // 모듈 초기화
    try {
        const success = await initializeLuckyDrawModule();
        if (success) {
            status.innerHTML = '<span class="text-green-600">✅ 뽑기 관리 모듈 로딩 완료</span>';
            
            // 통계 업데이트
            updateStatistics();
        } else {
            status.innerHTML = '<span class="text-red-600">❌ 뽑기 관리 모듈 로딩 실패</span>';
        }
    } catch (error) {
        console.error('[LuckyDraw] 모듈 로딩 실패:', error);
        status.innerHTML = '<span class="text-red-600">❌ 뽑기 관리 모듈 로딩 실패</span>';
    }
}

function updateStatistics() {
    const totalCount = luckyDrawMessages.length;
    const activeCount = luckyDrawMessages.filter(m => m.is_active).length;
    
    const totalElement = document.getElementById('totalMessagesCount');
    const activeElement = document.getElementById('activeMessagesCount');
    
    if (totalElement) totalElement.textContent = totalCount;
    if (activeElement) activeElement.textContent = activeCount;
}

function closeLuckyDrawModal() {
    const modal = document.getElementById('luckyDrawModal');
    if (modal) {
        modal.remove();
    }
}

// Enter 키 지원
document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && event.target.id === 'newMessageText') {
        addLuckyDrawMessage();
    }
});