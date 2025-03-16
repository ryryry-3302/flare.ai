import Editor from './Editor';
import logoSvg from './assets/logo.svg';

const App = () => {
  return (
    <div className="max-w-[1400px] mx-auto mt-6 px-4 mb-10">
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl p-6">
        <Editor />
      </div>
      <div className="text-center text-slate-500 text-sm mt-4">
        © {new Date().getFullYear()} Flair. All rights reserved.
      </div>
    </div>
  );
};

export default App;
