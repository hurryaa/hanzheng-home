import { useState, useEffect } from 'react';

export function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '?' && e.shiftKey) {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen]);

  const shortcuts = [
    { keys: ['Alt', 'H'], description: '前往工作台' },
    { keys: ['Alt', 'D'], description: '前往仪表板' },
    { keys: ['Alt', 'M'], description: '前往会员管理' },
    { keys: ['Alt', 'A'], description: '前往预约管理' },
    { keys: ['Alt', 'C'], description: '前往消费管理' },
    { keys: ['Alt', 'R'], description: '前往会员充值' },
    { keys: ['Alt', 'T'], description: '前往次卡管理' },
    { keys: ['Alt', 'S'], description: '前往系统设置' },
    { keys: ['Alt', 'P'], description: '前往个人资料' },
    { keys: ['Ctrl', '/'], description: '聚焦搜索框' },
    { keys: ['Shift', '?'], description: '显示/隐藏快捷键' }
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all duration-300 flex items-center justify-center z-40 group"
        title="键盘快捷键 (Shift + ?)"
        aria-label="显示键盘快捷键"
      >
        <i className="fa-solid fa-keyboard text-xl"></i>
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
          ?
        </span>
      </button>
    );
  }

  return (
    <>
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 animate-fadeIn"
        onClick={() => setIsOpen(false)}
      />

      {/* 对话框 */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-scaleIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 标题 */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <i className="fa-solid fa-keyboard text-2xl mr-3"></i>
              <h2 className="text-xl font-bold">键盘快捷键</h2>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors duration-200"
              aria-label="关闭"
            >
              <i className="fa-solid fa-times"></i>
            </button>
          </div>

          {/* 内容 */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            <p className="text-gray-600 mb-6">
              使用以下快捷键可以快速导航和执行操作
            </p>

            <div className="space-y-3">
              {shortcuts.map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <span className="text-gray-700 font-medium">{shortcut.description}</span>
                  <div className="flex items-center space-x-1">
                    {shortcut.keys.map((key, keyIndex) => (
                      <span key={keyIndex} className="flex items-center">
                        <kbd className="px-3 py-1.5 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-mono font-semibold text-gray-700">
                          {key}
                        </kbd>
                        {keyIndex < shortcut.keys.length - 1 && (
                          <span className="mx-1 text-gray-400">+</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start">
                <i className="fa-solid fa-lightbulb text-blue-600 text-xl mr-3 mt-0.5"></i>
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">提示</h3>
                  <p className="text-sm text-blue-800">
                    按 <kbd className="px-2 py-0.5 bg-white border border-blue-300 rounded text-xs font-mono">Shift</kbd> + <kbd className="px-2 py-0.5 bg-white border border-blue-300 rounded text-xs font-mono">?</kbd> 可以随时打开或关闭此对话框。
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 底部 */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm"
            >
              我知道了
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
