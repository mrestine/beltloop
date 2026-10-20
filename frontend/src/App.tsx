import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Chat from './pages/chat/Chat';
import Home from './pages/home/Home';
import { PropertiesProvider } from './context/PropertiesProvider';
import Context from './pages/context/Context';
import NavBar from './components/NavBar/NavBar';
import Tools from './pages/tools/Tools';

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <NavBar />
        <div className="app-content">
          <div className="hem-wrap" />
          <PropertiesProvider>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/context" element={<Context />} />
              <Route path="/tools" element={<Tools />} />
            </Routes>
          </PropertiesProvider>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
