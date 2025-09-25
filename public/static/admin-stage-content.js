/**
 * 단계별 내용 관리 - 오늘의 할일 단계 설정
 * 학생 페이지의 "오늘의 할일" 카드에 표시되는 3단계 내용을 관리
 */

// 전역 변수
let supabaseClient = null;
let isLoading = false;

// 아이콘 옵션들 - 요리/김밥 관련 이모지
const ICON_OPTIONS = [
    '🍙', '🔪', '✂️', '🍴', '🥢', // 기본 요리 도구
    '➕', '✨', '⭐', '🎯', '🏆', // 기본 액션
    '🥒', '🥕', '🥬', '🍅', '🌶️', // 채소
    '🍚', '🍘', '🍱', '🥠', '🍜', // 음식
    '👨‍🍳', '👩‍🍳', '🧑‍🍳', '🎭', '🎨', // 사람/활동
    '🔥', '💧', '❄️', '🌟', '💝'  // 효과
];

// DOM 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('[Admin Stage Content] 초기화 시작');
    initializeSupabase();
    setupIconSelectors();
    setupEventListeners();
    loadCurrentSettings();
});

/**
 * Supabase 초기화
 */
async function initializeSupabase() {
    try {
        if (typeof window.supabase !== 'undefined' && typeof SUPABASE_URL !== 'undefined') {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('[Admin Stage Content] Supabase 초기화 성공');
        } else {
            throw new Error('Supabase 설정이 로드되지 않았습니다');
        }
    } catch (error) {
        console.error('[Admin Stage Content] Supabase 초기화 실패:', error);
        showError('Supabase 연결에 실패했습니다: ' + error.message);
    }
}

/**
 * 아이콘 선택기 설정
 */
function setupIconSelectors() {
    ['stage1', 'stage2', 'stage3'].forEach(stage => {
        const container = document.getElementById(`${stage}-icons`);
        if (!container) return;
        
        container.innerHTML = '';
        
        ICON_OPTIONS.forEach(icon => {
            const iconElement = document.createElement('div');
            iconElement.className = 'icon-option';
            iconElement.textContent = icon;
            iconElement.onclick = () => selectIcon(stage, icon);
            container.appendChild(iconElement);
        });
        
        // 기본값으로 현재 선택된 아이콘 표시
        const currentIcon = document.getElementById(`${stage}-icon`).value;
        selectIcon(stage, currentIcon);
    });
}

/**
 * 아이콘 선택
 */
function selectIcon(stage, icon) {
    // 숨겨진 input에 값 설정
    document.getElementById(`${stage}-icon`).value = icon;
    
    // 미리보기 업데이트
    document.getElementById(`${stage}-preview-icon`).textContent = icon;
    
    // 선택 상태 표시
    const container = document.getElementById(`${stage}-icons`);
    container.querySelectorAll('.icon-option').forEach(option => {
        option.classList.remove('selected');
        if (option.textContent === icon) {
            option.classList.add('selected');
        }
    });
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
    // 각 단계별 입력 필드 변경 시 미리보기 업데이트
    ['stage1', 'stage2', 'stage3'].forEach(stage => {
        const titleInput = document.getElementById(`${stage}-title`);
        const descInput = document.getElementById(`${stage}-desc`);
        
        if (titleInput) {
            titleInput.addEventListener('input', () => updatePreview(stage));
        }
        
        if (descInput) {
            descInput.addEventListener('input', () => updatePreview(stage));
        }
    });
}

/**
 * 미리보기 업데이트
 */
function updatePreview(stage) {
    const title = document.getElementById(`${stage}-title`).value;
    const desc = document.getElementById(`${stage}-desc`).value;
    
    document.getElementById(`${stage}-preview-title`).textContent = title;
    document.getElementById(`${stage}-preview-desc`).textContent = desc;
}

/**
 * 현재 설정 로드
 */
async function loadCurrentSettings() {
    try {
        console.log('[Admin Stage Content] 현재 설정 로드 시작');
        
        if (!supabaseClient) {
            throw new Error('Supabase 클라이언트가 초기화되지 않았습니다');
        }
        
        // stage_config 테이블에서 현재 설정 조회
        const { data, error } = await supabaseClient
            .from('stage_config')
            .select('*')
            .limit(1);
        
        if (error) {
            console.error('[Admin Stage Content] 설정 로드 오류:', error);
            // 오류가 발생해도 기본값으로 진행
            return;
        }
        
        if (data && data.length > 0) {
            const config = data[0];
            console.log('[Admin Stage Content] 기존 설정 발견:', config);
            
            // 각 단계별로 "제목: 설명" 형식에서 분리하여 설정
            ['stage1', 'stage2', 'stage3'].forEach((stageKey, index) => {
                const stageNumber = index + 1;
                const fullText = config[stageKey] || '';
                
                let title = `${stageNumber}단계`;
                let description = '';
                let icon = ['🍙', '🔪', '➕'][index]; // 기본 아이콘
                
                // "제목: 설명" 형식에서 제목과 설명 분리
                const colonIndex = fullText.indexOf(': ');
                if (colonIndex !== -1) {
                    title = fullText.substring(0, colonIndex);
                    description = fullText.substring(colonIndex + 2);
                } else if (fullText) {
                    // 콜론이 없으면 전체를 제목으로 처리
                    title = fullText;
                }
                
                // 저장된 아이콘이 있다면 사용 (기본 아이콘 대신)
                if (config[`${stageKey}_icon`]) {
                    icon = config[`${stageKey}_icon`];
                }
                
                // UI에 값 설정
                document.getElementById(`${stageKey}-title`).value = title;
                document.getElementById(`${stageKey}-desc`).value = description;
                document.getElementById(`${stageKey}-icon`).value = icon;
                
                // 미리보기 업데이트
                updatePreview(stageKey);
                selectIcon(stageKey, icon);
                
                console.log(`[Admin Stage Content] ${stageNumber}단계 로드 완료:`, {
                    title, description, icon
                });
            });
        } else {
            console.log('[Admin Stage Content] 기존 설정 없음, 기본값 사용');
        }
        
    } catch (error) {
        console.error('[Admin Stage Content] 설정 로드 실패:', error);
        showError('기존 설정을 불러오는데 실패했습니다: ' + error.message);
    }
}

/**
 * 모든 단계 저장
 */
async function saveAllStages() {
    if (isLoading) return;
    
    try {
        isLoading = true;
        showLoading();
        
        console.log('[Admin Stage Content] 모든 단계 저장 시작');
        
        if (!supabaseClient) {
            throw new Error('Supabase 클라이언트가 초기화되지 않았습니다');
        }
        
        // 각 단계의 데이터 수집
        const stageData = {};
        
        ['stage1', 'stage2', 'stage3'].forEach(stageKey => {
            const title = document.getElementById(`${stageKey}-title`).value.trim();
            const desc = document.getElementById(`${stageKey}-desc`).value.trim();
            const icon = document.getElementById(`${stageKey}-icon`).value;
            
            // "제목: 설명" 형식으로 결합 (기존 시스템과 호환성 유지)
            stageData[stageKey] = `${title}: ${desc}`;
            stageData[`${stageKey}_icon`] = icon;
        });
        
        // 고유 ID 설정 (하나의 레코드만 유지)
        const configId = 'default_stage_config';
        stageData.id = configId;
        stageData.updated_at = new Date().toISOString();
        
        console.log('[Admin Stage Content] 저장할 데이터:', stageData);
        
        // stage_config 테이블에 upsert (업데이트 또는 삽입)
        const { data, error } = await supabaseClient
            .from('stage_config')
            .upsert([stageData], { 
                onConflict: 'id',
                ignoreDuplicates: false 
            });
        
        if (error) {
            throw error;
        }
        
        console.log('[Admin Stage Content] 저장 성공:', data);
        
        // localStorage에도 백업 저장
        localStorage.setItem('stage_config_backup', JSON.stringify(stageData));
        
        hideLoading();
        showSuccess();
        
    } catch (error) {
        console.error('[Admin Stage Content] 저장 실패:', error);
        hideLoading();
        showError('저장에 실패했습니다: ' + error.message);
    } finally {
        isLoading = false;
    }
}

/**
 * 로딩 표시
 */
function showLoading() {
    document.getElementById('loadingOverlay').classList.remove('hidden');
}

/**
 * 로딩 숨김
 */
function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}

/**
 * 성공 모달 표시
 */
function showSuccess() {
    document.getElementById('successModal').classList.remove('hidden');
}

/**
 * 성공 모달 닫기
 */
function closeSuccessModal() {
    document.getElementById('successModal').classList.add('hidden');
}

/**
 * 에러 표시
 */
function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('errorModal').classList.remove('hidden');
}

/**
 * 에러 모달 닫기
 */
function closeErrorModal() {
    document.getElementById('errorModal').classList.add('hidden');
}

console.log('[Admin Stage Content] 스크립트 로드 완료');