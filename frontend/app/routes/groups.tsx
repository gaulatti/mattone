import { useState } from 'react';
import { Avatar, Button, Card, Empty, LoadingSpinner, Modal, SectionHeader } from '@gaulatti/bleecker';
import type { Channel, ChannelGroup } from '../types';
import { useChannelGroups, useCreateChannelGroup, useDeleteChannelGroup, useAddChannelToGroup, useRemoveChannelFromGroup } from '../services/queries/useChannelGroups';
import { useChannels, useCreateChannel } from '../services/queries/useChannels';
import { Plus, Trash2, PlusCircle, MinusCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';

export default function Groups() {
  const [newGroupName, setNewGroupName] = useState('');
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [addChannelGroupId, setAddChannelGroupId] = useState<string | null>(null);
  const [channelSearch, setChannelSearch] = useState('');
  const [customChannelName, setCustomChannelName] = useState('');
  const [customChannelStreamUrl, setCustomChannelStreamUrl] = useState('');
  const [customChannelLogo, setCustomChannelLogo] = useState('');
  const [customChannelGroupTitle, setCustomChannelGroupTitle] = useState('');
  const [customChannelError, setCustomChannelError] = useState('');

  const debouncedSearch = useDebounce(channelSearch, 400);

  const { data: groups = [], isLoading } = useChannelGroups();
  const createGroup = useCreateChannelGroup();
  const deleteGroup = useDeleteChannelGroup();
  const addChannel = useAddChannelToGroup();
  const removeChannel = useRemoveChannelFromGroup();
  const createChannel = useCreateChannel();

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

  const closeAddChannelModal = () => {
    setAddChannelGroupId(null);
    setChannelSearch('');
    setCustomChannelName('');
    setCustomChannelStreamUrl('');
    setCustomChannelLogo('');
    setCustomChannelGroupTitle('');
    setCustomChannelError('');
  };

  const getApiErrorMessage = (error: any): string => {
    const apiMessage = error?.response?.data?.message;
    if (Array.isArray(apiMessage)) {
      return apiMessage.join(', ');
    }
    return apiMessage || error?.message || 'Request failed';
  };

  const handleCreateCustomChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addChannelGroupId) return;
    if (!customChannelName.trim() || !customChannelStreamUrl.trim()) return;

    setCustomChannelError('');

    createChannel.mutate(
      {
        tvgName: customChannelName.trim(),
        streamUrl: customChannelStreamUrl.trim(),
        tvgLogo: customChannelLogo.trim() || undefined,
        groupTitle: customChannelGroupTitle.trim() || undefined
      },
      {
        onSuccess: (channel) => {
          addChannel.mutate(
            { groupId: addChannelGroupId, channelId: channel.id },
            {
              onSuccess: () => {
                setCustomChannelName('');
                setCustomChannelStreamUrl('');
                setCustomChannelLogo('');
                setCustomChannelGroupTitle('');
                setCustomChannelError('');
              },
              onError: (error) => {
                setCustomChannelError(getApiErrorMessage(error));
              }
            }
          );
        },
        onError: (error) => {
          setCustomChannelError(getApiErrorMessage(error));
        }
      }
    );
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
      <SectionHeader className='mb-8' title='Channel Groups' description='Organise channels into custom groups' />

      {/* Create group form */}
      <Card>
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
          <Button
            type='submit'
            disabled={createGroup.isPending || !newGroupName.trim()}
            className='mt-3 w-full gap-1.5 rounded-lg sm:mt-0 sm:w-auto sm:text-sm'
          >
            <Plus size={16} />
            Create Group
          </Button>
        </form>
      </Card>

      {/* Groups list */}
      <Card className='overflow-hidden p-0'>
        {groups.length === 0 ? (
          <div className='px-6 py-8'>
            <Empty title='No groups yet' description='Create your first channel group above.' />
          </div>
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
                      <Button
                        size='sm'
                        onClick={() => {
                          setAddChannelGroupId(group.id);
                          setChannelSearch('');
                          setCustomChannelName('');
                          setCustomChannelStreamUrl('');
                          setCustomChannelLogo('');
                          setCustomChannelGroupTitle('');
                          setCustomChannelError('');
                        }}
                        title='Add channel to group'
                        className='gap-1 rounded-lg py-1.5 text-xs'
                      >
                        <PlusCircle size={14} />
                        Add
                      </Button>
                      <Button
                        variant='destructive'
                        size='sm'
                        onClick={() => handleDeleteGroup(group)}
                        title='Delete group'
                        className='rounded-lg py-1.5 text-xs'
                      >
                        <Trash2 size={14} />
                      </Button>
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
                              <Avatar src={channel.tvgLogo} fallback={channel.tvgName} size='sm' />
                              <div className='min-w-0'>
                                <p className='text-sm text-text-primary dark:text-text-primary truncate'>{channel.tvgName}</p>
                                <p className='text-xs text-text-secondary dark:text-text-secondary'>{channel.groupTitle || 'Uncategorized'}</p>
                              </div>
                            </div>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleRemoveChannel(group.id, channel)}
                              title='Remove from group'
                              className='ml-4 h-auto shrink-0 rounded-lg px-1.5 py-1 text-terracotta hover:translate-y-0 hover:bg-transparent hover:text-terracotta/80 dark:hover:bg-transparent'
                            >
                              <MinusCircle size={16} />
                            </Button>
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
      </Card>

      {/* Add channel modal */}
      <Modal
        isOpen={!!addChannelGroupId}
        onClose={closeAddChannelModal}
        title={`Add Channel to "${activeGroup?.name || ''}"`}
      >
        <form onSubmit={handleCreateCustomChannel} className='mt-1 p-3 rounded-lg border border-sand/20 dark:border-sand/30 bg-sand/5 dark:bg-sand/10 space-y-2.5'>
          <h4 className='text-sm font-medium text-text-primary dark:text-text-primary'>Create custom channel item</h4>
          <input
            type='text'
            placeholder='Channel name *'
            value={customChannelName}
            onChange={(e) => setCustomChannelName(e.target.value)}
            className='block w-full border-sand/30 dark:border-sand/50 bg-white dark:bg-sand/10 text-text-primary dark:text-text-primary rounded-lg shadow-sm focus:ring-2 focus:ring-sea dark:focus:ring-accent-blue focus:border-sea dark:focus:border-accent-blue sm:text-sm p-2 border'
          />
          <input
            type='url'
            placeholder='Stream URL *'
            value={customChannelStreamUrl}
            onChange={(e) => setCustomChannelStreamUrl(e.target.value)}
            className='block w-full border-sand/30 dark:border-sand/50 bg-white dark:bg-sand/10 text-text-primary dark:text-text-primary rounded-lg shadow-sm focus:ring-2 focus:ring-sea dark:focus:ring-accent-blue focus:border-sea dark:focus:border-accent-blue sm:text-sm p-2 border'
          />
          <input
            type='text'
            placeholder='Group title (optional)'
            value={customChannelGroupTitle}
            onChange={(e) => setCustomChannelGroupTitle(e.target.value)}
            className='block w-full border-sand/30 dark:border-sand/50 bg-white dark:bg-sand/10 text-text-primary dark:text-text-primary rounded-lg shadow-sm focus:ring-2 focus:ring-sea dark:focus:ring-accent-blue focus:border-sea dark:focus:border-accent-blue sm:text-sm p-2 border'
          />
          <input
            type='url'
            placeholder='Logo URL (optional)'
            value={customChannelLogo}
            onChange={(e) => setCustomChannelLogo(e.target.value)}
            className='block w-full border-sand/30 dark:border-sand/50 bg-white dark:bg-sand/10 text-text-primary dark:text-text-primary rounded-lg shadow-sm focus:ring-2 focus:ring-sea dark:focus:ring-accent-blue focus:border-sea dark:focus:border-accent-blue sm:text-sm p-2 border'
          />
          {customChannelError && (
            <p className='text-xs text-terracotta'>{customChannelError}</p>
          )}
          <div className='flex justify-end'>
            <Button
              type='submit'
              disabled={!customChannelName.trim() || !customChannelStreamUrl.trim() || createChannel.isPending || addChannel.isPending}
              size='sm'
              className='gap-1.5 rounded-lg py-1.5 text-xs'
            >
              <Plus size={14} />
              {createChannel.isPending || addChannel.isPending ? 'Creating...' : 'Create & Add'}
            </Button>
          </div>
        </form>

        <div className='mt-4 flex items-center gap-3'>
          <div className='h-px flex-1 bg-sand/20 dark:bg-sand/30' />
          <p className='text-xs text-text-secondary dark:text-text-secondary'>or add an existing channel</p>
          <div className='h-px flex-1 bg-sand/20 dark:bg-sand/30' />
        </div>

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
              <Button
                key={channel.id}
                onClick={() => {
                  if (addChannelGroupId) handleAddChannel(addChannelGroupId, channel);
                }}
                disabled={addChannel.isPending}
                variant='ghost'
                className='w-full justify-start gap-3 rounded-none px-4 py-2.5 hover:translate-y-0'
              >
                <Avatar src={channel.tvgLogo} fallback={channel.tvgName} size='sm' className='h-7 w-7 text-[10px]' />
                <div className='min-w-0'>
                  <p className='text-sm text-text-primary dark:text-text-primary truncate'>{channel.tvgName}</p>
                  <p className='text-xs text-text-secondary dark:text-text-secondary'>{channel.groupTitle || 'Uncategorized'}</p>
                </div>
              </Button>
            ))
          )}
        </div>
        <div className='mt-4 flex justify-end'>
          <Button
            variant='secondary'
            onClick={closeAddChannelModal}
            className='rounded-lg border-sand/30 dark:border-sand/50'
          >
            Done
          </Button>
        </div>
      </Modal>
    </div>
  );
}
