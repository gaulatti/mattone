import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type { ImportResult, M3uSource } from '../../types';

export interface ImportChannelsInput {
  url: string;
  autoRefresh?: boolean;
  refreshIntervalMinutes?: number;
}

export const useImportChannels = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ImportChannelsInput) => {
      const { data } = await api.post<ImportResult>('/channels/import', input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      queryClient.invalidateQueries({ queryKey: ['channelGroups'] });
      queryClient.invalidateQueries({ queryKey: ['m3uSources'] });
    }
  });
};

export const useImportM3uFile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const { data } = await api.post<ImportResult>('/channels/import/file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      queryClient.invalidateQueries({ queryKey: ['channelGroups'] });
    }
  });
};

export const useM3uSources = () => {
  return useQuery({
    queryKey: ['m3uSources'],
    queryFn: async () => {
      const { data } = await api.get<M3uSource[]>('/channels/sources');
      return data;
    }
  });
};

export const useUpdateM3uSource = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...changes }: { id: string; autoRefresh?: boolean; refreshIntervalMinutes?: number }) => {
      const { data } = await api.patch<M3uSource>(`/channels/sources/${id}`, changes);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['m3uSources'] });
    }
  });
};

export const useDeleteM3uSource = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/channels/sources/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['m3uSources'] });
    }
  });
};

export const useRefreshM3uSource = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<ImportResult>(`/channels/sources/${id}/refresh`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      queryClient.invalidateQueries({ queryKey: ['channelGroups'] });
      queryClient.invalidateQueries({ queryKey: ['m3uSources'] });
    }
  });
};
