import './NavBar.css';
import { Fragment } from 'react';
import { NavLink } from 'react-router-dom';

interface NavItem {
  route: string;
  label: string;
}

const navItems: NavItem[] = [
  {
    route: '/',
    label: 'Home',
  },
  {
    route: '/chat',
    label: 'Chat',
  },
  {
    route: '/context',
    label: 'Context',
  },
];

function NavBar() {
  return (
    <div className="app-header">
      <h1 className="app-title">Beltloop</h1>
      <nav className="nav-items">
        <span className="nav-item-end" />
        {navItems.map((ni) => (
          <Fragment key={ni.route}>
            <NavLink
              to={ni.route}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              {ni.label}
            </NavLink>
            <span className="nav-item-end" />
          </Fragment>
        ))}
      </nav>
    </div>
  );
}

export default NavBar;
