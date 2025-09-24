/**
 * WheelCard Component (치즈김밥)
 * 원본 index.html의 돌림판 카드 레이아웃 완전 보존
 * 캔버스 크기: 210x210px, height: 220px (원본과 동일)
 */

import { useState, useEffect, useRef } from 'react';

export default function WheelCard() {
  const [wheelItems, setWheelItems] = useState('1번\n2번\n3번\n4번\n5번');
  const [pickCount, setPickCount] = useState(1);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 돌림판 그리기
  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const items = wheelItems.split('\n').filter(item => item.trim());
    if (items.length === 0) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 100;
    const anglePerItem = (2 * Math.PI) / items.length;

    // 배경 지우기
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 색상 배열
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];

    // 돌림판 섹션 그리기
    items.forEach((item, index) => {
      const startAngle = index * anglePerItem;
      const endAngle = (index + 1) * anglePerItem;
      const color = colors[index % colors.length];

      // 섹션 그리기
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 텍스트 그리기
      const textAngle = startAngle + anglePerItem / 2;
      const textX = centerX + Math.cos(textAngle) * (radius * 0.7);
      const textY = centerY + Math.sin(textAngle) * (radius * 0.7);

      ctx.save();
      ctx.translate(textX, textY);
      ctx.rotate(textAngle + Math.PI / 2);
      ctx.fillStyle = '#333';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(item.trim(), 0, 0);
      ctx.restore();
    });

    // 중앙 원 그리기
    ctx.beginPath();
    ctx.arc(centerX, centerY, 15, 0, 2 * Math.PI);
    ctx.fillStyle = '#333';
    ctx.fill();

    // 화살표 그리기 (상단 고정)
    ctx.beginPath();
    ctx.moveTo(centerX, 10);
    ctx.lineTo(centerX - 10, 25);
    ctx.lineTo(centerX + 10, 25);
    ctx.closePath();
    ctx.fillStyle = '#333';
    ctx.fill();
  };

  useEffect(() => {
    drawWheel();
  }, [wheelItems]);

  const spinWheel = () => {
    const items = wheelItems.split('\n').filter(item => item.trim());
    if (items.length === 0) {
      alert('돌림판 항목을 입력해주세요.');
      return;
    }

    if (pickCount < 1 || pickCount > items.length) {
      alert(`뽑는 갯수는 1개 이상 ${items.length}개 이하로 설정해주세요.`);
      return;
    }

    console.log('🎡 [WheelCard] 돌림판 시작');
    setIsSpinning(true);

    // 애니메이션 효과
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.classList.add('spinning');
    }

    // 3초 후 결과 표시
    setTimeout(() => {
      // 랜덤 선택
      const shuffled = [...items].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, pickCount);
      
      setSelectedItems(selected);
      setIsSpinning(false);

      if (canvas) {
        canvas.classList.remove('spinning');
      }

      // 결과 알림
      const resultMessage = selected.length === 1 
        ? `선택된 항목: ${selected[0]}`
        : `선택된 항목들: ${selected.join(', ')}`;
      
      console.log('🎯 [WheelCard] 돌림판 결과:', selected);
      alert(resultMessage);

    }, 3000);
  };

  const clearWheel = () => {
    console.log('🧹 [WheelCard] 돌림판 초기화');
    setWheelItems('');
    setSelectedItems([]);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 flex flex-col justify-between">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-3">
          <i className="fas fa-dice text-3xl text-yellow-600"></i>
        </div>
        <h2 className="text-xl font-bold text-gray-800">🧀 치즈김밥</h2>
      </div>

      {/* 항목 입력 영역 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-gray-700">돌림판 항목</label>
          <div className="flex space-x-1">
            <select className="text-xs border rounded px-2 py-1 max-w-20">
              <option value="">불러오기</option>
            </select>
            <button className="text-xs text-blue-600 hover:text-blue-800">
              <i className="fas fa-sync-alt"></i>
            </button>
          </div>
        </div>
        <textarea 
          value={wheelItems}
          onChange={(e) => setWheelItems(e.target.value)}
          placeholder="항목을 입력하세요 (한 줄에 하나씩)&#10;예:&#10;1번&#10;2번&#10;3번" 
          className="w-full px-2 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-xs"
          rows={3}
        />
        <div className="mt-1 flex space-x-2">
          <button 
            onClick={clearWheel}
            className="flex-1 bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-300"
          >
            <i className="fas fa-eraser mr-1"></i>초기화
          </button>
        </div>
      </div>

      {/* 뽑는 갯수 입력 */}
      <div className="mb-4">
        <label className="text-xs font-semibold text-gray-700 block mb-2">뽑는 갯수</label>
        <input 
          type="number" 
          min="1" 
          max="10" 
          value={pickCount}
          onChange={(e) => setPickCount(parseInt(e.target.value) || 1)}
          className="w-full px-2 py-1 border rounded text-xs text-center"
          placeholder="뽑을 개수를 입력하세요"
        />
      </div>

      {/* 돌림판 영역 - 원본과 완전 동일한 크기 */}
      <div className="relative mb-8" style={{ height: '220px' }}>
        <canvas 
          ref={canvasRef}
          width="210" 
          height="210" 
          className="mx-auto cursor-pointer"
          style={{ display: 'block' }}
          onClick={!isSpinning ? spinWheel : undefined}
        />
        {selectedItems.length > 0 && !isSpinning && (
          <div className="absolute bottom-0 left-0 right-0 bg-yellow-100 rounded-lg p-2 text-xs text-center">
            <strong>결과:</strong> {selectedItems.join(', ')}
          </div>
        )}
      </div>

      {/* 돌리기 버튼 */}
      <button 
        onClick={spinWheel}
        disabled={isSpinning}
        className={`w-full font-bold py-2 rounded-lg transition transform hover:scale-105 text-sm mb-0 ${
          isSpinning 
            ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
            : 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white hover:opacity-90'
        }`}
      >
        <i className={`fas ${isSpinning ? 'fa-spinner fa-spin' : 'fa-sync-alt'} mr-2`}></i>
        {isSpinning ? '돌리는 중...' : '돌리기!'}
      </button>
    </div>
  );
}