import './App.css';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Chat from './pages/chat/Chat';
import Home from './pages/home/Home';
import { ModelsProvider } from './context/ModelsProvider';

function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/chat">Chat</Link>
      </nav>
      <ModelsProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
        </Routes>
      </ModelsProvider>
    </BrowserRouter>
  );
}

export default App;
