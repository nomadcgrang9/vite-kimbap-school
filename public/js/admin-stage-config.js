/**
 * 관리자 페이지 - 오늘의 할일 스테이지 설정 모듈
 * stage_config 테이블 기반으로 스테이지별 제목, 설명, 아이콘 관리
 */

class StageConfigManager {
    constructor() {
        this.currentConfig = {
            stage1: "1단계: 김밥말기: 김밥을 말아보세요 (+1포인트)",
            stage2: "2단계: 김밥썰기: 김밥을 예쁘게 썰어보세요 (+1포인트)", 
            stage3: "3단계: 김밥추가: 더 많은 김밥을 만들어보세요 (+1포인트)"
        };
        this.stageIcons = {
            1: "🍙",
            2: "✨", 
            3: "➕"
        };
        this.isLoading = false;
    }

    /**
     * 모듈 초기화
     */
    async initialize() {
        console.log('[StageConfig] 스테이지 설정 모듈 초기화 시작');
        
        try {
            await this.loadCurrentConfig();
            this.renderUI();
            
            console.log('[StageConfig] 스테이지 설정 모듈 초기화 완료');
            return true;
        } catch (error) {
            console.error('[StageConfig] 초기화 실패:', error);
            return false;
        }
    }

    /**
     * 현재 설정 불러오기
     */
    async loadCurrentConfig() {
        try {
            const response = await smartFetch('tables/stage_config');
            
            if (response.ok) {
                const result = await response.json();
                if (result.data && result.data.length > 0) {
                    const config = result.data[0];
                    this.currentConfig = {
                        stage1: config.stage1 || this.currentConfig.stage1,
                        stage2: config.stage2 || this.currentConfig.stage2,
                        stage3: config.stage3 || this.currentConfig.stage3
                    };
                    
                    console.log('[StageConfig] 현재 설정 로드 완료:', this.currentConfig);
                }
            }
        } catch (error) {
            console.error('[StageConfig] 설정 로드 실패:', error);
        }
    }

    /**
     * "제목: 설명" 형식을 제목과 설명으로 분리
     */
    parseStageData(fullText) {
        const colonIndex = fullText.indexOf(': ');
        
        if (colonIndex !== -1) {
            const title = fullText.substring(0, colonIndex);
            const description = fullText.substring(colonIndex + 2);
            return { title, description };
        } else {
            return { title: fullText, description: '' };
        }
    }

    /**
     * 제목과 설명을 "제목: 설명" 형식으로 결합
     */
    combineStageData(title, description) {
        return `${title}: ${description}`;
    }

    /**
     * UI 렌더링
     */
    renderUI() {
        // 모달 컨테이너를 찾거나 생성
        let container = document.getElementById('moduleContainer');
        if (!container) {
            // 컨테이너가 없으면 새로 생성
            container = document.createElement('div');
            container.id = 'moduleContainer';
            container.style.position = 'fixed';
            container.style.top = '0';
            container.style.left = '0';
            container.style.width = '100%';
            container.style.height = '100%';
            container.style.backgroundColor = 'rgba(0,0,0,0.5)';
            container.style.zIndex = '1000';
            container.style.display = 'flex';
            container.style.alignItems = 'center';
            container.style.justifyContent = 'center';
            container.style.padding = '20px';
            document.body.appendChild(container);
            console.log('[StageConfig] moduleContainer 생성 완료');
        }

        const html = `
            <div class="bg-white rounded-lg shadow-lg">
                <div class="bg-orange-500 text-white p-4 rounded-t-lg">
                    <h2 class="text-xl font-bold flex items-center">
                        <i class="fas fa-tasks mr-2"></i>
                        오늘의 할일 - 스테이지 설정
                    </h2>
                    <p class="text-orange-100 text-sm mt-1">각 단계별 제목, 설명, 아이콘을 설정합니다</p>
                </div>
                
                <div class="p-6">
                    <div class="overflow-x-auto">
                        <table class="w-full border-collapse border border-gray-200 rounded-lg">
                            <thead>
                                <tr class="bg-gray-100">
                                    <th class="border border-gray-200 px-3 py-2 text-left font-semibold text-gray-700">단계</th>
                                    <th class="border border-gray-200 px-3 py-2 text-left font-semibold text-gray-700">제목</th>
                                    <th class="border border-gray-200 px-3 py-2 text-left font-semibold text-gray-700">설명</th>
                                    <th class="border border-gray-200 px-3 py-2 text-left font-semibold text-gray-700">아이콘</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.renderStageRow(1)}
                                ${this.renderStageRow(2)}
                                ${this.renderStageRow(3)}
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="mt-8 flex gap-4">
                        <button onclick="stageConfigManager.saveAllSettings()" 
                                class="flex-1 bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 transition-colors font-semibold">
                            <i class="fas fa-save mr-2"></i>모든 설정 저장
                        </button>
                        <button onclick="stageConfigManager.resetToDefault()" 
                                class="bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors">
                            <i class="fas fa-undo mr-2"></i>기본값 복원
                        </button>
                        <button onclick="stageConfigManager.closeUI()" 
                                class="bg-red-500 text-white py-3 px-4 rounded-lg hover:bg-red-600 transition-colors">
                            <i class="fas fa-times mr-2"></i>닫기
                        </button>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
        container.style.display = 'block';
        
        console.log('[StageConfig] UI 렌더링 완료');
    }

    /**
     * 개별 스테이지 편집기 렌더링 (테이블 행 형식)
     */
    renderStageRow(stageNum) {
        const stageKey = `stage${stageNum}`;
        const stageData = this.parseStageData(this.currentConfig[stageKey]);
        const icon = this.stageIcons[stageNum];

        return `
            <tr class="hover:bg-gray-50">
                <!-- 단계 컬럼 -->
                <td class="border border-gray-200 px-3 py-3 align-top">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-lg">
                            ${icon}
                        </div>
                        <div>
                            <div class="font-semibold text-gray-800">${stageNum}단계</div>
                            <div class="text-xs text-gray-500">설정</div>
                        </div>
                    </div>
                </td>
                
                <!-- 제목 컬럼 -->
                <td class="border border-gray-200 px-3 py-3">
                    <input type="text" 
                           id="title_${stageNum}" 
                           value="${stageData.title}" 
                           class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-transparent"
                           placeholder="예: 1단계: 김밥말기">
                    <div class="text-xs text-gray-400 mt-1">현재: ${stageData.title}</div>
                </td>
                
                <!-- 설명 컬럼 -->
                <td class="border border-gray-200 px-3 py-3">
                    <input type="text" 
                           id="description_${stageNum}" 
                           value="${stageData.description}" 
                           class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-transparent"
                           placeholder="예: 김밥을 말아보세요">
                    <div class="text-xs text-gray-400 mt-1">${stageData.description.substring(0, 30)}${stageData.description.length > 30 ? '...' : ''}</div>
                </td>
                
                <!-- 아이콘 컬럼 -->
                <td class="border border-gray-200 px-3 py-3">
                    <div class="flex items-center gap-2">
                        <select id="icon_${stageNum}" 
                                class="text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-transparent">
                            ${this.renderIconOptions(icon)}
                        </select>
                        <div class="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-lg" id="iconPreview_${stageNum}">
                            ${icon}
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * 아이콘 선택 옵션 렌더링
     */
    renderIconOptions(currentIcon) {
        const icons = [
            { value: '🍙', label: '🍙 김밥' },
            { value: '✨', label: '✨ 반짝임' },
            { value: '➕', label: '➕ 추가' },
            { value: '📝', label: '📝 메모' },
            { value: '✅', label: '✅ 체크' },
            { value: '🎯', label: '🎯 목표' },
            { value: '🔥', label: '🔥 열정' },
            { value: '⭐', label: '⭐ 별' },
            { value: '💪', label: '💪 힘' },
            { value: '🚀', label: '🚀 로켓' }
        ];

        return icons.map(icon => 
            `<option value="${icon.value}" ${icon.value === currentIcon ? 'selected' : ''}>${icon.label}</option>`
        ).join('');
    }

    /**
     * 모든 설정 저장 (일괄 저장)
     */
    async saveAllSettings() {
        if (this.isLoading) return;

        try {
            this.isLoading = true;

            // 유효성 검증
            const validationResult = this.validateAllInputs();
            if (!validationResult.isValid) {
                alert(`⚠️ ${validationResult.message}`);
                return;
            }

            // 각 스테이지 데이터 수집
            const stageData = {};
            for (let i = 1; i <= 3; i++) {
                const title = document.getElementById(`title_${i}`).value.trim();
                const description = document.getElementById(`description_${i}`).value.trim();
                
                stageData[`stage${i}`] = this.combineStageData(title, description);
            }

            // 저장 요청
            const response = await smartFetch('tables/stage_config/default', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: 'default',
                    ...stageData,
                    updated_at: new Date().toISOString()
                })
            });

            if (response.ok) {
                // 로컬 데이터 업데이트
                this.currentConfig = { ...stageData };
                
                // 아이콘 업데이트
                for (let i = 1; i <= 3; i++) {
                    const iconSelect = document.getElementById(`icon_${i}`);
                    if (iconSelect) {
                        this.stageIcons[i] = iconSelect.value;
                    }
                }

                alert('✅ 모든 스테이지 설정이 저장되었습니다!\n\n학생페이지에서 60초 내 자동 반영됩니다.');
                console.log('[StageConfig] 설정 저장 완료:', this.currentConfig);
                
                // UI 새로고침
                this.renderUI();
            } else {
                throw new Error(`저장 실패: ${response.status}`);
            }

        } catch (error) {
            console.error('[StageConfig] 저장 실패:', error);
            alert('❌ 설정 저장에 실패했습니다. 다시 시도해주세요.\n\n오류: ' + error.message);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * 모든 입력값 유효성 검증
     */
    validateAllInputs() {
        for (let i = 1; i <= 3; i++) {
            const title = document.getElementById(`title_${i}`).value.trim();
            const description = document.getElementById(`description_${i}`).value.trim();

            if (!title) {
                return { isValid: false, message: `${i}단계 제목을 입력해주세요.` };
            }
            
            if (!description) {
                return { isValid: false, message: `${i}단계 설명을 입력해주세요.` };
            }

            if (title.length > 50) {
                return { isValid: false, message: `${i}단계 제목이 너무 깁니다. (최대 50자)` };
            }

            if (description.length > 100) {
                return { isValid: false, message: `${i}단계 설명이 너무 깁니다. (최대 100자)` };
            }
        }

        return { isValid: true };
    }

    /**
     * 기본값으로 복원
     */
    async resetToDefault() {
        if (!confirm('⚠️ 모든 설정을 기본값으로 복원하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.')) {
            return;
        }

        try {
            // 기본값 설정
            const defaultConfig = {
                stage1: "1단계: 김밥말기: 김밥을 말아보세요 (+1포인트)",
                stage2: "2단계: 김밥썰기: 김밥을 예쁘게 썰어보세요 (+1포인트)",
                stage3: "3단계: 김밥추가: 더 많은 김밥을 만들어보세요 (+1포인트)"
            };

            // 데이터베이스 업데이트
            const response = await smartFetch('tables/stage_config/default', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: 'default',
                    ...defaultConfig,
                    updated_at: new Date().toISOString()
                })
            });

            if (response.ok) {
                this.currentConfig = { ...defaultConfig };
                this.stageIcons = { 1: "🍙", 2: "✨", 3: "➕" };
                
                alert('✅ 기본값으로 복원되었습니다!');
                console.log('[StageConfig] 기본값 복원 완료');
                
                // UI 새로고침
                this.renderUI();
            } else {
                throw new Error(`복원 실패: ${response.status}`);
            }

        } catch (error) {
            console.error('[StageConfig] 기본값 복원 실패:', error);
            alert('❌ 기본값 복원에 실패했습니다. 다시 시도해주세요.');
        }
    }

    /**
     * UI 닫기
     */
    closeUI() {
        const container = document.getElementById('moduleContainer');
        if (container) {
            container.style.display = 'none';
            // 컨테이너를 완전히 제거할지는 선택사항
            // document.body.removeChild(container);
        }
    }
}

// 전역 인스턴스
let stageConfigManager = null;

/**
 * 스테이지 설정 모듈 로드 함수
 */
async function loadStageConfigModule() {
    console.log('[Admin] 스테이지 설정 모듈 로드 시작');
    
    try {
        stageConfigManager = new StageConfigManager();
        const success = await stageConfigManager.initialize();
        
        if (success) {
            // 상태 업데이트 함수가 있으면 호출 (admin-v2.html에서 정의된 경우)
            if (typeof updateModuleStatus === 'function') {
                updateModuleStatus('stageConfigStatus', '✅ 스테이지 설정 모듈이 로드되었습니다', 'success');
            }
            console.log('[Admin] 스테이지 설정 모듈 로드 완료');
        } else {
            throw new Error('모듈 초기화 실패');
        }
        
    } catch (error) {
        console.error('[Admin] 스테이지 설정 모듈 로드 실패:', error);
        // 상태 업데이트 함수가 있으면 호출
        if (typeof updateModuleStatus === 'function') {
            updateModuleStatus('stageConfigStatus', '❌ 모듈 로드 실패: ' + error.message, 'error');
        }
    }
}

/**
 * 아이콘 미리보기 업데이트 
 */
function updateIconPreview(stageNum) {
    const select = document.getElementById(`icon_${stageNum}`);
    const preview = document.getElementById(`iconPreview_${stageNum}`);
    
    if (select && preview) {
        preview.textContent = select.value;
    }
}

// 아이콘 변경 이벤트 리스너 (페이지 로드 후 추가)
document.addEventListener('DOMContentLoaded', () => {
    // 동적으로 생성되는 select 요소들에 대한 이벤트 위임
    document.addEventListener('change', (e) => {
        if (e.target && e.target.id && e.target.id.startsWith('icon_')) {
            const stageNum = e.target.id.split('_')[1];
            updateIconPreview(stageNum);
        }
    });
});

console.log('[StageConfig] 스테이지 설정 모듈 스크립트 로드 완료');