// Supabase 설정 파일
const SUPABASE_URL = 'https://xzhbhrhihtfkuvcltpsw.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6aGJocmhpaHRma3V2Y2x0cHN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3NjYyNzEsImV4cCI6MjA3MzM0MjI3MX0.hvHQV0O6SjWgzDyI7WkZC74Mude9dtssqqA4B4_Iqcw';

// Supabase 클라이언트 초기화 (CDN 방식)
let supabase = null;

// Supabase 초기화 함수
function initSupabase() {
    try {
        if (typeof window.supabase !== 'undefined') {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('[Config] Supabase initialized successfully');
            return true;
        }
        console.warn('[Config] window.supabase not available');
        return false;
    } catch (error) {
        console.error('[Config] Supabase initialization error:', error);
        return false;
    }
}

// 즉시 초기화 시도
if (typeof window !== 'undefined') {
    console.log('[Config] Attempting immediate Supabase initialization...');
    initSupabase();
}

// 데이터베이스 API 래퍼 함수들
const dbAPI = {
    // 학생 관련
    students: {
        async getAll() {
            try {
                const { data, error } = await supabase
                    .from('students')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (error) throw error;
                return { success: true, data };
            } catch (error) {
                console.error('Error fetching students:', error);
                // 폴백: localStorage 사용
                const localData = localStorage.getItem('students');
                return { success: false, data: localData ? JSON.parse(localData) : [] };
            }
        },

        async create(student) {
            try {
                const { data, error } = await supabase
                    .from('students')
                    .insert([{
                        student_id: student.studentId,
                        name: student.name,
                        grade: student.grade,
                        class_num: student.classNum,
                        number: student.number,
                        full_class: student.fullClass
                    }])
                    .select()
                    .single();
                
                if (error) throw error;
                
                // 로컬 백업
                this.saveToLocal(student);
                return { success: true, data };
            } catch (error) {
                console.error('Error creating student:', error);
                // 폴백: localStorage에만 저장
                this.saveToLocal(student);
                return { success: false, data: student };
            }
        },

        async findByStudentId(studentId) {
            try {
                const { data, error } = await supabase
                    .from('students')
                    .select('*')
                    .eq('student_id', studentId)
                    .single();
                
                if (error && error.code !== 'PGRST116') throw error;
                return { success: true, data };
            } catch (error) {
                console.error('Error finding student:', error);
                // 폴백: localStorage에서 찾기
                const students = JSON.parse(localStorage.getItem('students') || '[]');
                const student = students.find(s => s.studentId === studentId);
                return { success: false, data: student };
            }
        },

        saveToLocal(student) {
            const students = JSON.parse(localStorage.getItem('students') || '[]');
            const index = students.findIndex(s => s.studentId === student.studentId);
            if (index >= 0) {
                students[index] = student;
            } else {
                students.push(student);
            }
            localStorage.setItem('students', JSON.stringify(students));
        }
    },

    // 세션(미션) 관련
    sessions: {
        async getAll() {
            try {
                const { data, error } = await supabase
                    .from('sessions')
                    .select('*')
                    .eq('status', 'active')
                    .order('created_at', { ascending: false });
                
                if (error) throw error;
                return { success: true, data };
            } catch (error) {
                console.error('Error fetching sessions:', error);
                const localData = localStorage.getItem('sessions');
                return { success: false, data: localData ? JSON.parse(localData) : [] };
            }
        },

        async create(session) {
            try {
                const { data, error } = await supabase
                    .from('sessions')
                    .insert([{
                        name: session.name,
                        type: session.type,
                        missions: session.missions,
                        target_class: session.targetClass,
                        status: session.status || 'active'
                    }])
                    .select()
                    .single();
                
                if (error) throw error;
                
                this.saveToLocal(session);
                return { success: true, data };
            } catch (error) {
                console.error('Error creating session:', error);
                this.saveToLocal(session);
                return { success: false, data: session };
            }
        },

        async update(id, updates) {
            try {
                const { data, error } = await supabase
                    .from('sessions')
                    .update(updates)
                    .eq('id', id)
                    .select()
                    .single();
                
                if (error) throw error;
                return { success: true, data };
            } catch (error) {
                console.error('Error updating session:', error);
                return { success: false, error };
            }
        },

        async delete(id) {
            try {
                const { error } = await supabase
                    .from('sessions')
                    .delete()
                    .eq('id', id);
                
                if (error) throw error;
                return { success: true };
            } catch (error) {
                console.error('Error deleting session:', error);
                return { success: false, error };
            }
        },

        saveToLocal(session) {
            const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
            const index = sessions.findIndex(s => s.id === session.id);
            if (index >= 0) {
                sessions[index] = session;
            } else {
                sessions.push(session);
            }
            localStorage.setItem('sessions', JSON.stringify(sessions));
        }
    },

    // 역할 배정 관련
    assignments: {
        async getAll() {
            try {
                const { data, error } = await supabase
                    .from('assignments')
                    .select('*')
                    .order('assigned_at', { ascending: false });
                
                if (error) throw error;
                return { success: true, data };
            } catch (error) {
                console.error('Error fetching assignments:', error);
                const localData = localStorage.getItem('assignments');
                return { success: false, data: localData ? JSON.parse(localData) : [] };
            }
        },

        async getByStudentId(studentId) {
            try {
                const { data, error } = await supabase
                    .from('assignments')
                    .select('*')
                    .eq('student_id', studentId)
                    .order('assigned_at', { ascending: false })
                    .limit(1);
                
                if (error) throw error;
                return { success: true, data: data[0] || null };
            } catch (error) {
                console.error('Error fetching student assignment:', error);
                const assignments = JSON.parse(localStorage.getItem('assignments') || '[]');
                const assignment = assignments.find(a => a.studentId === studentId);
                return { success: false, data: assignment };
            }
        },

        async create(assignment) {
            try {
                const { data, error } = await supabase
                    .from('assignments')
                    .insert([{
                        session_id: assignment.sessionId,
                        student_id: assignment.studentId,
                        student_name: assignment.studentName,
                        role_name: assignment.roleName,
                        role_content: assignment.roleContent,
                        checked: false
                    }])
                    .select()
                    .single();
                
                if (error) throw error;
                
                this.saveToLocal(assignment);
                return { success: true, data };
            } catch (error) {
                console.error('Error creating assignment:', error);
                this.saveToLocal(assignment);
                return { success: false, data: assignment };
            }
        },

        async bulkCreate(assignments) {
            try {
                const { data, error } = await supabase
                    .from('assignments')
                    .insert(assignments.map(a => ({
                        session_id: a.sessionId,
                        student_id: a.studentId,
                        student_name: a.studentName,
                        role_name: a.roleName,
                        role_content: a.roleContent,
                        checked: false
                    })))
                    .select();
                
                if (error) throw error;
                
                // 로컬 백업
                assignments.forEach(a => this.saveToLocal(a));
                return { success: true, data };
            } catch (error) {
                console.error('Error bulk creating assignments:', error);
                assignments.forEach(a => this.saveToLocal(a));
                return { success: false, data: assignments };
            }
        },

        async deleteBySessionId(sessionId) {
            try {
                const { error } = await supabase
                    .from('assignments')
                    .delete()
                    .eq('session_id', sessionId);
                
                if (error) throw error;
                return { success: true };
            } catch (error) {
                console.error('Error deleting assignments:', error);
                return { success: false, error };
            }
        },

        saveToLocal(assignment) {
            const assignments = JSON.parse(localStorage.getItem('assignments') || '[]');
            const index = assignments.findIndex(a => 
                a.studentId === assignment.studentId && 
                a.sessionId === assignment.sessionId
            );
            if (index >= 0) {
                assignments[index] = assignment;
            } else {
                assignments.push(assignment);
            }
            localStorage.setItem('assignments', JSON.stringify(assignments));
        }
    },

    // 백업 및 복원
    backup: {
        async exportAll() {
            const students = await dbAPI.students.getAll();
            const sessions = await dbAPI.sessions.getAll();
            const assignments = await dbAPI.assignments.getAll();
            
            const backup = {
                students: students.data,
                sessions: sessions.data,
                assignments: assignments.data,
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            };
            
            return backup;
        },

        async importAll(backupData) {
            try {
                // 학생 데이터 복원
                if (backupData.students && backupData.students.length > 0) {
                    for (const student of backupData.students) {
                        await dbAPI.students.create(student);
                    }
                }
                
                // 세션 데이터 복원
                if (backupData.sessions && backupData.sessions.length > 0) {
                    for (const session of backupData.sessions) {
                        await dbAPI.sessions.create(session);
                    }
                }
                
                // 배정 데이터 복원
                if (backupData.assignments && backupData.assignments.length > 0) {
                    for (const assignment of backupData.assignments) {
                        await dbAPI.assignments.create(assignment);
                    }
                }
                
                return { success: true };
            } catch (error) {
                console.error('Error importing backup:', error);
                return { success: false, error };
            }
        }
    }
};

// 초기화 시도
document.addEventListener('DOMContentLoaded', () => {
    // Supabase 스크립트 로드 후 초기화
    setTimeout(() => {
        if (initSupabase()) {
            console.log('Database API ready with Supabase');
        } else {
            console.log('Running in offline mode with localStorage');
        }
    }, 1000);
});