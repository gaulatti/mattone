import { Link } from 'react-router';
import { Search, Moon, Sun, Monitor, LogIn, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuthStatus, useLogout } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { signInWithRedirect } from 'aws-amplify/auth';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated } = useAuthStatus();
  const { logout } = useLogout();

  return (
    <header className='fixed w-full top-0 z-50 bg-white/90 dark:bg-dark-sand/95 backdrop-blur-2xl shadow-[0_1px_3px_0_rgb(0,0,0,0.02)] dark:shadow-[0_1px_3px_0_rgb(0,0,0,0.3)] font-[family-name:var(--font-header)]'>
      <div className='container mx-auto px-4'>
        <nav className='flex items-center justify-between h-20'>
          {/* Logo */}
          <Link to='/' className='group transition-all duration-400 flex items-center gap-4'>
            <img src='/logo.svg' alt='celesti' className='h-8 w-auto opacity-90 group-hover:opacity-100 transition-opacity duration-400 dark:invert' />
            <div className='h-8 w-[1px] bg-gradient-to-b from-sunset/0 via-sunset to-sunset/0'></div>
            <span className='text-xl font-bold tracking-tight text-text-primary dark:text-white'>celesti</span>
          </Link>

          {/* Desktop Navigation */}
          {isAuthenticated && (
            <div className='hidden md:flex items-center space-x-8'>
              <Link to='/' className='text-base hover:text-sea dark:hover:text-accent-blue transition-colors duration-400 tracking-refined font-medium'>
                Dashboard
              </Link>
              <Link to='/devices' className='text-base hover:text-sea dark:hover:text-accent-blue transition-colors duration-400 tracking-refined font-medium'>
                Devices
              </Link>
              <Link to='/channels' className='text-base hover:text-sea dark:hover:text-accent-blue transition-colors duration-400 tracking-refined font-medium'>
                Channels
              </Link>
              <Link to='/import' className='text-base hover:text-sea dark:hover:text-accent-blue transition-colors duration-400 tracking-refined font-medium'>
                Import
              </Link>
            </div>
          )}

          {/* Actions */}
          <div className='hidden md:flex items-center gap-3'>
            {isAuthenticated && (
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className='inline-flex items-center justify-center rounded-full p-2.5 border border-sand/20 dark:border-sand/70 bg-white/35 dark:bg-sand/25 backdrop-blur-md shadow-sm hover:-translate-y-0.5 hover:scale-105 transition-all duration-400'
                aria-label='Search'
              >
                <Search size={18} className='text-gray-600 dark:text-gray-300' strokeWidth={1.5} />
              </button>
            )}

            <button
              type='button'
              onClick={toggleTheme}
              className='inline-flex items-center justify-center rounded-full p-2.5 border border-sand/20 dark:border-sand/70 bg-white/35 dark:bg-sand/25 backdrop-blur-md shadow-sm hover:-translate-y-0.5 hover:scale-105 transition-all duration-400'
              aria-label='Toggle theme'
            >
              {theme === 'light' ? (
                <Sun size={18} className='text-gray-600 dark:text-gray-300' strokeWidth={1.5} />
              ) : theme === 'dark' ? (
                <Moon size={18} className='text-gray-600 dark:text-gray-300' strokeWidth={1.5} />
              ) : (
                <Monitor size={18} className='text-gray-600 dark:text-gray-300' strokeWidth={1.5} />
              )}
            </button>

            {isAuthenticated ? (
              <div className='flex items-center gap-3'>
                <button
                  onClick={logout}
                  className='inline-flex items-center gap-2 px-4 py-2 bg-terracotta dark:bg-terracotta text-white rounded-full hover:opacity-90 transition-opacity duration-400'
                >
                  <LogOut size={16} strokeWidth={1.5} />
                  <span className='text-sm font-medium'>Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => signInWithRedirect({ provider: 'Google' }).catch((e) => console.error('Error signing in', e))}
                className='inline-flex items-center gap-2 px-4 py-2 bg-sea dark:bg-accent-blue text-white rounded-full hover:opacity-90 transition-opacity duration-400'
              >
                <LogIn size={16} strokeWidth={1.5} />
                <span className='text-sm font-medium'>Login</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className='md:hidden group' aria-label='Toggle menu' onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <div className='w-6 h-5 flex flex-col justify-between'>
              <span
                className={`w-full h-[1px] bg-text-primary transform transition-all duration-400 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}
              ></span>
              <span className={`w-full h-[1px] bg-text-primary transition-all duration-400 ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
              <span
                className={`w-full h-[1px] bg-text-primary transform transition-all duration-400 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}
              ></span>
            </div>
          </button>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className='md:hidden bg-light-sand/95 dark:bg-sand/95 backdrop-blur-md border-t border-sand/10'>
            <div className='py-6 space-y-4'>
              <Link
                to='/'
                className='block px-4 py-2 text-base hover:text-sea dark:hover:text-accent-blue transition-colors duration-400'
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                to='/devices'
                className='block px-4 py-2 text-base hover:text-sea dark:hover:text-accent-blue transition-colors duration-400'
                onClick={() => setMobileMenuOpen(false)}
              >
                Devices
              </Link>
              <Link
                to='/channels'
                className='block px-4 py-2 text-base hover:text-sea dark:hover:text-accent-blue transition-colors duration-400'
                onClick={() => setMobileMenuOpen(false)}
              >
                Channels
              </Link>
              <Link
                to='/import'
                className='block px-4 py-2 text-base hover:text-sea dark:hover:text-accent-blue transition-colors duration-400'
                onClick={() => setMobileMenuOpen(false)}
              >
                Import
              </Link>
            </div>
          </div>
        )}
      </div>
      {/* Decorative bottom border */}
      <div className='h-[1px] w-full bg-gradient-to-r from-transparent via-sunset/30 to-transparent'></div>
    </header>
  );
}
