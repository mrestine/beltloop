import './App.css';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Chat from './pages/chat/Chat';
import Home from './pages/home/Home';
import { PropertiesProvider } from './context/PropertiesProvider';
import Context from './pages/context/Context';

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <nav className="app-header">
          <Link to="/">Home</Link>
          <Link to="/chat">Chat</Link>
          <Link to="/context">Context</Link>
        </nav>
        <div className="app-content">
          <PropertiesProvider>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/context" element={<Context />} />
            </Routes>
          </PropertiesProvider>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
