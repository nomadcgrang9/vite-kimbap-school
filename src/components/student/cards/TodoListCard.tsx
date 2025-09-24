import React from 'react';

interface TodoItem {
  id: string;
  stage: number;
  title: string;
  completed: boolean;
}

interface TodoListCardProps {
  todos: TodoItem[];
  onToggleComplete?: (todoId: string) => void;
  onAddStage?: (stage: number) => void;
}

const TodoListCard: React.FC<TodoListCardProps> = ({
  todos,
  onToggleComplete,
  onAddStage
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* 헤더 */}
      <h3 className="text-gray-700 font-medium mb-4 flex items-center">
        <span className="mr-2">📋</span>
        오늘의 할일
      </h3>
      
      {/* 할일 목록 */}
      <div className="space-y-3">
        {todos.map((todo) => (
          <div key={todo.id} className="flex items-center justify-between">
            <div className="flex items-center">
              <div 
                className={`w-3 h-3 rounded-full mr-3 ${
                  todo.completed ? 'bg-green-500' : 'bg-purple-500'
                }`}
              ></div>
              <span className="text-gray-600 text-sm">{todo.stage}단계</span>
            </div>
            <button
              className={`px-3 py-1 rounded-md text-xs text-white font-medium ${
                todo.completed 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-purple-500 hover:bg-purple-600'
              }`}
              onClick={() => {
                if (todo.completed && onToggleComplete) {
                  onToggleComplete(todo.id);
                } else if (!todo.completed && onAddStage) {
                  onAddStage(todo.stage);
                }
              }}
            >
              {todo.completed ? '완료함' : '추가하기'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TodoListCard;