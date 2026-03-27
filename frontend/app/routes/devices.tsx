import { useState } from 'react';
import { Button, Card, Empty, LoadingSpinner, SectionHeader } from '@gaulatti/bleecker';
import type { Device } from '../types';
import { useDevices, useAddDevice, useDeleteDevice, useUpdateDevice, useStopDevice } from '../services/queries/useDevices';
import { Pencil, Check, X, Square } from 'lucide-react';

export default function Devices() {
  const [newDeviceCode, setNewDeviceCode] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNickname, setEditingNickname] = useState('');

  const { data: devices = [], isLoading } = useDevices();
  const addDevice = useAddDevice();
  const deleteDevice = useDeleteDevice();
  const updateDevice = useUpdateDevice();
  const stopDevice = useStopDevice();

  const handleDelete = (device: Device) => {
    if (confirm(`Are you sure you want to delete device ${device.nickname || device.deviceCode}?`)) {
      deleteDevice.mutate(device.id);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceCode.trim()) return;

    addDevice.mutate(newDeviceCode, {
      onSuccess: () => {
        setNewDeviceCode('');
      }
    });
  };

  const handleEditStart = (device: Device) => {
    setEditingId(device.id);
    setEditingNickname(device.nickname || '');
  };

  const handleEditSave = (device: Device) => {
    updateDevice.mutate(
      { id: device.id, nickname: editingNickname.trim() },
      {
        onSuccess: () => {
          setEditingId(null);
        }
      }
    );
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditingNickname('');
  };

  const handleStop = (device: Device) => {
    stopDevice.mutate(device.id);
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  return (
    <div className='p-4 md:p-8 space-y-6'>
      <SectionHeader className='mb-8' title='Devices' description='Manage your streaming devices' />

      {/* Add Device Form */}
      <Card>
        <h3 className='text-lg leading-6 font-medium text-text-primary dark:text-text-primary'>Add New Device</h3>
        <form onSubmit={handleAdd} className='mt-5 sm:flex sm:items-center gap-3'>
          <div className='w-full sm:max-w-xs'>
            <label htmlFor='device-code' className='sr-only'>
              Device Code
            </label>
            <input
              type='text'
              name='device-code'
              id='device-code'
              className='shadow-sm focus:ring-2 focus:ring-sea dark:focus:ring-accent-blue focus:border-sea dark:focus:border-accent-blue block w-full sm:text-sm border-sand/30 dark:border-sand/50 bg-white dark:bg-sand/10 text-text-primary dark:text-text-primary rounded-lg p-2 border'
              placeholder='Enter device code'
              value={newDeviceCode}
              onChange={(e) => setNewDeviceCode(e.target.value)}
            />
          </div>
          <Button type='submit' className='mt-3 w-full rounded-lg sm:mt-0 sm:w-auto sm:text-sm'>
            Add Device
          </Button>
        </form>
      </Card>

      {/* Devices List */}
      <Card className='overflow-hidden p-0'>
        <ul className='divide-y divide-sand/10 dark:divide-sand/20'>
          {devices.map((device) => (
            <li key={device.id}>
              <div className='px-4 py-4 flex items-center justify-between sm:px-6 hover:bg-sand/5 dark:hover:bg-sand/10 transition-colors'>
                <div className='min-w-0 flex-1 sm:flex sm:items-center sm:justify-between'>
                  <div className='flex-1'>
                    <div className='flex text-sm font-medium text-sea dark:text-accent-blue truncate'>
                      <p>{device.deviceCode}</p>
                    </div>
                    {/* Nickname row */}
                    <div className='mt-1 flex items-center gap-2'>
                      {editingId === device.id ? (
                        <>
                          <input
                            type='text'
                            value={editingNickname}
                            onChange={(e) => setEditingNickname(e.target.value)}
                            placeholder='Add a nickname...'
                            className='text-sm border border-sand/30 dark:border-sand/50 bg-white dark:bg-sand/10 text-text-primary dark:text-text-primary rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-sea dark:focus:ring-accent-blue'
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleEditSave(device);
                              if (e.key === 'Escape') handleEditCancel();
                            }}
                          />
                          <Button
                            size='sm'
                            variant='ghost'
                            onClick={() => handleEditSave(device)}
                            disabled={updateDevice.isPending}
                            className='h-auto rounded-lg px-1.5 py-1 text-sea hover:translate-y-0 hover:bg-transparent hover:text-sea/80 dark:text-accent-blue dark:hover:bg-transparent dark:hover:text-accent-blue/80'
                            aria-label='Save nickname'
                          >
                            <Check size={16} />
                          </Button>
                          <Button
                            size='sm'
                            variant='ghost'
                            onClick={handleEditCancel}
                            className='h-auto rounded-lg px-1.5 py-1 hover:translate-y-0 hover:bg-transparent'
                            aria-label='Cancel'
                          >
                            <X size={16} />
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className='text-sm text-text-secondary dark:text-text-secondary'>
                            {device.nickname || <em className='opacity-50'>No nickname</em>}
                          </span>
                          <Button
                            size='sm'
                            variant='ghost'
                            onClick={() => handleEditStart(device)}
                            className='h-auto rounded-lg px-1.5 py-1 hover:translate-y-0 hover:bg-transparent hover:text-sea dark:hover:bg-transparent dark:hover:text-accent-blue'
                            aria-label='Edit nickname'
                          >
                            <Pencil size={14} />
                          </Button>
                        </>
                      )}
                    </div>
                    <div className='mt-1'>
                      <div className='flex items-center text-xs text-text-secondary dark:text-text-secondary'>
                        <p>Registered on {new Date(device.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className='ml-5 flex-shrink-0 flex items-center gap-2'>
                  <Button
                    variant='secondary'
                    size='sm'
                    onClick={() => handleStop(device)}
                    disabled={stopDevice.isPending}
                    title='Stop stream on this device'
                    className='gap-1 rounded-lg border-sand/30 bg-white dark:border-sand/50 dark:bg-sand/10 dark:hover:bg-sand/20'
                  >
                    <Square size={14} />
                    Stop
                  </Button>
                  <Button
                    variant='destructive'
                    size='sm'
                    onClick={() => handleDelete(device)}
                    className='rounded-lg'
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </li>
          ))}
          {devices.length === 0 && (
            <li className='px-4 py-8'>
              <Empty title='No devices registered' description='Add your first device above to start managing playback.' />
            </li>
          )}
        </ul>
      </Card>
    </div>
  );
}
