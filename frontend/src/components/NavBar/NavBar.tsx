import './NavBar.css';
import { Link } from 'react-router-dom';

function NavBar() {
  return (
    <div className="app-header">
      <h1 className="app-title">Beltloop</h1>
      <nav className="nav-items">
        <span className="nav-item-end" />
        <Link to="/">Home</Link>
        <span className="nav-item-end" />
        <Link to="/chat">Chat</Link>
        <span className="nav-item-end" />
        <Link to="/context">Context</Link>
        <span className="nav-item-end" />
      </nav>
    </div>
  );
}

export default NavBar;
