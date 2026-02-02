import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type { Device, Channel } from '../../types';

interface PlayCommand {
  channelUrl: string;
}

export const useDevices = () => {
  return useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const { data } = await api.get<Device[]>('/devices');
      return data;
    }
  });
};

export const useAddDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (deviceCode: string) => {
      const { data } = await api.post<Device>('/devices', { deviceCode });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    }
  });
};

export const useDeleteDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/devices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    }
  });
};

export const usePlayDevice = () => {
  return useMutation({
    mutationFn: async ({ id, channel }: { id: string; channel: Channel }) => {
      await api.post(`/devices/${id}/play`, { channelId: channel.id });
    }
  });
};

export const useStopDevice = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/devices/${id}/stop`);
    }
  });
};
