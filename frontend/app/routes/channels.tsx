import { useState, useEffect } from 'react';
import { Avatar, Button, Card, Empty, LoadingSpinner, Modal, Pagination, SectionHeader, Select } from '@gaulatti/bleecker';
import type { Channel } from '../types';
import { useChannels, useChannelGroups } from '../services/queries/useChannels';
import { useDevices, usePlayDevice } from '../services/queries/useDevices';
import { useSelectedDevice } from '../hooks/useSelectedDevice';
import { useDebounce } from '../hooks/useDebounce';
import { Send } from 'lucide-react';

const PAGE_SIZE = 50;

export default function Channels() {
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [activeChannelForPlay, setActiveChannelForPlay] = useState<Channel | null>(null);
  const [modalDeviceId, setModalDeviceId] = useState<string>('');

  const { selectedDeviceId, setSelectedDeviceId } = useSelectedDevice();

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

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId);
  const selectedDeviceLabel = selectedDevice?.nickname || selectedDevice?.deviceCode || 'selected TV';

  // Quick-send: send channel to currently selected device without a modal
  const handleQuickSend = (channel: Channel) => {
    if (!selectedDeviceId) return;
    playDevice.mutate({ id: selectedDeviceId, channel });
  };

  // Full play modal (when no device is pre-selected or user wants to pick)
  const handlePlayClick = (channel: Channel) => {
    setActiveChannelForPlay(channel);
    setModalDeviceId(selectedDeviceId);
  };

  const handleConfirmPlay = () => {
    if (activeChannelForPlay && modalDeviceId) {
      playDevice.mutate(
        { id: modalDeviceId, channel: activeChannelForPlay },
        {
          onSuccess: () => {
            setSelectedDeviceId(modalDeviceId);
            setActiveChannelForPlay(null);
          }
        }
      );
    }
  };

  const handleCancelPlay = () => {
    setActiveChannelForPlay(null);
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
      <SectionHeader className='mb-8' title='Channels' description={`Browse and manage available channels (${total} total)`} />

      {/* Filters */}
      <Card className='flex flex-col gap-4 p-4 sm:flex-row'>
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
      </Card>

      {/* Channel List */}
      <Card className='overflow-hidden p-0'>
        <ul className='divide-y divide-sand/10 dark:divide-sand/20'>
          {channels.map((channel) => (
              <li key={channel.id} className='px-4 py-4 flex items-center sm:px-6 hover:bg-sand/5 dark:hover:bg-sand/10 transition-colors'>
              <Avatar src={channel.tvgLogo} fallback={channel.tvgName} size='md' />
              <div className='ml-4 flex-1'>
                <div className='flex items-center justify-between'>
                  <p className='text-sm font-medium text-sea dark:text-accent-blue truncate'>{channel.tvgName}</p>
                </div>
                <div className='mt-1'>
                  <p className='flex items-center text-sm text-text-secondary dark:text-text-secondary'>{channel.groupTitle || 'Uncategorized'}</p>
                </div>
              </div>
              <div className='ml-4 flex-shrink-0 flex items-center gap-2'>
                {selectedDeviceId && (
                  <Button
                    size='sm'
                    onClick={() => handleQuickSend(channel)}
                    disabled={playDevice.isPending}
                    title={`Send to ${selectedDeviceLabel}`}
                    className='gap-1 rounded-lg bg-sea/80 py-1.5 text-xs hover:bg-sea dark:bg-accent-blue/80 dark:hover:bg-accent-blue'
                  >
                    <Send size={12} />
                    Send
                  </Button>
                )}
                <Button
                  size='sm'
                  onClick={() => handlePlayClick(channel)}
                  className='rounded-lg py-1.5 text-xs'
                >
                  Play
                </Button>
              </div>
            </li>
          ))}
          {channels.length === 0 && (
            <li className='px-4 py-8'>
              <Empty title='No channels found' description='Try adjusting your search or selected group.' />
            </li>
          )}
        </ul>

        {/* Pagination */}
        {total > 0 && (
          <div className='border-t border-sand/10 bg-white px-4 py-3 dark:border-sand/20 dark:bg-sand/5 sm:px-6'>
            <div className='hidden sm:flex sm:flex-1 sm:items-center sm:justify-between'>
              <div>
                <p className='text-sm text-text-secondary dark:text-text-secondary'>
                  Showing <span className='font-medium'>{Math.min((page - 1) * PAGE_SIZE + 1, total)}</span> to{' '}
                  <span className='font-medium'>{Math.min(page * PAGE_SIZE, total)}</span> of <span className='font-medium'>{total}</span> results
                </p>
              </div>
              <div>
                <Pagination currentPage={page} totalPages={totalPages} hasPrevPage={page > 1} hasNextPage={page < totalPages} onPageChange={setPage} className='mt-0 justify-end' />
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
      </Card>

      {/* Play Modal */}
      <Modal isOpen={!!activeChannelForPlay} onClose={handleCancelPlay} title={`Play ${activeChannelForPlay?.tvgName || ''}`}>
        <div className='mt-2'>
          <p className='text-sm text-text-secondary dark:text-text-secondary'>Select a device to send this channel to.</p>
          <div className='mt-4'>
            <Select
              value={modalDeviceId}
              onChange={setModalDeviceId}
              options={[{ label: 'Select a device', value: '' }, ...devices.map((d) => ({ label: d.nickname || d.deviceCode, value: d.id }))]}
            />
          </div>
        </div>
        <div className='mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3'>
          <Button
            type='button'
            variant='secondary'
            onClick={handleCancelPlay}
            className='w-full rounded-lg border-sand/30 bg-white dark:border-sand/50 dark:bg-sand/10 dark:hover:bg-sand/20 sm:w-auto'
          >
            Cancel
          </Button>
          <Button
            type='button'
            onClick={handleConfirmPlay}
            disabled={!modalDeviceId || playDevice.isPending}
            className='w-full rounded-lg sm:w-auto'
          >
            {playDevice.isPending ? 'Starting...' : 'Confirm Play'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
