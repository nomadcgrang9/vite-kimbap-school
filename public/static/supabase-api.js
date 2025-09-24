// Supabase API 래퍼 함수들
// 기존 fetch API를 Supabase로 대체하는 통합 함수들

// Supabase 클라이언트 초기화
let apiSupabaseClient = null;

// 글로벌 Supabase 클라이언트 가져오기 함수
function getSupabaseClient() {
    // 인라인 스크립트에서 초기화된 글로벌 클라이언트 사용
    if (typeof globalSupabaseClient !== 'undefined' && globalSupabaseClient) {
        return globalSupabaseClient;
    }
    
    // supabase-api.js의 클라이언트 사용
    if (apiSupabaseClient) {
        return apiSupabaseClient;
    }
    
    // 폴백: 로컬에서 직접 초기화
    if (typeof window.supabase !== 'undefined' && SUPABASE_URL && SUPABASE_ANON_KEY) {
        try {
            const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('[supabase-api] 폴백 Supabase 초기화 성공');
            return client;
        } catch (error) {
            console.error('[supabase-api] 폴백 Supabase 초기화 실패:', error);
        }
    }
    
    console.warn('[supabase-api] Supabase 클라이언트를 사용할 수 없습니다');
    return null;
}

function initSupabaseClient() {
    try {
        if (typeof window.supabase !== 'undefined' && SUPABASE_URL && SUPABASE_ANON_KEY) {
            apiSupabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('[API] Supabase client initialized');
            return true;
        }
        console.warn('[API] Supabase initialization requirements not met');
        console.log('[API] window.supabase:', typeof window.supabase);
        console.log('[API] SUPABASE_URL:', !!SUPABASE_URL);
        console.log('[API] SUPABASE_ANON_KEY:', !!SUPABASE_ANON_KEY);
        return false;
    } catch (error) {
        console.error('[API] Supabase initialization error:', error);
        return false;
    }
}

// 즉시 초기화 시도
if (typeof window !== 'undefined') {
    console.log('[API] Attempting immediate Supabase client initialization...');
    initSupabaseClient();
}

// API 래퍼 객체
const supabaseAPI = {
    // ========== 학생 관련 ==========
    students: {
        // 모든 학생 조회
        async getAll() {
            try {
                const client = getSupabaseClient();
                if (!client) {
                    throw new Error('Supabase client not available');
                }
                
                const { data, error } = await client
                    .from('students')
                    .select('*')
                    .order('student_id', { ascending: true });
                
                if (error) throw error;
                return data || [];
            } catch (error) {
                console.error('Error fetching students:', error);
                return JSON.parse(localStorage.getItem('students') || '[]');
            }
        },

        // 특정 학급 학생 조회
        async getByClass(classInfo) {
            try {
                console.log(`[getByClass] 검색할 학급: "${classInfo}"`);
                const client = getSupabaseClient();
                if (!client) {
                    throw new Error('Supabase client not available');
                }
                
                const { data, error } = await client
                    .from('students')
                    .select('*')
                    .eq('full_class', classInfo) // 🔥 수정: class_info → full_class
                    .order('number', { ascending: true });
                
                if (error) throw error;
                console.log(`[getByClass] 검색 결과: ${data?.length || 0}명`);
                if (data && data.length > 0) {
                    console.log('[getByClass] 첫 번째 학생:', data[0]);
                }
                return data || [];
            } catch (error) {
                console.error('Error fetching class students:', error);
                return [];
            }
        },

        // 학생 등록/업데이트
        async upsert(studentData) {
            try {
                // ID가 없으면 생성
                if (!studentData.id) {
                    studentData.id = `${studentData.student_id || studentData.studentId}_${Date.now()}`;
                }
                
                // 필드명 매핑 (JavaScript ↔ Supabase)
                const mappedData = {
                    ...studentData,
                    student_id: studentData.student_id || studentData.studentId,
                    class_num: studentData.class_number || studentData.classNum || studentData.class_num,
                    full_class: studentData.full_class || studentData.fullClass,
                };
                
                // 불필요한 필드 제거
                delete mappedData.studentId;
                delete mappedData.classNum;
                delete mappedData.fullClass;
                delete mappedData.class_number;
                
                const client = getSupabaseClient();
                if (!client) {
                    throw new Error('Supabase client not available');
                }
                
                const { data, error } = await client
                    .from('students')
                    .upsert(mappedData, { 
                        onConflict: 'student_id',
                        ignoreDuplicates: false 
                    })
                    .select()
                    .single();
                
                if (error) throw error;
                return data;
            } catch (error) {
                console.error('Error upserting student:', error);
                // localStorage 폴백
                const students = JSON.parse(localStorage.getItem('students') || '[]');
                const index = students.findIndex(s => s.student_id === studentData.student_id);
                if (index >= 0) {
                    students[index] = { ...students[index], ...studentData };
                } else {
                    students.push(studentData);
                }
                localStorage.setItem('students', JSON.stringify(students));
                return studentData;
            }
        },

        // 학생 삭제
        async delete(studentId) {
            try {
                const client = getSupabaseClient();
                if (!client) {
                    throw new Error('Supabase client not available');
                }
                
                const { error } = await client
                    .from('students')
                    .delete()
                    .eq('student_id', studentId);
                
                if (error) throw error;
                return true;
            } catch (error) {
                console.error('Error deleting student:', error);
                return false;
            }
        }
    },

    // ========== 포인트 관련 ==========
    dailyPoints: {
        // 일일 포인트 조회
        async get(studentId, date = null) {
            try {
                const client = getSupabaseClient();
                if (!client) {
                    throw new Error('Supabase client not available');
                }
                
                let query = client
                    .from('daily_points')
                    .select('*');
                
                if (studentId) {
                    query = query.eq('student_id', studentId);
                }
                
                if (date) {
                    query = query.eq('date', date);
                } else {
                    // 오늘 날짜
                    const today = new Date().toISOString().split('T')[0];
                    query = query.eq('date', today);
                }
                
                const { data, error } = await query.single();
                
                if (error && error.code === 'PGRST116') {
                    // 데이터가 없는 경우 기본값 반환
                    return {
                        student_id: studentId,
                        date: date || new Date().toISOString().split('T')[0],
                        stage1_count: 0,
                        stage2_count: 0,
                        stage3_count: 0,
                        total_points: 0
                    };
                }
                
                if (error) throw error;
                return data;
            } catch (error) {
                console.error('Error fetching daily points:', error);
                return null;
            }
        },

        // 일일 포인트 생성
        async create(pointData) {
            return this.upsert(pointData);
        },
        
        // 일일 포인트 저장/업데이트
        async upsert(pointData) {
            try {
                // ID가 없으면 생성
                if (!pointData.id) {
                    pointData.id = `${pointData.student_id}_${pointData.date}`;
                }
                
                const client = getSupabaseClient();
                if (!client) {
                    throw new Error('Supabase client not available');
                }
                
                const { data, error } = await client
                    .from('daily_points')
                    .upsert(pointData, {
                        onConflict: 'student_id,date',
                        ignoreDuplicates: false
                    })
                    .select()
                    .single();
                
                if (error) throw error;
                return data;
            } catch (error) {
                console.error('Error upserting daily points:', error);
                // localStorage 폴백
                localStorage.setItem(`daily_points_${pointData.student_id}`, JSON.stringify(pointData));
                return pointData;
            }
        },

        // 모든 일일 포인트 조회 (관리자용)
        async list(date = null) {
            return this.getAll(date);
        },
        
        async getAll(date = null) {
            try {
                const client = getSupabaseClient();
                if (!client) {
                    throw new Error('Supabase client not available');
                }
                
                let query = client
                    .from('daily_points')
                    .select('*');
                
                if (date) {
                    query = query.eq('date', date);
                }
                
                const { data, error } = await query.order('total_points', { ascending: false });
                
                if (error) throw error;
                return data || [];
            } catch (error) {
                console.error('Error fetching all daily points:', error);
                return [];
            }
        }
    },

    // ========== 스테이지 설정 관련 ==========
    stageDescriptions: {
        // 모든 스테이지 설정 조회
        async getAll() {
            try {
                const client = getSupabaseClient();
                if (!client) {
                    throw new Error('Supabase client not available');
                }
                
                const { data, error } = await client
                    .from('stage_descriptions')
                    .select('*')
                    .order('stage_id', { ascending: true });
                
                if (error) throw error;
                return data || [];
            } catch (error) {
                console.error('Error fetching stage descriptions:', error);
                return [];
            }
        },

        // 특정 스테이지 설정 조회
        async get(stageId) {
            try {
                const client = getSupabaseClient();
                if (!client) {
                    throw new Error('Supabase client not available');
                }
                
                const { data, error } = await client
                    .from('stage_descriptions')
                    .select('*')
                    .eq('stage_id', stageId)
                    .single();
                
                if (error) throw error;
                return data;
            } catch (error) {
                console.error('Error fetching stage description:', error);
                return null;
            }
        },

        // 스테이지 설정 저장/업데이트
        async upsert(stageData) {
            try {
                // ID가 없으면 생성
                if (!stageData.id) {
                    stageData.id = `stage_${stageData.stage_id}`;
                }
                
                const client = getSupabaseClient();
                if (!client) {
                    throw new Error('Supabase client not available');
                }
                
                const { data, error } = await client
                    .from('stage_descriptions')
                    .upsert(stageData, {
                        onConflict: 'stage_id',
                        ignoreDuplicates: false
                    })
                    .select()
                    .single();
                
                if (error) throw error;
                return data;
            } catch (error) {
                console.error('Error upserting stage description:', error);
                return null;
            }
        },

        // 스테이지 설정 삭제
        async delete(stageId) {
            try {
                const client = getSupabaseClient();
                if (!client) {
                    throw new Error('Supabase client not available');
                }
                
                const { error } = await client
                    .from('stage_descriptions')
                    .delete()
                    .eq('stage_id', stageId);
                
                if (error) throw error;
                return true;
            } catch (error) {
                console.error('Error deleting stage description:', error);
                return false;
            }
        }
    },

    // ========== 포인트 히스토리 ==========
    pointHistory: {
        // 히스토리 추가
        async add(historyData) {
            try {
                if (!historyData.id) {
                    historyData.id = `${historyData.student_id}_${Date.now()}`;
                }
                
                const client = getSupabaseClient();
                if (!client) {
                    throw new Error('Supabase client not available');
                }
                
                const { data, error } = await client
                    .from('point_history')
                    .insert(historyData)
                    .select()
                    .single();
                
                if (error) throw error;
                return data;
            } catch (error) {
                console.error('Error adding point history:', error);
                // localStorage 폴백
                const history = JSON.parse(localStorage.getItem('pointHistory') || '[]');
                history.push(historyData);
                localStorage.setItem('pointHistory', JSON.stringify(history));
                return historyData;
            }
        },

        // 학생별 히스토리 조회
        async getByStudent(studentId, limit = 50) {
            try {
                const client = getSupabaseClient();
                if (!client) {
                    throw new Error('Supabase client not available');
                }
                
                const { data, error } = await client
                    .from('point_history')
                    .select('*')
                    .eq('student_id', studentId)
                    .order('activity_time', { ascending: false })
                    .limit(limit);
                
                if (error) throw error;
                return data || [];
            } catch (error) {
                console.error('Error fetching point history:', error);
                return [];
            }
        },

        // 히스토리 삭제
        async delete(historyId) {
            try {
                const client = getSupabaseClient();
                if (!client) {
                    throw new Error('Supabase client not available');
                }
                
                const { error } = await client
                    .from('point_history')
                    .delete()
                    .eq('id', historyId);
                
                if (error) throw error;
                return true;
            } catch (error) {
                console.error('Error deleting point history:', error);
                return false;
            }
        }
    },

    // ========== 역할 배정 ==========
    assignments: {
        // 역할 조회
        async get(studentId = null, sessionId = null) {
            try {
                const client = getSupabaseClient();
                if (!client) {
                    throw new Error('Supabase client not available');
                }
                
                let query = client
                    .from('assignments')
                    .select('*');
                
                if (studentId) {
                    query = query.eq('student_id', studentId);
                }
                
                if (sessionId) {
                    query = query.eq('session_id', sessionId);
                }
                
                const { data, error } = await query
                    .eq('status', 'active')
                    .order('assigned_at', { ascending: false });
                
                if (error) throw error;
                return data || [];
            } catch (error) {
                console.error('Error fetching assignments:', error);
                return [];
            }
        },

        // 역할 배정
        async create(assignmentData) {
            try {
                if (!assignmentData.id) {
                    assignmentData.id = `assign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                }
                
                const client = getSupabaseClient();
                if (!client) {
                    throw new Error('Supabase client not available');
                }
                
                const { data, error } = await client
                    .from('assignments')
                    .insert(assignmentData)
                    .select()
                    .single();
                
                if (error) throw error;
                return data;
            } catch (error) {
                console.error('Error creating assignment:', error);
                return null;
            }
        },

        // 모든 역할 조회 (학생용)
        async list() {
            return this.get();
        },
        
        // 역할 업데이트
        async update(assignmentId, updateData) {
            try {
                const client = getSupabaseClient();
                if (!client) {
                    throw new Error('Supabase client not available');
                }
                
                const { data, error } = await client
                    .from('assignments')
                    .update(updateData)
                    .eq('id', assignmentId)
                    .select()
                    .single();
                
                if (error) throw error;
                return data;
            } catch (error) {
                console.error('Error updating assignment:', error);
                return null;
            }
        }
    },

    // ========== 메시지 ==========
    messages: {
        // 메시지 조회
        async get(recipientId = null, limit = 100) {
            try {
                const client = getSupabaseClient();
                if (!client) {
                    throw new Error('Supabase client not available');
                }
                
                let query = client
                    .from('teacher_messages')
                    .select('*');
                
                if (recipientId) {
                    // 받은 메시지와 보낸 메시지 모두 조회
                    query = query.or(`recipient_id.eq.${recipientId},sender_id.eq.${recipientId}`);
                }
                
                const { data, error } = await query
                    .order('sent_at', { ascending: false })
                    .limit(limit);
                
                if (error) throw error;
                return data || [];
            } catch (error) {
                console.error('Error fetching messages:', error);
                return [];
            }
        },

        // 메시지 전송
        async send(messageData) {
            try {
                if (!messageData.id) {
                    messageData.id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                }
                
                const client = getSupabaseClient();
                if (!client) {
                    throw new Error('Supabase client not available');
                }
                
                const { data, error } = await client
                    .from('teacher_messages')
                    .insert(messageData)
                    .select()
                    .single();
                
                if (error) throw error;
                return data;
            } catch (error) {
                console.error('Error sending message:', error);
                return null;
            }
        },

        // 메시지 읽음 처리
        async markAsRead(messageId) {
            try {
                const client = getSupabaseClient();
                if (!client) {
                    throw new Error('Supabase client not available');
                }
                
                const { data, error } = await client
                    .from('teacher_messages')
                    .update({ 
                        is_read: true, 
                        read_at: new Date().toISOString() 
                    })
                    .eq('id', messageId)
                    .select()
                    .single();
                
                if (error) throw error;
                return data;
            } catch (error) {
                console.error('Error marking message as read:', error);
                return null;
            }
        }
    },

    // ========== 설정 관련 ==========
    config: {
        // 스테이지 설정 조회
        async getStageConfig() {
            try {
                const client = getSupabaseClient();
                if (!client) {
                    throw new Error('Supabase client not available');
                }
                
                const { data, error } = await client
                    .from('stage_config')
                    .select('*')
                    .single();
                
                if (error && error.code === 'PGRST116') {
                    // 설정이 없는 경우 기본값
                    return {
                        stage1: '김밥말기',
                        stage2: '김밥썰기',
                        stage3: '김밥추가'
                    };
                }
                
                if (error) throw error;
                return data;
            } catch (error) {
                console.error('Error fetching stage config:', error);
                return null;
            }
        },

        // 스테이지 설정 저장
        async saveStageConfig(configData) {
            try {
                if (!configData.id) {
                    configData.id = 'default';
                }
                
                const client = getSupabaseClient();
                if (!client) {
                    throw new Error('Supabase client not available');
                }
                
                const { data, error } = await client
                    .from('stage_config')
                    .upsert(configData, {
                        onConflict: 'id',
                        ignoreDuplicates: false
                    })
                    .select()
                    .single();
                
                if (error) throw error;
                return data;
            } catch (error) {
                console.error('Error saving stage config:', error);
                return null;
            }
        },

        // 게시판 내용 조회
        async getBoardContent(boardType) {
            try {
                const client = getSupabaseClient();
                if (!client) {
                    throw new Error('Supabase client not available');
                }
                
                const { data, error } = await client
                    .from('board_content')
                    .select('*')
                    .eq('board_type', boardType)
                    .single();
                
                if (error && error.code === 'PGRST116') {
                    return null; // 내용 없음
                }
                
                if (error) throw error;
                return data;
            } catch (error) {
                console.error('Error fetching board content:', error);
                return null;
            }
        },

        // 게시판 내용 저장
        async saveBoardContent(boardType, content) {
            try {
                const client = getSupabaseClient();
                if (!client) {
                    throw new Error('Supabase client not available');
                }
                
                const { data, error } = await client
                    .from('board_content')
                    .upsert({
                        board_type: boardType,
                        content: content,
                        updated_at: new Date().toISOString()
                    }, {
                        onConflict: 'board_type',
                        ignoreDuplicates: false
                    })
                    .select()
                    .single();
                
                if (error) throw error;
                return data;
            } catch (error) {
                console.error('Error saving board content:', error);
                return null;
            }
        },

        // ========== 일반적인 설정 값 관리 ==========
        
        // 설정 값 조회 (spinner_lists 등)
        async get(configKey) {
            try {
                console.log(`[supabaseAPI.config.get] ${configKey} 조회 시작`);
                
                const client = getSupabaseClient();
                if (!client) {
                    throw new Error('Supabase client not available');
                }
                
                const { data, error } = await client
                    .from('config')
                    .select('config_value')
                    .eq('config_key', configKey)
                    .single();
                
                if (error) {
                    if (error.code === 'PGRST116') {
                        // 데이터가 없는 경우
                        console.log(`[supabaseAPI.config.get] ${configKey} 데이터 없음`);
                        return null;
                    }
                    throw error;
                }
                
                // JSON 파싱 시도
                if (data && data.config_value) {
                    try {
                        const parsedValue = JSON.parse(data.config_value);
                        console.log(`[supabaseAPI.config.get] ${configKey} 조회 성공:`, parsedValue.length || 'N/A', '개 항목');
                        return parsedValue;
                    } catch (parseError) {
                        console.warn(`[supabaseAPI.config.get] ${configKey} JSON 파싱 실패:`, parseError);
                        return data.config_value; // 원본 문자열 반환
                    }
                }
                
                return null;
            } catch (error) {
                console.error(`[supabaseAPI.config.get] ${configKey} 조회 실패:`, error);
                throw error;
            }
        },

        // 설정 값 저장 (spinner_lists 등)
        async set(configKey, configValue) {
            try {
                console.log(`[supabaseAPI.config.set] ${configKey} 저장 시작`);
                
                // 값을 JSON 문자열로 변환
                let jsonValue;
                if (typeof configValue === 'string') {
                    jsonValue = configValue;
                } else {
                    jsonValue = JSON.stringify(configValue);
                }
                
                const client = getSupabaseClient();
                if (!client) {
                    throw new Error('Supabase client not available');
                }
                
                const { data, error } = await client
                    .from('config')
                    .upsert({
                        config_key: configKey,
                        config_value: jsonValue,
                        updated_at: new Date().toISOString()
                    }, {
                        onConflict: 'config_key',
                        ignoreDuplicates: false
                    })
                    .select()
                    .single();
                
                if (error) throw error;
                
                console.log(`[supabaseAPI.config.set] ${configKey} 저장 성공`);
                return data;
            } catch (error) {
                console.error(`[supabaseAPI.config.set] ${configKey} 저장 실패:`, error);
                throw error;
            }
        }
    },

    // ========== 우리반 포인트 API ==========
    classDailyGoals: {
        // 특정 학급의 일일 목표 포인트 조회
        async getGoal(className, date = null) {
            try {
                const targetDate = date || new Date().toISOString().split('T')[0];
                console.log(`[supabaseAPI.classDailyGoals.getGoal] ${className} - ${targetDate} 조회 시작`);
                
                const client = getSupabaseClient();
                if (!client) {
                    throw new Error('Supabase client not available');
                }

                const { data, error } = await client
                    .from('class_daily_goals')
                    .select('*')
                    .eq('class_name', className)
                    .eq('goal_date', targetDate)
                    .single();

                if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
                    throw error;
                }

                console.log(`[supabaseAPI.classDailyGoals.getGoal] ${className} 조회 성공:`, data?.daily_goal_points || 0);
                return data?.daily_goal_points || 0; // 기본값 0
            } catch (error) {
                console.error(`[supabaseAPI.classDailyGoals.getGoal] ${className} 조회 실패:`, error);
                return 0; // 에러시 기본값
            }
        },

        // 특정 학급의 일일 목표 포인트 설정
        async setGoal(className, goalPoints, date = null) {
            try {
                const targetDate = date || new Date().toISOString().split('T')[0];
                console.log(`[supabaseAPI.classDailyGoals.setGoal] ${className} - ${goalPoints}점 설정 시작`);
                
                const client = getSupabaseClient();
                if (!client) {
                    throw new Error('Supabase client not available');
                }

                // UPSERT 방식: 있으면 업데이트, 없으면 삽입
                const { data, error } = await client
                    .from('class_daily_goals')
                    .upsert({
                        class_name: className,
                        daily_goal_points: goalPoints,
                        goal_date: targetDate,
                        updated_at: new Date().toISOString()
                    })
                    .select()
                    .single();

                if (error) throw error;

                console.log(`[supabaseAPI.classDailyGoals.setGoal] ${className} 설정 성공:`, goalPoints);
                return data;
            } catch (error) {
                console.error(`[supabaseAPI.classDailyGoals.setGoal] ${className} 설정 실패:`, error);
                throw error;
            }
        },

        // 모든 학급의 목표 조회 (관리자 대시보드용)
        async getAllGoals(date = null) {
            try {
                const targetDate = date || new Date().toISOString().split('T')[0];
                console.log(`[supabaseAPI.classDailyGoals.getAllGoals] ${targetDate} 전체 조회 시작`);
                
                const client = getSupabaseClient();
                if (!client) {
                    throw new Error('Supabase client not available');
                }

                const { data, error } = await client
                    .from('class_daily_goals')
                    .select('*')
                    .eq('goal_date', targetDate)
                    .order('class_name');

                if (error) throw error;

                console.log(`[supabaseAPI.classDailyGoals.getAllGoals] 조회 성공:`, data?.length || 0, '개 학급');
                return data || [];
            } catch (error) {
                console.error(`[supabaseAPI.classDailyGoals.getAllGoals] 조회 실패:`, error);
                return [];
            }
        }
    },

    // ========== 우리반 일일 포인트 집계 API ==========
    classDailyPoints: {
        // 특정 학급의 오늘 총 포인트 조회
        async getTodayPoints(className, date = null) {
            try {
                // KST 기준 오늘 날짜 계산 (기존 로직 재활용)
                const now = new Date();
                const kstOffset = 9 * 60 * 60 * 1000;
                const targetDate = date || new Date(now.getTime() + kstOffset).toISOString().split('T')[0];
                
                console.log(`[supabaseAPI.classDailyPoints.getTodayPoints] ${className} - ${targetDate} 조회 시작`);
                
                const client = getSupabaseClient();
                if (!client) {
                    throw new Error('Supabase client not available');
                }

                // daily_points 테이블에서 해당 학급의 오늘 포인트 합계
                const { data, error } = await client
                    .from('daily_points')
                    .select('total_points, student_id')
                    .eq('date', targetDate);

                if (error) throw error;

                // 학급별 필터링을 위해 students 테이블과 조인 필요
                const { data: studentsData, error: studentsError } = await client
                    .from('students')
                    .select('id, student_id, full_class')
                    .eq('full_class', className);

                if (studentsError) throw studentsError;

                // 해당 학급 학생들의 student_id 목록
                const classStudentIds = studentsData.map(s => s.student_id);

                // 해당 학급 학생들의 오늘 포인트 합계 계산
                const classPoints = data
                    .filter(point => classStudentIds.includes(point.student_id))
                    .reduce((sum, point) => sum + (point.total_points || 0), 0);

                console.log(`[supabaseAPI.classDailyPoints.getTodayPoints] ${className} 조회 성공: ${classPoints}점`);
                return classPoints;
            } catch (error) {
                console.error(`[supabaseAPI.classDailyPoints.getTodayPoints] ${className} 조회 실패:`, error);
                return 0;
            }
        }
    }
};

// 초기화 함수 자동 실행
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSupabaseClient);
} else {
    initSupabaseClient();
}