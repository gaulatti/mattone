import { useState, useRef } from 'react';
import { Button, Card, SectionHeader, Select, StatusBadge, Switch, Tabs } from '@gaulatti/bleecker';
import type { ImportResult, M3uSource } from '../types';
import {
  useDeleteM3uSource,
  useImportChannels,
  useImportM3uFile,
  useM3uSources,
  useRefreshM3uSource,
  useUpdateM3uSource
} from '../services/queries/useImport';

const INTERVAL_OPTIONS = [
  { label: 'Every hour', value: '60' },
  { label: 'Every 6 hours', value: '360' },
  { label: 'Every 12 hours', value: '720' },
  { label: 'Daily', value: '1440' },
  { label: 'Weekly', value: '10080' }
];

const intervalLabel = (minutes: number) => INTERVAL_OPTIONS.find((option) => option.value === String(minutes))?.label ?? `Every ${minutes} minutes`;

const statusVariant = (source: M3uSource) => {
  if (source.lastStatus === 'error') return 'warning' as const;
  if (source.lastStatus === 'success') return 'live' as const;
  return 'default' as const;
};

export default function Import() {
  const [activeTab, setActiveTab] = useState<'url' | 'file'>('url');
  const [url, setUrl] = useState('https://tevito.gaulatti.com');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshIntervalMinutes, setRefreshIntervalMinutes] = useState('1440');
  const [file, setFile] = useState<File | null>(null);
  const [lastImport, setLastImport] = useState<ImportResult | null>(null);
  const [importTimestamp, setImportTimestamp] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importChannels = useImportChannels();
  const importFile = useImportM3uFile();
  const { data: sources = [], isLoading: sourcesLoading } = useM3uSources();
  const updateSource = useUpdateM3uSource();
  const deleteSource = useDeleteM3uSource();
  const refreshSource = useRefreshM3uSource();

  const isPending = importChannels.isPending || importFile.isPending;
  const readError = (err: any) => err.response?.data?.message || err.message || 'Failed to import channels';

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLastImport(null);

    if (activeTab === 'url') {
      if (!url.trim()) return;

      importChannels.mutate(
        { url: url.trim(), autoRefresh, refreshIntervalMinutes: Number(refreshIntervalMinutes) },
        {
          onSuccess: (data) => {
            setLastImport(data);
            setImportTimestamp(new Date().toLocaleString());
          },
          onError: (err: any) => {
            console.error('Import failed', err);
            setError(readError(err));
          }
        }
      );
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
          setError(readError(err));
        }
      });
    }
  };

  const handleRefreshNow = (source: M3uSource) => {
    setError(null);
    refreshSource.mutate(source.id, {
      onSuccess: (data) => {
        setLastImport(data);
        setImportTimestamp(new Date().toLocaleString());
      },
      onError: (err: any) => {
        console.error('Refresh failed', err);
        setError(readError(err));
      }
    });
  };

  return (
    <div className='p-4 md:p-8 space-y-6'>
      <SectionHeader className='mb-8' title='Import Channels' description='Import channels from M3U playlist URLs or upload a .m3u file' />

      <Card className='overflow-hidden p-0'>
        <div className='border-b border-sand/10 dark:border-sand/20'>
          <Tabs activeTab={activeTab} onChange={(id) => setActiveTab(id as 'url' | 'file')} tabs={[{ id: 'url', label: 'Import via URL' }, { id: 'file', label: 'Upload M3U File' }]} />
        </div>

        <div className='p-6'>
          {activeTab === 'url' ? (
            <div>
              <h3 className='text-lg leading-6 font-medium text-text-primary dark:text-text-primary'>Import from M3U URL</h3>
              <div className='mt-2 max-w-xl text-sm text-text-secondary dark:text-text-secondary'>
                <p>Enter the URL of your M3U playlist to import channels. New channels are added, and channels you already have are matched by stream URL and get their name, logo and group refreshed from the playlist.</p>
              </div>
              <form onSubmit={handleImport} className='mt-5 space-y-4'>
                <div className='sm:flex sm:items-center gap-3'>
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
                  <Button
                    type='submit'
                    disabled={isPending}
                    className='mt-3 w-full rounded-lg sm:mt-0 sm:w-auto sm:text-sm'
                  >
                    {isPending ? 'Importing...' : 'Import'}
                  </Button>
                </div>

                <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
                  <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} label='Keep this playlist in sync' />
                  <div className='w-full sm:w-56'>
                    <Select
                      value={refreshIntervalMinutes}
                      onChange={setRefreshIntervalMinutes}
                      options={INTERVAL_OPTIONS}
                      disabled={!autoRefresh}
                    />
                  </div>
                </div>
                <p className='text-xs text-text-secondary dark:text-text-secondary'>
                  When enabled, the server re-fetches this playlist on the selected interval and refreshes the metadata of the channels it already knows.
                </p>
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
                <Button
                  type='submit'
                  disabled={!file || isPending}
                  className='mt-4 w-full rounded-lg sm:w-auto'
                >
                  {isPending ? 'Uploading...' : 'Upload & Import'}
                </Button>
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
      </Card>

      {lastImport && (
        <Card className='overflow-hidden animate-fade-in'>
          <div className='px-4 py-5 sm:p-6'>
            <h3 className='text-lg leading-6 font-medium text-text-primary dark:text-text-primary'>Import Result ({importTimestamp})</h3>
            <div className='mt-2 max-w-xl text-sm text-text-secondary dark:text-text-secondary'>
              <p>Processed {lastImport.total} channels from the playlist.</p>
            </div>
            <div className='mt-5'>
              <div className='rounded-md bg-stone/5 p-4 dark:bg-stone/20'>
                <div className='flex items-start gap-3'>
                  <StatusBadge label='Import Complete' variant='info' />
                  <div className='text-sm text-text-secondary dark:text-text-secondary space-y-1'>
                    <p>New channels added: {lastImport.created}</p>
                    <p>Existing channels updated: {lastImport.updated}</p>
                    <p>Already up to date: {lastImport.unchanged}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card className='overflow-hidden'>
        <div className='px-4 py-5 sm:p-6'>
          <h3 className='text-lg leading-6 font-medium text-text-primary dark:text-text-primary'>Scheduled Playlists</h3>
          <div className='mt-2 max-w-2xl text-sm text-text-secondary dark:text-text-secondary'>
            <p>Playlists imported by URL. Enabled ones are re-fetched automatically so channel metadata stays current.</p>
          </div>

          {sourcesLoading ? (
            <p className='mt-5 text-sm text-text-secondary dark:text-text-secondary'>Loading playlists...</p>
          ) : sources.length === 0 ? (
            <p className='mt-5 text-sm text-text-secondary dark:text-text-secondary'>No playlists imported by URL yet.</p>
          ) : (
            <ul className='mt-5 divide-y divide-sand/10 dark:divide-sand/20'>
              {sources.map((source) => (
                <li key={source.id} className='py-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
                  <div className='min-w-0'>
                    <div className='flex items-center gap-2'>
                      <StatusBadge label={source.lastStatus === 'pending' ? 'Never synced' : source.lastStatus === 'error' ? 'Last sync failed' : 'Synced'} variant={statusVariant(source)} />
                      <p className='truncate text-sm font-medium text-text-primary dark:text-text-primary'>{source.url}</p>
                    </div>
                    <p className='mt-1 text-xs text-text-secondary dark:text-text-secondary'>
                      {source.lastSyncedAt ? `Last checked ${new Date(source.lastSyncedAt).toLocaleString()}` : 'Not checked yet'}
                      {source.lastStatus === 'success' && ` · ${source.lastChannelCount} channels · ${source.lastCreatedCount} new · ${source.lastUpdatedCount} updated`}
                      {source.autoRefresh ? ` · ${intervalLabel(source.refreshIntervalMinutes)}` : ' · Auto-refresh off'}
                    </p>
                    {source.lastStatus === 'error' && source.lastError && (
                      <p className='mt-1 text-xs text-red-600 dark:text-red-400'>{source.lastError}</p>
                    )}
                  </div>

                  <div className='flex flex-wrap items-center gap-3'>
                    <Switch
                      checked={source.autoRefresh}
                      onCheckedChange={(checked) => updateSource.mutate({ id: source.id, autoRefresh: checked })}
                      label='Auto'
                    />
                    <div className='w-44'>
                      <Select
                        value={String(source.refreshIntervalMinutes)}
                        onChange={(value) => updateSource.mutate({ id: source.id, refreshIntervalMinutes: Number(value) })}
                        options={INTERVAL_OPTIONS}
                        disabled={!source.autoRefresh}
                      />
                    </div>
                    <Button
                      variant='secondary'
                      size='sm'
                      disabled={refreshSource.isPending}
                      onClick={() => handleRefreshNow(source)}
                    >
                      {refreshSource.isPending && refreshSource.variables === source.id ? 'Refreshing...' : 'Refresh now'}
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      disabled={deleteSource.isPending}
                      onClick={() => deleteSource.mutate(source.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
}
