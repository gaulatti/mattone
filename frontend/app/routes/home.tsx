import { useState } from 'react';
import { Button, Card, LoadingSpinner, SectionHeader, Select } from '@gaulatti/bleecker';
import { useDevices, usePlayDevice, useStopDevice } from '../services/queries/useDevices';
import { useChannels } from '../services/queries/useChannels';

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
      <SectionHeader className='mb-8' title='Dashboard' description='Welcome to celesti stream management' />

      <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 mb-8'>
        <Card className='hover-lift'>
          <dt className='text-sm font-medium text-text-secondary dark:text-text-secondary truncate'>Total Devices</dt>
          <dd className='mt-1 text-3xl font-bold text-text-primary dark:text-text-primary'>{devices.length}</dd>
        </Card>
        <Card className='hover-lift'>
          <dt className='text-sm font-medium text-text-secondary dark:text-text-secondary truncate'>Total Channels</dt>
          <dd className='mt-1 text-3xl font-bold text-text-primary dark:text-text-primary'>{totalChannels}</dd>
        </Card>
      </div>

      <Card>
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
              <Button
                onClick={handlePlay}
                disabled={!selectedDevice || !selectedChannel || playDevice.isPending}
                className='rounded-lg'
              >
                {playDevice.isPending ? 'Playing...' : 'Play'}
              </Button>
              <Button
                variant='secondary'
                onClick={handleStop}
                disabled={!selectedDevice || stopDevice.isPending}
                className='rounded-lg border-sand/30 bg-white dark:border-sand/50 dark:bg-sand/10 dark:hover:bg-sand/20'
              >
                {stopDevice.isPending ? 'Stopping...' : 'Stop'}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
