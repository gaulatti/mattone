import { useState } from 'react';
import Select from '../components/common/Select';
import { useDevices, usePlayDevice, useStopDevice } from '../services/queries/useDevices';
import { useChannels } from '../services/queries/useChannels';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Home() {
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [selectedChannel, setSelectedChannel] = useState<string>('');

  const { data: devices = [], isLoading: isLoadingDevices } = useDevices();
  const { data: channelsData, isLoading: isLoadingChannels } = useChannels();
  const channels = channelsData?.data || [];
  const totalChannels = channelsData?.total || 0;
  const playDevice = usePlayDevice();
  const stopDevice = useStopDevice();

  const handlePlay = () => {
    const channelObj = channels.find((c) => c.id === selectedChannel);
    if (selectedDevice && channelObj) {
      playDevice.mutate({ id: selectedDevice, channel: channelObj });
    }
  };

  const handleStop = () => {
    if (selectedDevice) {
      stopDevice.mutate(selectedDevice);
    }
  };

  if (isLoadingDevices || isLoadingChannels) {
    return (
      <div className='flex items-center justify-center p-8'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  return (
    <div className='p-4 md:p-8 space-y-6'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-text-primary dark:text-text-primary mb-2'>Dashboard</h1>
        <p className='text-text-secondary dark:text-text-secondary'>Welcome to celesti stream management</p>
      </div>

      <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 mb-8'>
        <div className='bg-white dark:bg-sand/10 border border-sand/10 dark:border-sand/20 rounded-xl p-6 shadow-sm hover-lift'>
          <dt className='text-sm font-medium text-text-secondary dark:text-text-secondary truncate'>Total Devices</dt>
          <dd className='mt-1 text-3xl font-bold text-text-primary dark:text-text-primary'>{devices.length}</dd>
        </div>
        <div className='bg-white dark:bg-sand/10 border border-sand/10 dark:border-sand/20 rtotalChannelshadow-sm hover-lift'>
          <dt className='text-sm font-medium text-text-secondary dark:text-text-secondary truncate'>Total Channels</dt>
          <dd className='mt-1 text-3xl font-bold text-text-primary dark:text-text-primary'>{channels.length}</dd>
        </div>
      </div>

      <div className='bg-white dark:bg-sand/10 border border-sand/10 dark:border-sand/20 rounded-xl shadow-sm'>
        <div className='px-4 py-5 sm:p-6'>
          <h3 className='text-lg leading-6 font-medium text-text-primary dark:text-text-primary'>Quick Play</h3>
          <div className='mt-2 max-w-xl text-sm text-text-secondary dark:text-text-secondary'>
            <p>Select a device and a channel to start playback instantly.</p>
          </div>
          <div className='mt-5 space-y-4'>
            <div>
              <label htmlFor='device-select' className='block text-sm font-medium text-text-primary dark:text-text-primary mb-1'>
                Device
              </label>
              <Select
                value={selectedDevice}
                onChange={setSelectedDevice}
                placeholder='Select a device'
                options={devices.map((device) => ({ label: device.deviceCode, value: device.id }))}
              />
            </div>

            <div>
              <label htmlFor='channel-select' className='block text-sm font-medium text-text-primary dark:text-text-primary mb-1'>
                Channel
              </label>
              <Select
                value={selectedChannel}
                onChange={setSelectedChannel}
                placeholder='Select a channel'
                options={channels.map((channel) => ({ label: channel.tvgName, value: channel.id }))}
              />
            </div>

            <div className='flex space-x-3'>
              <button
                type='button'
                onClick={handlePlay}
                disabled={!selectedDevice || !selectedChannel || playDevice.isPending}
                className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-sea dark:bg-accent-blue hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sea dark:focus:ring-accent-blue disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-400'
              >
                {playDevice.isPending ? 'Playing...' : 'Play'}
              </button>
              <button
                type='button'
                onClick={handleStop}
                disabled={!selectedDevice || stopDevice.isPending}
                className='inline-flex items-center px-4 py-2 border border-sand/30 dark:border-sand/50 shadow-sm text-sm font-medium rounded-lg text-text-primary dark:text-text-primary bg-white dark:bg-sand/10 hover:bg-sand/10 dark:hover:bg-sand/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sea dark:focus:ring-accent-blue disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-400'
              >
                {stopDevice.isPending ? 'Stopping...' : 'Stop'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
