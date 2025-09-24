import React from 'react';

interface Message {
  id: string;
  from: string;
  subject: string;
  content: string;
  timestamp: Date;
  read: boolean;
}

interface TeacherMessagesCardProps {
  messages: Message[];
  unreadCount?: number;
  onViewMessages?: () => void;
  onMarkAsRead?: (messageId: string) => void;
}

const TeacherMessagesCard: React.FC<TeacherMessagesCardProps> = ({
  messages,
  unreadCount = 0,
  onViewMessages
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col min-h-[200px]">
      {/* 헤더 */}
      <h3 className="text-gray-700 font-medium mb-6 flex items-center">
        <span className="mr-2 relative">
          ✉️
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              {unreadCount}
            </div>
          )}
        </span>
        선생님 쪽지함
      </h3>
      
      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 flex items-center justify-center">
        {messages.length === 0 && (
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">받은 메시지가 없습니다</p>
          </div>
        )}
        
        {messages.length > 0 && (
          <div className="w-full">
            <div className="space-y-2 mb-4 max-h-24 overflow-y-auto">
              {messages.slice(0, 2).map((message) => (
                <div 
                  key={message.id} 
                  className={`p-2 rounded border ${
                    message.read 
                      ? 'bg-gray-50 border-gray-200' 
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-xs text-gray-600">{message.from}</span>
                    <span className="text-xs text-gray-400">
                      {message.timestamp.toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 truncate">{message.subject}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* 하단 버튼 영역 */}
      <button
        onClick={onViewMessages}
        className="w-full bg-pink-500 text-white py-2 px-4 rounded-lg hover:bg-pink-600 transition-colors text-sm font-medium mt-4"
      >
        쪽지 메시지 보기
      </button>
    </div>
  );
};

export default TeacherMessagesCard;