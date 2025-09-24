/**
 * 학생페이지 - 스테이지 설정 동적 로딩
 * 관리자가 설정한 스테이지 설명을 실시간으로 반영
 */

// ============ STAGE SETTINGS MANAGEMENT ============

// 실패 추적 변수
let stageSettingsFailureCount = 0;
const MAX_STAGE_FAILURES = 5;

/**
 * 스테이지 설정 로드 및 UI 업데이트
 */
async function loadStageSettings() {
    try {
        console.log('[Student] 스테이지 설정 로드 시작');
        
        // 기존 stage_config 테이블 사용 (호환성 유지)
        let stageConfigData;
        try {
            const response = await smartFetch('tables/stage_config');
            if (response.ok) {
                const result = await response.json();
                if (result.data && result.data.length > 0) {
                    stageConfigData = result.data[0]; // 첫 번째 레코드 사용
                    console.log('[Student] stage_config에서 설정 로드 성공:', stageConfigData);
                }
            } else {
                console.warn('[Student] stage_config 테이블 응답 오류:', response.status);
            }
        } catch (fetchError) {
            console.error('[Student] stage_config 테이블 접근 실패:', fetchError);
        }
        
        if (stageConfigData) {
            // stage_config 형식 데이터를 stage_descriptions 형식으로 변환
            const convertedData = [];
            
            // "제목: 설명" 형식에서 제목과 설명 분리 (첫 번째 콜론만 구분자로 사용)
            ['stage1', 'stage2', 'stage3'].forEach((key, index) => {
                const fullText = stageConfigData[key] || '';
                const colonIndex = fullText.indexOf(': ');
                
                let title, description;
                if (colonIndex !== -1) {
                    title = fullText.substring(0, colonIndex);
                    description = fullText.substring(colonIndex + 2); // ': ' 이후 모든 텍스트
                } else {
                    title = `${index + 1}단계`;
                    description = fullText || '설명 없음';
                }
                
                convertedData.push({
                    stage_id: index + 1,
                    title: title,
                    description: description,
                    icon: ['🍙', '✨', '➕'][index] // 기본 아이콘
                });
            });
            
            console.log('[Student] 변환된 스테이지 설정:', convertedData);
            updateStageUI(convertedData);
            stageSettingsFailureCount = 0; // 성공 시 실패 카운터 리셋
        } else {
            console.log('[Student] 스테이지 설정이 없음, 기본 UI 유지');
            stageSettingsFailureCount++;
        }
        
    } catch (error) {
        console.error('[Student] 스테이지 설정 로드 오류:', error);
        stageSettingsFailureCount++;
        
        // 연속 실패 시 자동 새로고침 중단
        if (stageSettingsFailureCount >= MAX_STAGE_FAILURES) {
            console.warn(`[Student] 스테이지 설정 ${MAX_STAGE_FAILURES}회 연속 실패, 자동 새로고침 중단`);
            stopStageSettingsRefresh();
        }
    }
}

/**
 * 스테이지 UI 업데이트
 */
function updateStageUI(stageData) {
    try {
        stageData.forEach(stage => {
            const stageId = stage.stage_id;
            
            // 제목 업데이트 (h4 태그)
            const titleElement = document.querySelector(`#stage${stageId}Card h4`);
            if (titleElement && stage.title) {
                titleElement.textContent = stage.title;
                console.log(`[Student] ${stageId}단계 제목 업데이트: ${stage.title}`);
            }
            
            // 설명 업데이트 (p 태그)
            const descElement = document.querySelector(`#stage${stageId}Card p`);
            if (descElement && stage.description) {
                descElement.textContent = stage.description;
                console.log(`[Student] ${stageId}단계 설명 업데이트: ${stage.description}`);
            }
            
            // 아이콘 업데이트 (span 태그)
            const iconElement = document.querySelector(`#stage${stageId}Icon span`);
            if (iconElement && stage.icon) {
                iconElement.textContent = stage.icon;
                console.log(`[Student] ${stageId}단계 아이콘 업데이트: ${stage.icon}`);
            }
        });
        
        console.log('[Student] 모든 스테이지 UI 업데이트 완료');
        
    } catch (error) {
        console.error('[Student] 스테이지 UI 업데이트 오류:', error);
    }
}

/**
 * 스테이지 설정 자동 새로고침 시작 (10초마다)
 */
function startStageSettingsRefresh() {
    // 기존 인터벌이 있다면 제거
    if (stageSettingsUpdateInterval) {
        clearInterval(stageSettingsUpdateInterval);
    }
    
    // 60초마다 스테이지 설정 새로고침 (최적화: 10초 → 60초)
    stageSettingsUpdateInterval = setInterval(async () => {
        // 연속 실패 횟수가 최대치에 도달한 경우 중단
        if (stageSettingsFailureCount >= MAX_STAGE_FAILURES) {
            console.warn('[Student] 스테이지 설정 최대 실패 횟수 도달, 새로고침 중단');
            stopStageSettingsRefresh();
            return;
        }
        
        try {
            await loadStageSettings();
        } catch (error) {
            console.error('[Student] 스테이지 설정 자동 새로고침 오류:', error);
        }
    }, 60000);
    
    console.log('[Student] 스테이지 설정 자동 새로고침 시작 (60초 간격)');
}

/**
 * 스테이지 설정 자동 새로고침 중지
 */
function stopStageSettingsRefresh() {
    if (stageSettingsUpdateInterval) {
        clearInterval(stageSettingsUpdateInterval);
        stageSettingsUpdateInterval = null;
        console.log('[Student] 스테이지 설정 자동 새로고침 중지');
    }
}

console.log('[Student] 스테이지 설정 모듈 로드 완료');