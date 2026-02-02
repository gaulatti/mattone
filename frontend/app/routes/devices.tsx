import { useState } from 'react';
import type { Device } from '../types';
import { useDevices, useAddDevice, useDeleteDevice } from '../services/queries/useDevices';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Devices() {
  const [newDeviceCode, setNewDeviceCode] = useState('');
  const { data: devices = [], isLoading } = useDevices();
  const addDevice = useAddDevice();
  const deleteDevice = useDeleteDevice();

  const handleDelete = (device: Device) => {
    if (confirm(`Are you sure you want to delete device ${device.deviceCode}?`)) {
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
                  <div>
                    <div className='flex text-sm font-medium text-sea dark:text-accent-blue truncate'>
                      <p>{device.deviceCode}</p>
                    </div>
                    <div className='mt-2 flex'>
                      <div className='flex items-center text-sm text-text-secondary dark:text-text-secondary'>
                        <p>Registered on {new Date(device.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className='ml-5 flex-shrink-0'>
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
