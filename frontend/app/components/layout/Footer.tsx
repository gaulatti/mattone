import { Link } from 'react-router';

export default function Footer() {
  return (
    <footer className='bg-light-sand dark:bg-sand text-text-primary dark:text-white border-t border-sand/10 font-[family-name:var(--font-header)]'>
      {/* Natural Decorative Element */}
      <div className='h-[1px] w-full bg-gradient-to-r from-transparent via-sunset/30 to-transparent'></div>

      <div className='container mx-auto px-4 py-12'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-8'>
          {/* Brand */}
          <div>
            <div className='flex items-center gap-4 mb-4'>
              <img src='/logo.svg' alt='celesti' className='h-8 w-auto fill-current opacity-90 dark:invert' />
              <div className='h-8 w-[1px] bg-gradient-to-b from-sunset/0 via-sunset to-sunset/0'></div>
              <span className='text-xl font-bold tracking-tight text-text-primary dark:text-white'>celesti</span>
            </div>
            <p className='text-sm text-text-secondary dark:text-text-secondary'>Stream management made simple.</p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className='text-sm font-semibold text-text-primary dark:text-white mb-4'>Navigation</h3>
            <ul className='space-y-2'>
              <li>
                <Link to='/' className='text-sm text-text-secondary dark:text-gray-300 hover:text-text-primary dark:hover:text-white transition-colors'>
                  Home
                </Link>
              </li>
              <li>
                <Link to='/devices' className='text-sm text-text-secondary dark:text-gray-300 hover:text-text-primary dark:hover:text-white transition-colors'>
                  Devices
                </Link>
              </li>
              <li>
                <Link to='/channels' className='text-sm text-text-secondary dark:text-gray-300 hover:text-text-primary dark:hover:text-white transition-colors'>
                  Channels
                </Link>
              </li>
              <li>
                <Link to='/import' className='text-sm text-text-secondary dark:text-gray-300 hover:text-text-primary dark:hover:text-white transition-colors'>
                  Import
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className='text-sm font-semibold text-text-primary dark:text-white mb-4'>Resources</h3>
            <ul className='space-y-2'>
              <li>
                <a
                  href='https://github.com/gaulatti/mattone'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-sm text-text-secondary dark:text-gray-300 hover:text-text-primary dark:hover:text-white transition-colors'
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className='text-sm font-semibold text-text-primary dark:text-white mb-4'>Legal</h3>
            <ul className='space-y-2'>
              <li>
                <Link to='/privacy' className='text-sm text-text-secondary dark:text-gray-300 hover:text-text-primary dark:hover:text-white transition-colors'>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to='/terms' className='text-sm text-text-secondary dark:text-gray-300 hover:text-text-primary dark:hover:text-white transition-colors'>
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className='border-t border-sand/10 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center'>
          <div className='text-sm text-text-secondary dark:text-text-secondary tracking-refined'>
            © {new Date().getFullYear()}{' '}
            <a href='https://gaulatti.com' target='_blank' rel='noopener noreferrer' className='font-semibold hover:underline underline-offset-4'>
              gaulatti
            </a>
            . All rights reserved.
          </div>

          <div className='mt-4 md:mt-0 text-sm text-text-secondary/70 dark:text-text-secondary/70 tracking-refined'>
            <a href='https://github.com/gaulatti/mattone' target='_blank' rel='noopener noreferrer' className='hover:underline underline-offset-4'>
              View source on GitHub
            </a>
          </div>
        </div>
      </div>

      {/* Natural Bottom Accent */}
      <div className='h-1 w-full bg-gradient-to-r from-desert via-sunset to-sea opacity-80'></div>
    </footer>
  );
}
