import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type { ImportResult } from '../../types';

export const useImportChannels = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (url: string) => {
      const { data } = await api.post<ImportResult>('/channels/import', { url });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      queryClient.invalidateQueries({ queryKey: ['channelGroups'] });
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
