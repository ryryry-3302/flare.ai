import { useState } from 'react';
import Editor from './Editor';
import { FaEraser } from 'react-icons/fa';

const App = () => {
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const clearAllData = () => {
    // Clear all application data
    localStorage.removeItem('essay-editor-content');
    localStorage.removeItem('essay-editor-comments');
    localStorage.removeItem('essay-editor-ui-state');
    
    // Reload the page to reset the editor
    window.location.reload();
  };

  return (
    <div className="max-w-[1400px] mx-auto mt-6 px-4 mb-10">
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Essay Review Tool</h1>
          <button 
            className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors"
            onClick={() => setShowConfirmClear(true)}
          >
            <FaEraser className="w-3.5 h-3.5" />
            Reset Demo
          </button>
        </div>
        
        <p className="mb-8 text-gray-600 max-w-3xl">
          Use the editor below to annotate, highlight, and provide feedback on essays.
        </p>
        
        {/* Clear data confirmation */}
        {showConfirmClear && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md mx-4">
              <h3 className="text-lg font-bold mb-2">Reset Demo Data?</h3>
              <p className="mb-4 text-slate-600">
                This will clear all editor content and comments. This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button 
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-md text-slate-700 transition-colors"
                  onClick={() => setShowConfirmClear(false)}
                >
                  Cancel
                </button>
                <button 
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white transition-colors"
                  onClick={clearAllData}
                >
                  Clear All Data
                </button>
              </div>
            </div>
          </div>
        )}
        
        <Editor />
      </div>
    </div>
  );
};

export default App;
