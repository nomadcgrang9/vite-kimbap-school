/**
 * TimerCard Component (야채김밥)
 * 원본 index.html의 타이머 카드 레이아웃 완전 보존
 */

import { useState, useEffect, useRef } from 'react';

export default function TimerCard() {
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);
  const [displayMinutes, setDisplayMinutes] = useState(5);
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [status, setStatus] = useState('대기 중');
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setDisplaySeconds(prev => {
          if (prev > 0) {
            return prev - 1;
          } else if (displayMinutes > 0) {
            setDisplayMinutes(m => m - 1);
            return 59;
          } else {
            // 타이머 완료
            setIsRunning(false);
            setStatus('시간 종료!');
            // 알림음이나 알림 로직 추가 가능
            return 0;
          }
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused, displayMinutes]);

  const startTimer = () => {
    console.log('⏰ [TimerCard] 타이머 시작');
    setIsRunning(true);
    setIsPaused(false);
    setStatus('진행 중');
  };

  const pauseTimer = () => {
    console.log('⏸️ [TimerCard] 타이머 일시정지');
    setIsPaused(true);
    setStatus('일시정지');
  };

  const resetTimer = () => {
    console.log('🔄 [TimerCard] 타이머 리셋');
    setIsRunning(false);
    setIsPaused(false);
    setDisplayMinutes(minutes);
    setDisplaySeconds(seconds);
    setStatus('대기 중');
  };

  const setQuickTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    setMinutes(mins);
    setSeconds(secs);
    setDisplayMinutes(mins);
    setDisplaySeconds(secs);
    console.log(`⚡ [TimerCard] 빠른 설정: ${totalSeconds}초`);
  };

  // 타이머가 30초 이하일 때 빨간색 표시
  const isEnding = displayMinutes === 0 && displaySeconds <= 30 && displaySeconds > 0;
  const isFinished = displayMinutes === 0 && displaySeconds === 0;

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 flex flex-col justify-between">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-3">
          <i className="fas fa-stopwatch text-3xl text-green-600"></i>
        </div>
        <h2 className="text-xl font-bold text-gray-800">🥕 야채김밥</h2>
      </div>

      {/* 타이머 설정 */}
      <div className="mb-4">
        <div className="flex space-x-2 items-center justify-center">
          <div className="text-center">
            <input 
              type="number" 
              min="0" 
              max="99" 
              value={minutes}
              onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
              className="w-20 px-2 py-2 text-center border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-xl font-bold"
            />
            <p className="text-sm text-gray-500 mt-1 font-semibold">분</p>
          </div>
          <span className="text-3xl font-bold text-gray-400">:</span>
          <div className="text-center">
            <input 
              type="number" 
              min="0" 
              max="59" 
              value={seconds}
              onChange={(e) => setSeconds(parseInt(e.target.value) || 0)}
              className="w-20 px-2 py-2 text-center border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-xl font-bold"
            />
            <p className="text-sm text-gray-500 mt-1 font-semibold">초</p>
          </div>
        </div>
      </div>

      {/* 타이머 디스플레이 */}
      <div className="mb-8 text-center">
        <div 
          className={`timer-display ${isEnding ? 'timer-ending' : 'text-green-600'} ${isFinished ? 'text-red-600' : ''}`}
          style={{ fontSize: '4.5rem' }}
        >
          {String(displayMinutes).padStart(2, '0')}:{String(displaySeconds).padStart(2, '0')}
        </div>
        <div className="text-lg text-gray-500 mt-2 font-semibold">
          {status}
        </div>
      </div>

      {/* 타이머 컨트롤 버튼 */}
      <div className="flex space-x-2 mb-8">
        {!isRunning ? (
          <button 
            onClick={startTimer}
            className="flex-1 bg-green-500 text-white font-bold py-3 rounded-lg hover:bg-green-600 transition text-base"
          >
            <i className="fas fa-play mr-2"></i>시작
          </button>
        ) : (
          <button 
            onClick={pauseTimer}
            className="flex-1 bg-yellow-500 text-white font-bold py-3 rounded-lg hover:bg-yellow-600 transition text-base"
          >
            <i className="fas fa-pause mr-2"></i>일시정지
          </button>
        )}
        <button 
          onClick={resetTimer}
          className="flex-1 bg-gray-500 text-white font-bold py-3 rounded-lg hover:bg-gray-600 transition text-base"
        >
          <i className="fas fa-redo mr-2"></i>리셋
        </button>
      </div>

      {/* 빠른 설정 버튼 */}
      <div className="grid grid-cols-3 gap-2 mb-0">
        <button 
          onClick={() => setQuickTime(20)}
          className="py-3 px-3 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm font-semibold"
        >
          20초
        </button>
        <button 
          onClick={() => setQuickTime(30)}
          className="py-3 px-3 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm font-semibold"
        >
          30초
        </button>
        <button 
          onClick={() => setQuickTime(40)}
          className="py-3 px-3 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm font-semibold"
        >
          40초
        </button>
        <button 
          onClick={() => setQuickTime(50)}
          className="py-3 px-3 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm font-semibold"
        >
          50초
        </button>
        <button 
          onClick={() => setQuickTime(60)}
          className="py-3 px-3 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm font-semibold"
        >
          60초
        </button>
        <button 
          onClick={() => setQuickTime(90)}
          className="py-3 px-3 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm font-semibold"
        >
          90초
        </button>
      </div>
    </div>
  );
}