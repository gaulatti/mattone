import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type { Device, Channel } from '../../types';

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

export const useUpdateDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, nickname }: { id: string; nickname: string }) => {
      const { data } = await api.patch<Device>(`/devices/${id}`, { nickname });
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

export const useEnableQuadMode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<Device>(`/devices/${id}/quad/enable`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    }
  });
};

export const useDisableQuadMode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<Device>(`/devices/${id}/quad/disable`);
      return data;
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

export const usePlayQuadrant = () => {
  return useMutation({
    mutationFn: async ({
      id,
      channel,
      quadrant
    }: {
      id: string;
      channel: Channel;
      quadrant?: number;
    }) => {
      const { data } = await api.post<{ status: string; quadrant: number }>(
        `/devices/${id}/quad/play`,
        { channelId: channel.id, quadrant }
      );
      return data;
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

export const useStopQuadrant = () => {
  return useMutation({
    mutationFn: async ({ id, quadrant }: { id: string; quadrant: number }) => {
      await api.post(`/devices/${id}/quad/stop/${quadrant}`);
    }
  });
};

export const useCallsignDevice = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/devices/${id}/callsign`);
    }
  });
};

