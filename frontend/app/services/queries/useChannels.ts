import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type { Channel } from '../../types';

export const useChannels = (group?: string, search?: string, page: number = 1, limit: number = 50) => {
  return useQuery({
    queryKey: ['channels', group, search, page, limit],
    queryFn: async () => {
      const params: any = { page, limit };
      if (group) params.group = group;
      if (search) params.search = search;

      const { data } = await api.get<{ data: Channel[]; total: number }>('/channels', { params });
      return data;
    },
    placeholderData: (previousData) => previousData // Keep previous data while fetching new page
  });
};

export const useChannelGroups = () => {
  return useQuery({
    queryKey: ['channelGroups'],
    queryFn: async () => {
      const { data } = await api.get<string[]>('/channels/groups');
      return data;
    }
  });
};

export interface CreateChannelInput {
  tvgName: string;
  streamUrl: string;
  tvgLogo?: string;
  groupTitle?: string;
}

export const useCreateChannel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateChannelInput) => {
      const { data } = await api.post<Channel>('/channels', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      queryClient.invalidateQueries({ queryKey: ['channelGroups'] });
    }
  });
};
