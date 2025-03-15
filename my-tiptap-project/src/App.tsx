import Editor from './Editor';

const App = () => {
  return (
    <div className="max-w-4xl mx-auto mt-10">
      <h1 className="text-3xl font-bold mb-4">Essay Review Tool</h1>
      <p className="mb-6 text-gray-600">
        Use the editor below to annotate, highlight, and provide feedback on essays.
      </p>
      <Editor />
    </div>
  );
};

export default App;
