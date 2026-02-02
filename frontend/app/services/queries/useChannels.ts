import { useQuery } from '@tanstack/react-query';
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
