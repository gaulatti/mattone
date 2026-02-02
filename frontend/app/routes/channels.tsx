import { useState, useMemo, useEffect } from 'react';
import type { Channel } from '../types';
import Select from '../components/common/Select';
import Modal from '../components/common/Modal';
import { useChannels, useChannelGroups } from '../services/queries/useChannels';
import { useDevices, usePlayDevice } from '../services/queries/useDevices';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useDebounce } from '../hooks/useDebounce';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 50;

export default function Channels() {
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [selectedDeviceForPlay, setSelectedDeviceForPlay] = useState<string>('');
  const [activeChannelForPlay, setActiveChannelForPlay] = useState<Channel | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 500);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedGroup, debouncedSearch]);

  const { data, isLoading: isLoadingChannels } = useChannels(selectedGroup, debouncedSearch, page, PAGE_SIZE);
  const { data: groups = [] } = useChannelGroups();
  const { data: devices = [] } = useDevices();
  const playDevice = usePlayDevice();

  const channels = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handlePlayClick = (channel: Channel) => {
    setActiveChannelForPlay(channel);
    setSelectedDeviceForPlay(''); // Reset selection
  };

  const handleConfirmPlay = () => {
    if (activeChannelForPlay && selectedDeviceForPlay) {
      playDevice.mutate(
        { id: selectedDeviceForPlay, channel: activeChannelForPlay },
        {
          onSuccess: () => {
            setActiveChannelForPlay(null);
            setSelectedDeviceForPlay('');
          }
        }
      );
    }
  };

  const handleCancelPlay = () => {
    setActiveChannelForPlay(null);
    setSelectedDeviceForPlay('');
  };

  if (isLoadingChannels && page === 1) {
    return (
      <div className='flex items-center justify-center p-8'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  return (
    <div className='p-4 md:p-8 space-y-6'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-text-primary dark:text-text-primary mb-2'>Channels</h1>
        <p className='text-text-secondary dark:text-text-secondary'>Browse and manage available channels ({total} total)</p>
      </div>

      {/* Filters */}
      <div className='bg-white dark:bg-sand/10 border border-sand/10 dark:border-sand/20 rounded-xl shadow-sm p-4 flex flex-col sm:flex-row gap-4'>
        <div className='flex-1'>
          <label htmlFor='search' className='block text-sm font-medium text-text-primary dark:text-text-primary mb-1'>
            Search
          </label>
          <input
            type='text'
            id='search'
            className='mt-1 block w-full border-sand/30 dark:border-sand/50 bg-white dark:bg-sand/10 text-text-primary dark:text-text-primary rounded-lg shadow-sm focus:ring-2 focus:ring-sea dark:focus:ring-accent-blue focus:border-sea dark:focus:border-accent-blue sm:text-sm p-2 border'
            placeholder='Search channels...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className='sm:w-64'>
          <label htmlFor='group' className='block text-sm font-medium text-text-primary dark:text-text-primary mb-1'>
            Group
          </label>
          <Select
            value={selectedGroup}
            onChange={setSelectedGroup}
            options={[{ label: 'All Groups', value: '' }, ...groups.map((group) => ({ label: group, value: group }))]}
          />
        </div>
      </div>

      {/* Channel List */}
      <div className='bg-white dark:bg-sand/10 border border-sand/10 dark:border-sand/20 rounded-xl shadow-sm overflow-hidden'>
        <ul className='divide-y divide-sand/10 dark:divide-sand/20'>
          {channels.map((channel) => (
            <li key={channel.id} className='px-4 py-4 flex items-center sm:px-6 hover:bg-sand/5 dark:hover:bg-sand/10 transition-colors'>
              <div className='flex-shrink-0 h-10 w-10 flex items-center justify-center bg-sand/10 dark:bg-sand/20 rounded-full overflow-hidden'>
                {channel.tvgLogo ? (
                  <img src={channel.tvgLogo} alt='' className='h-full w-full object-cover' />
                ) : (
                  <span className='text-xs font-semibold text-text-secondary dark:text-text-secondary'>N/A</span>
                )}
              </div>
              <div className='ml-4 flex-1'>
                <div className='flex items-center justify-between'>
                  <p className='text-sm font-medium text-sea dark:text-accent-blue truncate'>{channel.tvgName}</p>
                </div>
                <div className='mt-1'>
                  <p className='flex items-center text-sm text-text-secondary dark:text-text-secondary'>{channel.groupTitle || 'Uncategorized'}</p>
                </div>
              </div>
              <div className='ml-4 flex-shrink-0'>
                <button
                  onClick={() => handlePlayClick(channel)}
                  className='inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-white bg-sea dark:bg-accent-blue hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sea dark:focus:ring-accent-blue transition-all duration-400'
                >
                  Play
                </button>
              </div>
            </li>
          ))}
          {channels.length === 0 && <li className='px-4 py-8 text-center text-text-secondary dark:text-text-secondary'>No channels found.</li>}
        </ul>

        {/* Pagination */}
        {total > 0 && (
          <div className='flex items-center justify-between border-t border-sand/10 dark:border-sand/20 bg-white dark:bg-sand/5 px-4 py-3 sm:px-6'>
            <div className='hidden sm:flex sm:flex-1 sm:items-center sm:justify-between'>
              <div>
                <p className='text-sm text-text-secondary dark:text-text-secondary'>
                  Showing <span className='font-medium'>{Math.min((page - 1) * PAGE_SIZE + 1, total)}</span> to{' '}
                  <span className='font-medium'>{Math.min(page * PAGE_SIZE, total)}</span> of <span className='font-medium'>{total}</span> results
                </p>
              </div>
              <div>
                <nav className='isolate inline-flex -space-x-px rounded-md shadow-sm' aria-label='Pagination'>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className='relative inline-flex items-center rounded-l-md px-2 py-2 text-text-secondary dark:text-text-secondary ring-1 ring-inset ring-sand/20 hover:bg-sand/10 dark:hover:bg-sand/20 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    <span className='sr-only'>Previous</span>
                    <ChevronLeft className='h-5 w-5' aria-hidden='true' />
                  </button>
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    // Start page calculation to keep current page centered-ish if possible, or simple sliding window
                    let p = page;
                    if (totalPages <= 5) {
                      p = i + 1;
                    } else if (page <= 3) {
                      p = i + 1;
                    } else if (page >= totalPages - 2) {
                      p = totalPages - 4 + i;
                    } else {
                      p = page - 2 + i;
                    }

                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                          p === page
                            ? 'bg-sea dark:bg-accent-blue text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sea'
                            : 'text-text-primary dark:text-text-primary ring-1 ring-inset ring-sand/20 hover:bg-sand/10 dark:hover:bg-sand/20 focus:z-20 focus:outline-offset-0'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className='relative inline-flex items-center rounded-r-md px-2 py-2 text-text-secondary dark:text-text-secondary ring-1 ring-inset ring-sand/20 hover:bg-sand/10 dark:hover:bg-sand/20 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    <span className='sr-only'>Next</span>
                    <ChevronRight className='h-5 w-5' aria-hidden='true' />
                  </button>
                </nav>
              </div>
            </div>
            {/* Mobile Pagination (Simple) */}
            <div className='flex flex-1 justify-between sm:hidden'>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className='relative inline-flex items-center rounded-md border border-sand/20 bg-white dark:bg-sand/10 px-4 py-2 text-sm font-medium text-text-primary dark:text-text-primary hover:bg-sand/5 dark:hover:bg-sand/20 disabled:opacity-50'
              >
                Previous
              </button>
              <div className='flex items-center text-sm text-text-secondary'>
                {page} / {totalPages}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className='relative ml-3 inline-flex items-center rounded-md border border-sand/20 bg-white dark:bg-sand/10 px-4 py-2 text-sm font-medium text-text-primary dark:text-text-primary hover:bg-sand/5 dark:hover:bg-sand/20 disabled:opacity-50'
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Play Modal */}
      <Modal isOpen={!!activeChannelForPlay} onClose={handleCancelPlay} title={`Play ${activeChannelForPlay?.tvgName || ''}`}>
        <div className='mt-2'>
          <p className='text-sm text-text-secondary dark:text-text-secondary'>Select a device to send this channel to.</p>
          <div className='mt-4'>
            <select
              className='block w-full pl-3 pr-10 py-2 text-base border-sand/30 dark:border-sand/50 bg-white dark:bg-sand/10 text-text-primary dark:text-text-primary focus:outline-none focus:ring-2 focus:ring-sea dark:focus:ring-accent-blue focus:border-sea dark:focus:border-accent-blue sm:text-sm rounded-lg border'
              value={selectedDeviceForPlay}
              onChange={(e) => setSelectedDeviceForPlay(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            >
              <option value=''>Select a device</option>
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.deviceCode}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className='mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3'>
          <button
            type='button'
            onClick={handleCancelPlay}
            className='w-full sm:w-auto inline-flex justify-center rounded-lg border border-sand/30 dark:border-sand/50 shadow-sm px-4 py-2 bg-white dark:bg-sand/10 text-base font-medium text-text-primary dark:text-text-primary hover:bg-sand/10 dark:hover:bg-sand/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sea dark:focus:ring-accent-blue sm:text-sm transition-all duration-400'
          >
            Cancel
          </button>
          <button
            type='button'
            onClick={handleConfirmPlay}
            disabled={!selectedDeviceForPlay || playDevice.isPending}
            className='w-full sm:w-auto inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-sea dark:bg-accent-blue text-base font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sea dark:focus:ring-accent-blue sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-400'
          >
            {playDevice.isPending ? 'Starting...' : 'Confirm Play'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
