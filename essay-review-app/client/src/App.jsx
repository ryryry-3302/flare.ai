import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Editor from './components/Editor/TiptapEditor';
import InsightsOverlay from './components/Insights/InsightsOverlay';
import { EditorProvider } from './context/EditorContext';
import { UserProvider } from './context/UserContext';

const App = () => {
  return (
    <UserProvider>
      <EditorProvider>
        <Router>
          <Switch>
            <Route path="/" exact component={Editor} />
            <Route path="/insights" component={InsightsOverlay} />
          </Switch>
        </Router>
      </EditorProvider>
    </UserProvider>
  );
};

export default App;