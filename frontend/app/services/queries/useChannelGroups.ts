import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type { ChannelGroup } from '../../types';

export const useChannelGroups = () => {
  return useQuery({
    queryKey: ['channelGroups'],
    queryFn: async () => {
      const { data } = await api.get<ChannelGroup[]>('/channel-groups');
      return data;
    }
  });
};

export const useCreateChannelGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data } = await api.post<ChannelGroup>('/channel-groups', { name });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channelGroups'] });
    }
  });
};

export const useDeleteChannelGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/channel-groups/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channelGroups'] });
    }
  });
};

export const useAddChannelToGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, channelId }: { groupId: string; channelId: string }) => {
      const { data } = await api.post(`/channel-groups/${groupId}/channels/${channelId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channelGroups'] });
    }
  });
};

export const useRemoveChannelFromGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, channelId }: { groupId: string; channelId: string }) => {
      await api.delete(`/channel-groups/${groupId}/channels/${channelId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channelGroups'] });
    }
  });
};
