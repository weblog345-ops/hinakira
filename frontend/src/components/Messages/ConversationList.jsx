const ConversationList = ({ conversations, selectedUserId, onSelectUser }) => {
  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>メッセージがありません</p>
        <p className="text-sm mt-2">新しいメッセージを送信してみましょう</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {conversations.map((conv) => (
        <button
          key={conv.user.id}
          onClick={() => onSelectUser(conv.user)}
          className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
            selectedUserId === conv.user.id ? 'bg-primary-50 border-l-4 border-primary-500' : ''
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-900">{conv.user.name}</h3>
                {conv.user.role === 'ADMIN' && (
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                    管理者
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1 truncate">
                {conv.lastMessage.content}
              </p>
            </div>
            <div className="flex flex-col items-end ml-2">
              <span className="text-xs text-gray-500">
                {new Date(conv.lastMessage.createdAt).toLocaleDateString('ja-JP', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
              {conv.unreadCount > 0 && (
                <span className="mt-1 px-2 py-0.5 bg-primary-500 text-white text-xs font-bold rounded-full">
                  {conv.unreadCount}
                </span>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default ConversationList;
