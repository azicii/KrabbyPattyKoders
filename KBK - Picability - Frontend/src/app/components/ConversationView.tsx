import { ArrowLeft, Sun, Moon, Send, Camera } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { ActiveStreak } from './StreaksDisplay';

interface Message {
  id: number;
  sender: 'user' | 'friend';
  type: 'text' | 'image';
  content: string;
  timestamp: string;
}

interface ConversationViewProps {
  isDark: boolean;
  streak: ActiveStreak;
  onToggleDark: () => void;
  onBack: () => void;
}

export function ConversationView({
  isDark,
  streak,
  onToggleDark,
  onBack
}: ConversationViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (messageText.trim()) {
      const newMessage: Message = {
        id: messages.length + 1,
        sender: 'user',
        type: 'text',
        content: messageText,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      };
      setMessages([...messages, newMessage]);
      setMessageText('');
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setShowImagePreview(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendImage = () => {
    if (selectedImage) {
      const newMessage: Message = {
        id: messages.length + 1,
        sender: 'user',
        type: 'image',
        content: selectedImage,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      };
      setMessages([...messages, newMessage]);
      setSelectedImage(null);
      setShowImagePreview(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      isDark
        ? 'bg-gradient-to-br from-slate-900 to-slate-800'
        : 'bg-gradient-to-br from-slate-50 to-slate-100'
    }`}>
      <div className={`sticky top-0 z-10 p-4 border-b backdrop-blur-sm ${
        isDark
          ? 'bg-slate-900/80 border-slate-700'
          : 'bg-white/80 border-slate-200'
      }`}>
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className={`flex items-center justify-center w-10 h-10 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-750'
                  : 'bg-white'
              }`}
            >
              <ArrowLeft className={`w-5 h-5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`} />
            </button>

            <div className={`flex items-center justify-center w-12 h-12 rounded-2xl text-white bg-gradient-to-br ${streak.color}`}>
              {streak.friendAvatar}
            </div>

            <div>
              <h2 className={`${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                {streak.friendName}
              </h2>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {streak.habitName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`flex flex-col items-center px-3 py-1.5 rounded-xl bg-gradient-to-br ${streak.color}`}>
              <span className="text-lg text-white">
                {streak.currentStreak}
              </span>
              <span className="text-xs text-white/90">
                day{streak.currentStreak !== 1 ? 's' : ''}
              </span>
            </div>

            <button
              onClick={onToggleDark}
              className={`flex items-center justify-center w-10 h-10 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-750'
                  : 'bg-white'
              }`}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4 pb-4">
          <div className="flex items-center justify-center my-6">
            <div className={`px-4 py-1.5 rounded-full text-xs ${
              isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'
            }`}>
              Today
            </div>
          </div>

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-end gap-2 max-w-[70%] ${
                message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}>
                {message.sender === 'friend' && (
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs bg-gradient-to-br ${streak.color}`}>
                    {streak.friendAvatar}
                  </div>
                )}

                <div className="flex flex-col">
                  {message.type === 'text' ? (
                    <div className={`rounded-2xl px-4 py-2.5 ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white rounded-br-md'
                        : isDark
                        ? 'bg-slate-800 text-slate-100 rounded-bl-md'
                        : 'bg-white text-slate-800 rounded-bl-md shadow-sm'
                    }`}>
                      <p className="text-sm break-words">{message.content}</p>
                    </div>
                  ) : (
                    <div className="rounded-2xl overflow-hidden shadow-lg">
                      <img
                        src={message.content}
                        alt="Shared"
                        className="w-full max-w-xs h-auto object-cover"
                      />
                    </div>
                  )}
                  <span className={`text-xs mt-1 ${
                    message.sender === 'user' ? 'text-right' : 'text-left'
                  } ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {message.timestamp}
                  </span>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className={`sticky bottom-0 p-4 border-t backdrop-blur-sm ${
        isDark
          ? 'bg-slate-900/80 border-slate-700'
          : 'bg-white/80 border-slate-200'
      }`}>
        <div className="max-w-4xl mx-auto">
          <div className={`flex items-end gap-2 rounded-2xl p-3 ${
            isDark ? 'bg-slate-800' : 'bg-slate-100'
          }`}>
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 hover:scale-105 ${
                isDark
                  ? 'bg-slate-700 hover:bg-slate-600'
                  : 'bg-white hover:bg-slate-200'
              }`}
            >
              <Camera className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />

            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              rows={1}
              className={`flex-1 bg-transparent resize-none outline-none px-3 py-2 max-h-32 ${
                isDark
                  ? 'text-slate-100 placeholder-slate-400'
                  : 'text-slate-800 placeholder-slate-500'
              }`}
            />

            <button
              onClick={handleSendMessage}
              disabled={!messageText.trim()}
              className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${
                messageText.trim()
                  ? 'bg-gradient-to-br from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 hover:scale-105'
                  : isDark
                  ? 'bg-slate-700'
                  : 'bg-slate-200'
              }`}
            >
              <Send className={`w-5 h-5 ${
                messageText.trim() ? 'text-white' : isDark ? 'text-slate-500' : 'text-slate-400'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {showImagePreview && selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`relative w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden ${
            isDark ? 'bg-slate-800' : 'bg-white'
          }`}>
            <div className={`p-4 border-b flex items-center justify-between ${
              isDark ? 'border-slate-700' : 'border-slate-200'
            }`}>
              <h3 className={`${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                Send Photo
              </h3>
              <button
                onClick={() => {
                  setShowImagePreview(false);
                  setSelectedImage(null);
                }}
                className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 hover:scale-105 ${
                  isDark
                    ? 'bg-slate-700 hover:bg-slate-600'
                    : 'bg-slate-100 hover:bg-slate-200'
                }`}
              >
                <span className={`text-lg ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>×</span>
              </button>
            </div>

            <div className="p-4">
              <img
                src={selectedImage}
                alt="Preview"
                className="w-full h-auto max-h-96 object-contain rounded-2xl"
              />
            </div>

            <div className="p-4 flex gap-3">
              <button
                onClick={() => {
                  setShowImagePreview(false);
                  setSelectedImage(null);
                }}
                className={`flex-1 py-3 px-4 rounded-xl transition-all duration-200 ${
                  isDark
                    ? 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSendImage}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white transition-all duration-200 hover:scale-105"
              >
                Send Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
