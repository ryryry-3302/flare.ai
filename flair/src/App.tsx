import { useState } from 'react';
import Editor from './Editor';
import { FaEraser } from 'react-icons/fa';
import logoSvg from './assets/logo.svg';

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
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-2">
            <img 
              src={logoSvg}
              alt="Flair logo" 
              className="h-40" 
            />
          </div>
          
          {/* Clear data button */}
          <button
            onClick={() => setShowConfirmClear(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors"
          >
            <FaEraser className="w-3.5 h-3.5" />
            Reset Demo
          </button>
        </div>

        <Editor />

        {/* Confirmation Dialog */}
        {showConfirmClear && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md">
              <h3 className="text-xl font-semibold mb-4">Reset All Data?</h3>
              <p className="text-slate-600 mb-6">
                This will clear all your essays, comments, and settings. This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className="px-4 py-2 text-sm font-medium rounded border border-slate-300 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={clearAllData}
                  className="px-4 py-2 text-sm font-medium rounded bg-red-600 text-white hover:bg-red-700"
                >
                  Reset Everything
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="text-center text-slate-500 text-sm mt-4">
        © {new Date().getFullYear()} Flair. All rights reserved.
      </div>
    </div>
  );
};

export default App;
