/**
 * API 래퍼 - REST API를 Supabase 직접 연결로 변환
 * learning_guides 테이블 전용
 */

/**
 * learning_guides 테이블용 스마트 fetch 함수
 * @param {string} url - 원래 REST API URL
 * @param {object} options - fetch 옵션
 * @returns {Promise} - REST API와 동일한 형식의 응답
 */
async function smartFetch(url, options = {}) {
    try {
        // class_point_goals 관련 요청 처리
        if (url.includes('class_point_goals')) {
            console.log('[SmartFetch] class_point_goals 요청 감지:', url);
            
            // Supabase 클라이언트 확인
            if (typeof supabase === 'undefined' || !supabase) {
                console.warn('[SmartFetch] Supabase 클라이언트 없음, 기존 fetch 사용');
                return fetch(url, options);
            }
            
            // URL 분석
            const method = options.method || 'GET';
            
            if (method === 'GET') {
                // GET 요청: 모든 class_point_goals 조회
                const { data, error } = await supabase
                    .from('class_point_goals')
                    .select('*')
                    .order('class_name', { ascending: true });
                
                console.log('[SmartFetch] class_point_goals GET 결과:', { data, error });
                
                // REST API 형식으로 응답 변환
                return {
                    ok: !error,
                    status: error ? 500 : 200,
                    json: async () => ({
                        data: data || []
                    })
                };
            } else if (method === 'POST') {
                // POST 요청: 새 학급 목표 추가
                const body = JSON.parse(options.body || '{}');
                
                const { data, error } = await supabase
                    .from('class_point_goals')
                    .insert([body])
                    .select();
                
                console.log('[SmartFetch] class_point_goals POST 결과:', { data, error });
                
                return {
                    ok: !error,
                    status: error ? 500 : 201,
                    json: async () => ({
                        data: data?.[0] || null
                    })
                };
            } else if (method === 'PUT' && url.includes('/')) {
                // PUT 요청: 학급 목표 수정
                const goalId = url.split('/').pop();
                const body = JSON.parse(options.body || '{}');
                
                const { data, error } = await supabase
                    .from('class_point_goals')
                    .update(body)
                    .eq('id', goalId)
                    .select();
                
                console.log('[SmartFetch] class_point_goals PUT 결과:', { data, error });
                
                return {
                    ok: !error,
                    status: error ? 500 : 200,
                    json: async () => ({
                        data: data?.[0] || null
                    })
                };
            } else if (method === 'DELETE' && url.includes('/')) {
                // DELETE 요청: 학급 목표 삭제
                const goalId = url.split('/').pop();
                
                const { error } = await supabase
                    .from('class_point_goals')
                    .delete()
                    .eq('id', goalId);
                
                console.log('[SmartFetch] class_point_goals DELETE 결과:', { error });
                
                return {
                    ok: !error,
                    status: error ? 500 : 204
                };
            }
        }

        // learning_guides 관련 요청 처리
        if (url.includes('learning_guides')) {
            console.log('[SmartFetch] learning_guides 요청 감지:', url);
            
            // Supabase 클라이언트 확인
            if (typeof supabase === 'undefined' || !supabase) {
                console.warn('[SmartFetch] Supabase 클라이언트 없음, 기존 fetch 사용');
                return fetch(url, options);
            }
            
            // URL 분석
            const method = options.method || 'GET';
            
            if (method === 'GET') {
                // GET 요청: 데이터 조회
                const { data, error } = await supabase
                    .from('learning_guides')
                    .select('*')
                    .limit(1);
                
                console.log('[SmartFetch] Supabase GET 결과:', { data, error });
                if (error) {
                    console.error('[SmartFetch] 상세 오류 정보:', {
                        message: error.message,
                        details: error.details,
                        hint: error.hint,
                        code: error.code
                    });
                }
                
                // REST API 형식으로 응답 변환
                return {
                    ok: !error,
                    status: error ? 500 : 200,
                    json: async () => ({
                        data: data || []
                    })
                };
                
            } else if (method === 'POST') {
                // POST 요청: 새 데이터 생성
                const body = JSON.parse(options.body);
                
                const { data, error } = await supabase
                    .from('learning_guides')
                    .insert([body])
                    .select()
                    .single();
                
                console.log('[SmartFetch] Supabase POST 결과:', { data, error });
                
                return {
                    ok: !error,
                    status: error ? 500 : 201,
                    json: async () => ({
                        data: data
                    })
                };
                
            } else if (method === 'PUT') {
                // PUT 요청: 데이터 업데이트
                const body = JSON.parse(options.body);
                const recordId = body.id;
                
                const { data, error } = await supabase
                    .from('learning_guides')
                    .update(body)
                    .eq('id', recordId)
                    .select()
                    .single();
                
                console.log('[SmartFetch] Supabase PUT 결과:', { data, error });
                
                return {
                    ok: !error,
                    status: error ? 500 : 200,
                    json: async () => ({
                        data: data
                    })
                };
            }
        }
        
        // stage_config 관련 요청 처리
        if (url.includes('stage_config')) {
            console.log('[SmartFetch] stage_config 요청 감지:', url);
            
            // Supabase 클라이언트 확인
            if (typeof supabase === 'undefined' || !supabase) {
                console.warn('[SmartFetch] Supabase 클라이언트 없음, 기존 fetch 사용');
                return fetch(url, options);
            }
            
            // URL 분석
            const method = options.method || 'GET';
            
            if (method === 'GET') {
                // GET 요청: 스테이지 설정 조회
                const { data, error } = await supabase
                    .from('stage_config')
                    .select('*')
                    .limit(1);
                
                console.log('[SmartFetch] Supabase stage_config GET 결과:', { data, error });
                
                // REST API 형식으로 응답 변환
                return {
                    ok: !error,
                    status: error ? 500 : 200,
                    json: async () => ({
                        data: data || []
                    })
                };
                
            } else if (method === 'POST') {
                // POST 요청: 새 스테이지 설정 생성
                const body = JSON.parse(options.body);
                
                const { data, error } = await supabase
                    .from('stage_config')
                    .insert([body])
                    .select()
                    .single();
                
                console.log('[SmartFetch] Supabase stage_config POST 결과:', { data, error });
                
                return {
                    ok: !error,
                    status: error ? 500 : 201,
                    json: async () => ({
                        data: data
                    })
                };
                
            } else if (method === 'PUT' || method === 'PATCH') {
                // PUT/PATCH 요청: 스테이지 설정 업데이트
                const body = JSON.parse(options.body);
                let recordId = 'default'; // 기본 레코드 ID
                
                // URL에서 ID 추출 시도
                const idMatch = url.match(/stage_config\/([^?]+)/);
                if (idMatch) {
                    recordId = idMatch[1];
                }
                
                const { data, error } = await supabase
                    .from('stage_config')
                    .update(body)
                    .eq('id', recordId)
                    .select()
                    .single();
                
                console.log('[SmartFetch] Supabase stage_config PUT 결과:', { data, error });
                
                return {
                    ok: !error,
                    status: error ? 500 : 200,
                    json: async () => ({
                        data: data
                    })
                };
            }
        }
        
        // teacher_messages 관련 요청 처리
        if (url.includes('teacher_messages')) {
            console.log('[SmartFetch] teacher_messages 요청 감지:', url);
            
            // Supabase 클라이언트 확인
            if (typeof supabase === 'undefined' || !supabase) {
                console.warn('[SmartFetch] Supabase 클라이언트 없음, 기존 fetch 사용');
                return fetch(url, options);
            }
            
            // URL 분석
            const method = options.method || 'GET';
            
            if (method === 'GET') {
                // GET 요청: 메시지 조회
                let query = supabase.from('teacher_messages').select('*');
                
                // URL 파라미터 분석 (limit, sort 등)
                if (url.includes('limit=')) {
                    const limitMatch = url.match(/limit=(\d+)/);
                    if (limitMatch) {
                        query = query.limit(parseInt(limitMatch[1]));
                    }
                }
                
                if (url.includes('sort=')) {
                    const sortMatch = url.match(/sort=([^&]+)/);
                    if (sortMatch) {
                        const sortField = sortMatch[1].replace('-', '');
                        const ascending = !sortMatch[1].startsWith('-');
                        query = query.order(sortField, { ascending });
                    }
                }
                
                const { data, error } = await query;
                
                console.log('[SmartFetch] Supabase teacher_messages GET 결과:', { data, error });
                
                // REST API 형식으로 응답 변환
                return {
                    ok: !error,
                    status: error ? 500 : 200,
                    json: async () => ({
                        data: data || []
                    })
                };
                
            } else if (method === 'POST') {
                // POST 요청: 새 메시지 생성
                const body = JSON.parse(options.body);
                
                console.log('[SmartFetch] teacher_messages POST 요청 데이터:', body);
                
                const { data, error } = await supabase
                    .from('teacher_messages')
                    .insert([body])
                    .select()
                    .single();
                
                console.log('[SmartFetch] Supabase teacher_messages POST 결과:', { data, error });
                if (error) {
                    console.error('[SmartFetch] POST 상세 오류:', {
                        message: error.message,
                        details: error.details,
                        hint: error.hint,
                        code: error.code
                    });
                }
                
                return {
                    ok: !error,
                    status: error ? 500 : 201,
                    json: async () => ({
                        data: data,
                        error: error // 오류 정보도 포함
                    })
                };
                
            } else if (method === 'PUT' || method === 'PATCH') {
                // PUT/PATCH 요청: 메시지 업데이트
                const body = JSON.parse(options.body);
                let recordId = body.id;
                
                // URL에서 ID 추출 시도
                const idMatch = url.match(/teacher_messages\/([^?]+)/);
                if (idMatch) {
                    recordId = idMatch[1];
                }
                
                console.log('[SmartFetch] teacher_messages PATCH 요청:', {
                    url: url,
                    recordId: recordId,
                    body: body
                });
                
                const { data, error } = await supabase
                    .from('teacher_messages')
                    .update(body)
                    .eq('id', recordId)
                    .select()
                    .single();
                
                console.log('[SmartFetch] Supabase teacher_messages PATCH 결과:', { data, error });
                if (error) {
                    console.error('[SmartFetch] PATCH 상세 오류:', {
                        message: error.message,
                        details: error.details,
                        hint: error.hint,
                        code: error.code,
                        recordId: recordId
                    });
                }
                
                return {
                    ok: !error,
                    status: error ? 500 : 200,
                    json: async () => ({
                        data: data,
                        error: error // PATCH 오류 정보도 포함
                    })
                };
                
            } else if (method === 'DELETE') {
                // DELETE 요청: 메시지 삭제
                let recordId = null;
                
                // URL에서 ID 추출
                const idMatch = url.match(/teacher_messages\/([^?]+)/);
                if (idMatch) {
                    recordId = idMatch[1];
                }
                
                if (!recordId) {
                    console.error('[SmartFetch] DELETE 요청에서 ID를 찾을 수 없음:', url);
                    return {
                        ok: false,
                        status: 400,
                        json: async () => ({
                            error: { message: 'ID가 필요합니다' }
                        })
                    };
                }
                
                console.log('[SmartFetch] teacher_messages DELETE 요청:', {
                    url: url,
                    recordId: recordId
                });
                
                const { data, error } = await supabase
                    .from('teacher_messages')
                    .delete()
                    .eq('id', recordId)
                    .select();
                
                console.log('[SmartFetch] Supabase teacher_messages DELETE 결과:', { data, error });
                if (error) {
                    console.error('[SmartFetch] DELETE 상세 오류:', {
                        message: error.message,
                        details: error.details,
                        hint: error.hint,
                        code: error.code,
                        recordId: recordId
                    });
                }
                
                return {
                    ok: !error,
                    status: error ? 500 : 204, // DELETE는 204 No Content
                    json: async () => ({
                        data: data,
                        error: error
                    })
                };
            }
        }
        
        // config 테이블 관련 요청 처리 (spinner_lists 등)
        if (url.includes('config') || url.includes('spinner')) {
            console.log('[SmartFetch] config/spinner 요청 감지:', url);
            
            // Supabase 클라이언트 확인
            if (typeof supabase === 'undefined' || !supabase) {
                console.warn('[SmartFetch] Supabase 클라이언트 없음, 기존 fetch 사용');
                return fetch(url, options);
            }
            
            // URL 분석
            const method = options.method || 'GET';
            
            if (method === 'GET') {
                // GET 요청: config 값 조회
                let configKey = 'spinner_lists'; // 기본값
                
                // URL에서 config_key 추출 시도
                if (url.includes('config_key=')) {
                    const keyMatch = url.match(/config_key=([^&]+)/);
                    if (keyMatch) {
                        configKey = keyMatch[1];
                    }
                }
                
                const { data, error } = await supabase
                    .from('config')
                    .select('config_value')
                    .eq('config_key', configKey)
                    .single();
                
                console.log('[SmartFetch] Supabase config GET 결과:', { data, error });
                
                let parsedValue = null;
                if (data && data.config_value) {
                    try {
                        parsedValue = JSON.parse(data.config_value);
                    } catch (parseError) {
                        parsedValue = data.config_value;
                    }
                }
                
                // REST API 형식으로 응답 변환
                return {
                    ok: !error && data,
                    status: error ? (error.code === 'PGRST116' ? 404 : 500) : 200,
                    json: async () => ({
                        data: parsedValue
                    })
                };
                
            } else if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
                // POST/PUT/PATCH 요청: config 값 저장
                const body = JSON.parse(options.body);
                let configKey = body.config_key || 'spinner_lists';
                let configValue = body.config_value || body;
                
                // 값을 JSON 문자열로 변환
                if (typeof configValue !== 'string') {
                    configValue = JSON.stringify(configValue);
                }
                
                const { data, error } = await supabase
                    .from('config')
                    .upsert({
                        config_key: configKey,
                        config_value: configValue,
                        updated_at: new Date().toISOString()
                    }, {
                        onConflict: 'config_key',
                        ignoreDuplicates: false
                    })
                    .select()
                    .single();
                
                console.log('[SmartFetch] Supabase config UPSERT 결과:', { data, error });
                
                return {
                    ok: !error,
                    status: error ? 500 : (method === 'POST' ? 201 : 200),
                    json: async () => ({
                        data: data
                    })
                };
            }
        }
        
        // board_content 테이블 관련 요청 처리 (게시판/공지사항)
        if (url.includes('board_content')) {
            console.log('[SmartFetch] board_content 요청 감지:', url);
            
            // Supabase 클라이언트 확인
            if (typeof supabase === 'undefined' || !supabase) {
                console.warn('[SmartFetch] Supabase 클라이언트 없음, 기존 fetch 사용');
                return fetch(url, options);
            }
            
            // URL 분석
            const method = options.method || 'GET';
            
            if (method === 'GET') {
                // GET 요청: 게시판 내용 조회
                let query = supabase.from('board_content').select('*');
                
                // URL 파라미터 분석 (board_type 필터링 등)
                if (url.includes('board_type=')) {
                    const typeMatch = url.match(/board_type=([^&]+)/);
                    if (typeMatch) {
                        query = query.eq('board_type', typeMatch[1]);
                    }
                }
                
                // 정렬 파라미터 분석
                if (url.includes('sort=')) {
                    const sortMatch = url.match(/sort=([^&]+)/);
                    if (sortMatch) {
                        const sortField = sortMatch[1].replace('-', '');
                        const ascending = !sortMatch[1].startsWith('-');
                        query = query.order(sortField, { ascending });
                    }
                } else {
                    // 기본 정렬: 최근 업데이트 순
                    query = query.order('updated_at', { ascending: false });
                }
                
                // 제한 파라미터 분석
                if (url.includes('limit=')) {
                    const limitMatch = url.match(/limit=(\d+)/);
                    if (limitMatch) {
                        query = query.limit(parseInt(limitMatch[1]));
                    }
                }
                
                const { data, error } = await query;
                
                console.log('[SmartFetch] Supabase board_content GET 결과:', { data, error });
                
                // REST API 형식으로 응답 변환
                return {
                    ok: !error,
                    status: error ? 500 : 200,
                    json: async () => ({
                        data: data || []
                    })
                };
                
            } else if (method === 'POST') {
                // POST 요청: 새 게시판 내용 생성
                const body = JSON.parse(options.body);
                
                console.log('[SmartFetch] board_content POST 요청 데이터:', body);
                
                const { data, error } = await supabase
                    .from('board_content')
                    .insert([body])
                    .select()
                    .single();
                
                console.log('[SmartFetch] Supabase board_content POST 결과:', { data, error });
                
                return {
                    ok: !error,
                    status: error ? 500 : 201,
                    json: async () => ({
                        data: data,
                        error: error
                    })
                };
                
            } else if (method === 'PUT' || method === 'PATCH') {
                // PUT/PATCH 요청: 게시판 내용 업데이트
                const body = JSON.parse(options.body);
                let recordId = body.id;
                
                // URL에서 ID 추출 시도
                const idMatch = url.match(/board_content\/([^?]+)/);
                if (idMatch) {
                    recordId = idMatch[1];
                }
                
                console.log('[SmartFetch] board_content PATCH 요청:', {
                    url: url,
                    recordId: recordId,
                    body: body
                });
                
                const { data, error } = await supabase
                    .from('board_content')
                    .update(body)
                    .eq('id', recordId)
                    .select()
                    .single();
                
                console.log('[SmartFetch] Supabase board_content PATCH 결과:', { data, error });
                
                return {
                    ok: !error,
                    status: error ? 500 : 200,
                    json: async () => ({
                        data: data,
                        error: error
                    })
                };
                
            } else if (method === 'DELETE') {
                // DELETE 요청: 게시판 내용 삭제
                let recordId = null;
                
                // URL에서 ID 추출
                const idMatch = url.match(/board_content\/([^?]+)/);
                if (idMatch) {
                    recordId = idMatch[1];
                }
                
                if (!recordId) {
                    console.error('[SmartFetch] DELETE 요청에서 ID를 찾을 수 없음:', url);
                    return {
                        ok: false,
                        status: 400,
                        json: async () => ({
                            error: { message: 'ID가 필요합니다' }
                        })
                    };
                }
                
                console.log('[SmartFetch] board_content DELETE 요청:', {
                    url: url,
                    recordId: recordId
                });
                
                const { data, error } = await supabase
                    .from('board_content')
                    .delete()
                    .eq('id', recordId)
                    .select();
                
                console.log('[SmartFetch] Supabase board_content DELETE 결과:', { data, error });
                
                return {
                    ok: !error,
                    status: error ? 500 : 204,
                    json: async () => ({
                        data: data,
                        error: error
                    })
                };
            }
        }
        
        // 기타 요청은 기존 fetch 사용
        console.log('[SmartFetch] 기존 fetch 사용:', url);
        return fetch(url, options);
        
    } catch (error) {
        console.error('[SmartFetch] 오류 발생:', error);
        // 오류 시 기존 fetch로 폴백
        return fetch(url, options);
    }
}

console.log('[API Wrapper] learning_guides, stage_config, teacher_messages, config, board_content 래퍼 함수 로드 완료');