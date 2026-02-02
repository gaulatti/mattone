import { useState, useRef } from 'react';
import type { ImportResult } from '../types';
import { useImportChannels, useImportM3uFile } from '../services/queries/useImport';

export default function Import() {
  const [activeTab, setActiveTab] = useState<'url' | 'file'>('url');
  const [url, setUrl] = useState('https://tevito.gaulatti.com');
  const [file, setFile] = useState<File | null>(null);
  const [lastImport, setLastImport] = useState<ImportResult | null>(null);
  const [importTimestamp, setImportTimestamp] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importChannels = useImportChannels();
  const importFile = useImportM3uFile();

  const isPending = importChannels.isPending || importFile.isPending;

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLastImport(null);

    if (activeTab === 'url') {
      if (!url.trim()) return;

      importChannels.mutate(url, {
        onSuccess: (data) => {
          setLastImport(data);
          setImportTimestamp(new Date().toLocaleString());
        },
        onError: (err: any) => {
          console.error('Import failed', err);
          setError(err.response?.data?.message || err.message || 'Failed to import channels');
        }
      });
    } else {
      if (!file) return;

      importFile.mutate(file, {
        onSuccess: (data) => {
          setLastImport(data);
          setImportTimestamp(new Date().toLocaleString());
          setFile(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
        },
        onError: (err: any) => {
          console.error('Import failed', err);
          setError(err.response?.data?.message || err.message || 'Failed to import channels');
        }
      });
    }
  };

  return (
    <div className='p-4 md:p-8 space-y-6'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-text-primary dark:text-text-primary mb-2'>Import Channels</h1>
        <p className='text-text-secondary dark:text-text-secondary'>Import channels from M3U playlist URLs or upload a .m3u file</p>
      </div>

      <div className='bg-white dark:bg-sand/10 border border-sand/10 dark:border-sand/20 rounded-xl shadow-sm overflow-hidden'>
        <div className='border-b border-sand/10 dark:border-sand/20'>
          <nav className='-mb-px flex' aria-label='Tabs'>
            <button
              onClick={() => setActiveTab('url')}
              className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                activeTab === 'url'
                  ? 'border-sea dark:border-accent-blue text-sea dark:text-accent-blue'
                  : 'border-transparent text-text-secondary dark:text-text-secondary hover:text-text-primary dark:hover:text-text-primary hover:border-gray-300'
              }`}
            >
              Import via URL
            </button>
            <button
              onClick={() => setActiveTab('file')}
              className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                activeTab === 'file'
                  ? 'border-sea dark:border-accent-blue text-sea dark:text-accent-blue'
                  : 'border-transparent text-text-secondary dark:text-text-secondary hover:text-text-primary dark:hover:text-text-primary hover:border-gray-300'
              }`}
            >
              Upload M3U File
            </button>
          </nav>
        </div>

        <div className='p-6'>
          {activeTab === 'url' ? (
            <div>
              <h3 className='text-lg leading-6 font-medium text-text-primary dark:text-text-primary'>Import from M3U URL</h3>
              <div className='mt-2 max-w-xl text-sm text-text-secondary dark:text-text-secondary'>
                <p>Enter the URL of your M3U playlist to import channels. This will replace existing channels.</p>
              </div>
              <form onSubmit={handleImport} className='mt-5 sm:flex sm:items-center gap-3'>
                <div className='w-full sm:max-w-md'>
                  <label htmlFor='url' className='sr-only'>
                    URL
                  </label>
                  <input
                    type='text'
                    name='url'
                    id='url'
                    className='shadow-sm focus:ring-2 focus:ring-sea dark:focus:ring-accent-blue focus:border-sea dark:focus:border-accent-blue block w-full sm:text-sm border-sand/30 dark:border-sand/50 bg-white dark:bg-sand/10 text-text-primary dark:text-text-primary rounded-lg p-2 border'
                    placeholder='https://example.com/playlist.m3u'
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>
                <button
                  type='submit'
                  disabled={isPending}
                  className='mt-3 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm font-medium rounded-lg text-white bg-sea dark:bg-accent-blue hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sea dark:focus:ring-accent-blue sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-400'
                >
                  {isPending ? 'Importing...' : 'Import'}
                </button>
              </form>
            </div>
          ) : (
            <div>
              <h3 className='text-lg leading-6 font-medium text-text-primary dark:text-text-primary'>Upload M3U File</h3>
              <div className='mt-2 max-w-xl text-sm text-text-secondary dark:text-text-secondary'>
                <p>Select an .m3u file from your computer to upload and import.</p>
              </div>
              <form onSubmit={handleImport} className='mt-5'>
                <div className='w-full sm:max-w-md'>
                  <input
                    ref={fileInputRef}
                    type='file'
                    accept='.m3u,.m3u8'
                    onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                    className='block w-full text-sm text-text-secondary dark:text-text-secondary
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-sea/10 dark:file:bg-accent-blue/10
                        file:text-sea dark:file:text-accent-blue
                        hover:file:bg-sea/20 dark:hover:file:bg-accent-blue/20
                      '
                  />
                </div>
                <button
                  type='submit'
                  disabled={!file || isPending}
                  className='mt-4 w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm font-medium rounded-lg text-white bg-sea dark:bg-accent-blue hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sea dark:focus:ring-accent-blue disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-400'
                >
                  {isPending ? 'Uploading...' : 'Upload & Import'}
                </button>
              </form>
            </div>
          )}
        </div>

        {error && (
          <div className='mx-6 mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg'>
            <div className='flex'>
              <div className='flex-shrink-0'>
                <svg className='h-5 w-5 text-red-400' viewBox='0 0 20 20' fill='currentColor' aria-hidden='true'>
                  <path
                    fillRule='evenodd'
                    d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
              <div className='ml-3'>
                <h3 className='text-sm font-medium text-red-800 dark:text-red-200'>Import Error</h3>
                <div className='mt-2 text-sm text-red-700 dark:text-red-300'>{error}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {lastImport && (
        <div className='bg-white dark:bg-sand/10 border border-sand/10 dark:border-sand/20 rounded-xl shadow-sm overflow-hidden animate-fade-in'>
          <div className='px-4 py-5 sm:p-6'>
            <h3 className='text-lg leading-6 font-medium text-text-primary dark:text-text-primary'>Import Result ({importTimestamp})</h3>
            <div className='mt-2 max-w-xl text-sm text-text-secondary dark:text-text-secondary'>
              <p>Successfully imported channels from the playlist.</p>
            </div>
            <div className='mt-5'>
              <div className='rounded-md bg-stone/5 dark:bg-stone/20 p-4'>
                <div className='flex'>
                  <div className='flex-shrink-0'>
                    {/* Check icon */}
                    <svg
                      className='h-5 w-5 text-sea dark:text-accent-blue'
                      xmlns='http://www.w3.org/2000/svg'
                      viewBox='0 0 20 20'
                      fill='currentColor'
                      aria-hidden='true'
                    >
                      <path
                        fillRule='evenodd'
                        d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </div>
                  <div className='ml-3'>
                    <h3 className='text-sm font-medium text-text-primary dark:text-text-primary'>Import Complete</h3>
                    <div className='mt-2 text-sm text-text-secondary dark:text-text-secondary'>
                      <p>Number of channels imported: {lastImport.count}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
