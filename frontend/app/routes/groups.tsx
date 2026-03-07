import { useState } from 'react';
import type { Channel, ChannelGroup } from '../types';
import { useChannelGroups, useCreateChannelGroup, useDeleteChannelGroup, useAddChannelToGroup, useRemoveChannelFromGroup } from '../services/queries/useChannelGroups';
import { useChannels } from '../services/queries/useChannels';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Plus, Trash2, PlusCircle, MinusCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';

export default function Groups() {
  const [newGroupName, setNewGroupName] = useState('');
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [addChannelGroupId, setAddChannelGroupId] = useState<string | null>(null);
  const [channelSearch, setChannelSearch] = useState('');

  const debouncedSearch = useDebounce(channelSearch, 400);

  const { data: groups = [], isLoading } = useChannelGroups();
  const createGroup = useCreateChannelGroup();
  const deleteGroup = useDeleteChannelGroup();
  const addChannel = useAddChannelToGroup();
  const removeChannel = useRemoveChannelFromGroup();

  const { data: channelsData } = useChannels(undefined, debouncedSearch || undefined, 1, 50);
  const allChannels = channelsData?.data || [];

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    createGroup.mutate(newGroupName.trim(), {
      onSuccess: () => setNewGroupName('')
    });
  };

  const handleDeleteGroup = (group: ChannelGroup) => {
    if (confirm(`Delete group "${group.name}"?`)) {
      deleteGroup.mutate(group.id);
      if (expandedGroupId === group.id) setExpandedGroupId(null);
    }
  };

  const handleAddChannel = (groupId: string, channel: Channel) => {
    addChannel.mutate({ groupId, channelId: channel.id });
  };

  const handleRemoveChannel = (groupId: string, channel: Channel) => {
    removeChannel.mutate({ groupId, channelId: channel.id });
  };

  // For the add-channel modal, filter out channels already in the group
  const activeGroup = groups.find((g) => g.id === addChannelGroupId);
  const activeGroupChannelIds = new Set(activeGroup?.channels?.map((c) => c.id) ?? []);
  const availableChannels = allChannels.filter((c) => !activeGroupChannelIds.has(c.id));

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
        <h1 className='text-3xl font-bold text-text-primary dark:text-text-primary mb-2'>Channel Groups</h1>
        <p className='text-text-secondary dark:text-text-secondary'>Organise channels into custom groups</p>
      </div>

      {/* Create group form */}
      <div className='bg-white dark:bg-sand/10 border border-sand/10 dark:border-sand/20 rounded-xl shadow-sm p-6'>
        <h3 className='text-lg leading-6 font-medium text-text-primary dark:text-text-primary'>New Group</h3>
        <form onSubmit={handleCreateGroup} className='mt-4 sm:flex sm:items-center gap-3'>
          <div className='w-full sm:max-w-xs'>
            <input
              type='text'
              placeholder='Group name'
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className='shadow-sm focus:ring-2 focus:ring-sea dark:focus:ring-accent-blue block w-full sm:text-sm border-sand/30 dark:border-sand/50 bg-white dark:bg-sand/10 text-text-primary dark:text-text-primary rounded-lg p-2 border'
            />
          </div>
          <button
            type='submit'
            disabled={createGroup.isPending || !newGroupName.trim()}
            className='mt-3 w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-transparent shadow-sm font-medium rounded-lg text-white bg-sea dark:bg-accent-blue hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sea dark:focus:ring-accent-blue sm:mt-0 sm:w-auto sm:text-sm transition-all duration-400 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            <Plus size={16} />
            Create Group
          </button>
        </form>
      </div>

      {/* Groups list */}
      <div className='bg-white dark:bg-sand/10 border border-sand/10 dark:border-sand/20 rounded-xl shadow-sm overflow-hidden'>
        {groups.length === 0 ? (
          <p className='px-6 py-8 text-center text-text-secondary dark:text-text-secondary'>No groups yet. Create one above.</p>
        ) : (
          <ul className='divide-y divide-sand/10 dark:divide-sand/20'>
            {groups.map((group) => {
              const isExpanded = expandedGroupId === group.id;
              return (
                <li key={group.id}>
                  {/* Group header row */}
                  <div
                    className='px-4 py-4 sm:px-6 flex items-center justify-between hover:bg-sand/5 dark:hover:bg-sand/10 transition-colors cursor-pointer'
                    onClick={() => setExpandedGroupId(isExpanded ? null : group.id)}
                  >
                    <div className='flex items-center gap-3 min-w-0'>
                      {isExpanded ? <ChevronDown size={16} className='flex-shrink-0 text-text-secondary' /> : <ChevronRight size={16} className='flex-shrink-0 text-text-secondary' />}
                      <div>
                        <p className='text-sm font-medium text-text-primary dark:text-text-primary'>{group.name}</p>
                        <p className='text-xs text-text-secondary dark:text-text-secondary mt-0.5'>
                          {group.channels?.length ?? 0} channel{(group.channels?.length ?? 0) !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center gap-2 ml-4' onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => { setAddChannelGroupId(group.id); setChannelSearch(''); }}
                        title='Add channel to group'
                        className='inline-flex items-center gap-1 px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-white bg-sea dark:bg-accent-blue hover:opacity-90 transition-all duration-400'
                      >
                        <PlusCircle size={14} />
                        Add
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(group)}
                        title='Delete group'
                        className='inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-white bg-terracotta hover:opacity-90 transition-all duration-400'
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded channels list */}
                  {isExpanded && (
                    <ul className='divide-y divide-sand/5 dark:divide-sand/10 bg-sand/5 dark:bg-sand/5'>
                      {(group.channels ?? []).length === 0 ? (
                        <li className='px-8 py-4 text-sm text-text-secondary dark:text-text-secondary'>No channels in this group. Click Add to add some.</li>
                      ) : (
                        (group.channels ?? []).map((channel: Channel) => (
                          <li key={channel.id} className='px-8 py-3 flex items-center justify-between hover:bg-sand/10 dark:hover:bg-sand/10 transition-colors'>
                            <div className='flex items-center gap-3 min-w-0'>
                              <div className='flex-shrink-0 h-8 w-8 flex items-center justify-center bg-sand/20 dark:bg-sand/30 rounded-full overflow-hidden'>
                                {channel.tvgLogo ? (
                                  <img src={channel.tvgLogo} alt='' className='h-full w-full object-cover' />
                                ) : (
                                  <span className='text-xs font-semibold text-text-secondary'>N/A</span>
                                )}
                              </div>
                              <div className='min-w-0'>
                                <p className='text-sm text-text-primary dark:text-text-primary truncate'>{channel.tvgName}</p>
                                <p className='text-xs text-text-secondary dark:text-text-secondary'>{channel.groupTitle || 'Uncategorized'}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveChannel(group.id, channel)}
                              title='Remove from group'
                              className='flex-shrink-0 ml-4 text-terracotta hover:opacity-80 transition-opacity'
                            >
                              <MinusCircle size={16} />
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Add channel modal */}
      <Modal
        isOpen={!!addChannelGroupId}
        onClose={() => setAddChannelGroupId(null)}
        title={`Add Channel to "${activeGroup?.name || ''}"`}
      >
        <div className='mt-2'>
          <input
            type='text'
            placeholder='Search channels...'
            value={channelSearch}
            onChange={(e) => setChannelSearch(e.target.value)}
            className='block w-full border-sand/30 dark:border-sand/50 bg-white dark:bg-sand/10 text-text-primary dark:text-text-primary rounded-lg shadow-sm focus:ring-2 focus:ring-sea dark:focus:ring-accent-blue focus:border-sea dark:focus:border-accent-blue sm:text-sm p-2 border'
          />
        </div>
        <div className='mt-3 max-h-72 overflow-y-auto divide-y divide-sand/10 dark:divide-sand/20 rounded-lg border border-sand/10 dark:border-sand/20'>
          {availableChannels.length === 0 ? (
            <p className='px-4 py-4 text-sm text-text-secondary dark:text-text-secondary text-center'>
              {channelSearch ? 'No channels match your search.' : 'All channels already added.'}
            </p>
          ) : (
            availableChannels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => {
                  if (addChannelGroupId) handleAddChannel(addChannelGroupId, channel);
                }}
                disabled={addChannel.isPending}
                className='w-full px-4 py-2.5 flex items-center gap-3 hover:bg-sand/10 dark:hover:bg-sand/20 transition-colors text-left disabled:opacity-50'
              >
                <div className='flex-shrink-0 h-7 w-7 flex items-center justify-center bg-sand/20 dark:bg-sand/30 rounded-full overflow-hidden'>
                  {channel.tvgLogo ? (
                    <img src={channel.tvgLogo} alt='' className='h-full w-full object-cover' />
                  ) : (
                    <span className='text-xs text-text-secondary'>N/A</span>
                  )}
                </div>
                <div className='min-w-0'>
                  <p className='text-sm text-text-primary dark:text-text-primary truncate'>{channel.tvgName}</p>
                  <p className='text-xs text-text-secondary dark:text-text-secondary'>{channel.groupTitle || 'Uncategorized'}</p>
                </div>
              </button>
            ))
          )}
        </div>
        <div className='mt-4 flex justify-end'>
          <button
            onClick={() => setAddChannelGroupId(null)}
            className='px-4 py-2 border border-sand/30 dark:border-sand/50 text-sm font-medium rounded-lg text-text-primary dark:text-text-primary hover:bg-sand/10 transition-all duration-400'
          >
            Done
          </button>
        </div>
      </Modal>
    </div>
  );
}
