import Hls from 'hls.js';
import mpegts from 'mpegts.js';
import { useEffect, useRef, useState } from 'react';
import { LoadingSpinner, Modal } from '@gaulatti/bleecker';

import type { Channel } from '../../types';
import { api, apiUrl } from '../../services/api';

function isTransportStream(url: string): boolean {
  try {
    return new URL(url).pathname.toLowerCase().endsWith('.ts');
  } catch {
    return /\.ts(?:$|[?#])/i.test(url);
  }
}

function isHls(url: string): boolean {
  try {
    return new URL(url).pathname.toLowerCase().endsWith('.m3u8');
  } catch {
    return /\.m3u8(?:$|[?#])/i.test(url);
  }
}

function StreamPlayer({ source, format }: { source: string; format: 'hls' | 'ts' | 'unknown' }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | undefined;
    let transportPlayer: mpegts.Player | undefined;

    if ((format === 'ts' || isTransportStream(source)) && mpegts.getFeatureList().mseLivePlayback) {
      transportPlayer = mpegts.createPlayer({ type: 'mpegts', isLive: true, url: source });
      transportPlayer.attachMediaElement(video);
      transportPlayer.load();
      void transportPlayer.play();
    } else if ((format === 'hls' || isHls(source)) && Hls.isSupported()) {
      hls = new Hls({ lowLatencyMode: true });
      hls.loadSource(source);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => void video.play());
    } else {
      video.src = source;
      void video.play();
    }

    return () => {
      hls?.destroy();
      transportPlayer?.destroy();
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, [source]);

  return <video ref={videoRef} controls autoPlay playsInline className='aspect-video w-full rounded-xl bg-black' />;
}

export default function InAppStreamModal({ channel, onClose }: { channel: Channel | null; onClose: () => void }) {
  const [source, setSource] = useState<string | null>(null);
  const [format, setFormat] = useState<'hls' | 'ts' | 'unknown'>('unknown');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!channel) {
      setSource(null);
      setFormat('unknown');
      setError(null);
      return;
    }

    let active = true;
    setSource(null);
    setError(null);
    api
      .get<{ streamUrl: string; format: 'hls' | 'ts' | 'unknown' }>(`/channels/${channel.id}/playback`)
      .then(({ data }) => {
        if (active) {
          setSource(apiUrl(data.streamUrl));
          setFormat(data.format);
        }
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        const message = requestError instanceof Error ? requestError.message : 'Could not load this stream.';
        setError(message);
      });

    return () => {
      active = false;
    };
  }, [channel]);

  return (
    <Modal isOpen={Boolean(channel)} onClose={onClose} title={channel ? `Play ${channel.tvgName}` : 'Play channel'} className='max-w-4xl'>
      <div className='mt-3'>
        {source ? <StreamPlayer source={source} format={format} /> : error ? <p className='rounded-lg bg-terracotta/10 p-4 text-sm text-terracotta'>{error}</p> : <div className='flex aspect-video items-center justify-center rounded-xl bg-deep-sea'><LoadingSpinner size='lg' /></div>}
        <p className='mt-3 text-sm text-text-secondary dark:text-text-secondary'>Playing here does not change playback on any connected device.</p>
      </div>
    </Modal>
  );
}
