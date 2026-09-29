import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { navigation } from './navigation';

const quick = ['/dashboard', '/transactions', '/budgets', '/insights'];

export default function MobileNavigation() {
  return (
    <nav className="mobile-nav" aria-label="Quick navigation">
      {navigation
        .filter((n) => quick.includes(n.path))
        .map((n) => (
          <NavLink key={n.path} to={n.path} className="mobile-nav-link">
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="nova-mobile-indicator"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      inset: '6px 10px',
                      borderRadius: 14,
                      background:
                        'linear-gradient(135deg, rgba(103,232,249,0.16), rgba(167,139,250,0.14))',
                      border: '1px solid rgba(103,232,249,0.25)',
                      zIndex: 0
                    }}
                  />
                )}
                <span
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2
                  }}
                >
                  <n.icon size={20} />
                  <span style={{ fontSize: '0.62rem', fontWeight: 650, letterSpacing: '0.02em' }}>
                    {n.label}
                  </span>
                </span>
              </>
            )}
          </NavLink>
        ))}
    </nav>
  );
}
