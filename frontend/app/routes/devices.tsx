import { useState } from 'react';
import type { Device } from '../types';
import { useDevices, useAddDevice, useDeleteDevice, useUpdateDevice, useStopDevice } from '../services/queries/useDevices';
import LoadingSpinner from '../components/common/LoadingSpinner';
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
      { id: device.id, nickname: editingNickname },
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
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-text-primary dark:text-text-primary mb-2'>Devices</h1>
        <p className='text-text-secondary dark:text-text-secondary'>Manage your streaming devices</p>
      </div>

      {/* Add Device Form */}
      <div className='bg-white dark:bg-sand/10 border border-sand/10 dark:border-sand/20 rounded-xl shadow-sm p-6'>
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
          <button
            type='submit'
            className='mt-3 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm font-medium rounded-lg text-white bg-sea dark:bg-accent-blue hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sea dark:focus:ring-accent-blue sm:mt-0 sm:w-auto sm:text-sm transition-all duration-400'
          >
            Add Device
          </button>
        </form>
      </div>

      {/* Devices List */}
      <div className='bg-white dark:bg-sand/10 border border-sand/10 dark:border-sand/20 rounded-xl shadow-sm overflow-hidden'>
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
                          <button
                            onClick={() => handleEditSave(device)}
                            disabled={updateDevice.isPending}
                            className='text-sea dark:text-accent-blue hover:opacity-80 transition-opacity'
                            aria-label='Save nickname'
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={handleEditCancel}
                            className='text-text-secondary hover:opacity-80 transition-opacity'
                            aria-label='Cancel'
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className='text-sm text-text-secondary dark:text-text-secondary'>
                            {device.nickname || <em className='opacity-50'>No nickname</em>}
                          </span>
                          <button
                            onClick={() => handleEditStart(device)}
                            className='text-text-secondary hover:text-sea dark:hover:text-accent-blue transition-colors'
                            aria-label='Edit nickname'
                          >
                            <Pencil size={14} />
                          </button>
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
                  <button
                    onClick={() => handleStop(device)}
                    disabled={stopDevice.isPending}
                    title='Stop stream on this device'
                    className='inline-flex items-center gap-1 px-3 py-2 border border-sand/30 dark:border-sand/50 text-sm leading-4 font-medium rounded-lg text-text-primary dark:text-text-primary bg-white dark:bg-sand/10 hover:bg-sand/10 dark:hover:bg-sand/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sea dark:focus:ring-accent-blue transition-all duration-400 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    <Square size={14} />
                    Stop
                  </button>
                  <button
                    onClick={() => handleDelete(device)}
                    className='inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-lg text-white bg-terracotta dark:bg-terracotta hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-terracotta transition-all duration-400'
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
          {devices.length === 0 && <li className='px-4 py-8 text-center text-text-secondary dark:text-text-secondary'>No devices registered.</li>}
        </ul>
      </div>
    </div>
  );
}
