import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Menu, LogOut } from 'lucide-react';

const Header = () => {
  const { user, logout } = useAuth();
  const { toggleSidebar } = useApp();

  return (
    <header style={{
      background: 'white',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      borderBottom: '1px solid #e5e7eb'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={toggleSidebar} style={{
            padding: '0.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer'
          }}>
            <Menu style={{ width: '1.25rem', height: '1.25rem' }} />
          </button>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
            RRHH Pro
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827', margin: 0 }}>
              {user.name}
            </p>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
              {user.position}
            </p>
          </div>
          <button onClick={logout} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 0.75rem',
            color: '#6b7280',
            background: 'transparent',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer'
          }}>
            <LogOut style={{ width: '1rem', height: '1rem' }} />
            <span>Salir</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;