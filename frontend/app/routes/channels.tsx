import { lazy, Suspense, useState, useEffect } from "react";
import {
  Avatar,
  Button,
  Card,
  Empty,
  LoadingSpinner,
  Modal,
  Pagination,
  SectionHeader,
  Select,
} from "@gaulatti/bleecker";
import type { Channel } from "../types";
import {
  useChannels,
  useChannelGroupTitles,
} from "../services/queries/useChannels";
import {
  useDevices,
  usePlayDevice,
  usePlayQuadrant,
  useCallsignDevice,
} from "../services/queries/useDevices";
import { useSelectedDevice } from "../hooks/useSelectedDevice";
import { useDebounce } from "../hooks/useDebounce";
import { Radio, Send } from "lucide-react";
import { apiUrl } from "../services/api";

const InAppStreamModal = lazy(
  () => import("../components/common/InAppStreamModal"),
);

const PAGE_SIZE = 50;

export default function Channels() {
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [activeChannelForPlay, setActiveChannelForPlay] =
    useState<Channel | null>(null);
  const [modalDeviceId, setModalDeviceId] = useState<string>("");
  const [modalQuadrant, setModalQuadrant] = useState<string>("");
  const [activeChannelForLocalPlay, setActiveChannelForLocalPlay] = useState<Channel | null>(null);

  const { selectedDeviceId, setSelectedDeviceId } = useSelectedDevice();

  const debouncedSearch = useDebounce(searchQuery, 500);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedGroup, debouncedSearch]);

  const { data, isLoading: isLoadingChannels } = useChannels(
    selectedGroup,
    debouncedSearch,
    page,
    PAGE_SIZE,
  );
  const { data: groups = [] } = useChannelGroupTitles();
  const { data: devices = [] } = useDevices();
  const playDevice = usePlayDevice();
  const playQuadrant = usePlayQuadrant();
  const callsignDevice = useCallsignDevice();

  const channels = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId);
  const modalDevice = devices.find((d) => d.id === modalDeviceId);
  const selectedDeviceLabel =
    selectedDevice?.nickname || selectedDevice?.deviceCode || "selected TV";

  // Quick-send: send channel to currently selected device without a modal
  const handleQuickSend = (channel: Channel) => {
    if (!selectedDeviceId || !selectedDevice) return;
    if (selectedDevice.layoutMode === "quad") {
      handlePlayClick(channel);
    } else {
      playDevice.mutate({ id: selectedDeviceId, channel });
    }
  };

  // Full play modal (when no device is pre-selected or user wants to pick)
  const handlePlayClick = (channel: Channel) => {
    setActiveChannelForPlay(channel);
    setModalDeviceId(selectedDeviceId);
    setModalQuadrant("");
  };

  const handleConfirmPlay = () => {
    if (!activeChannelForPlay || !modalDeviceId || !modalDevice) return;

    if (modalDevice.layoutMode === "quad") {
      const quadrant = Number.parseInt(modalQuadrant, 10);
      playQuadrant.mutate(
        { id: modalDeviceId, channel: activeChannelForPlay, quadrant },
        {
          onSuccess: () => {
            setSelectedDeviceId(modalDeviceId);
            setActiveChannelForPlay(null);
            setModalQuadrant("");
          },
        },
      );
    } else {
      playDevice.mutate(
        { id: modalDeviceId, channel: activeChannelForPlay },
        {
          onSuccess: () => {
            setSelectedDeviceId(modalDeviceId);
            setActiveChannelForPlay(null);
          },
        },
      );
    }
  };

  const handleCancelPlay = () => {
    setActiveChannelForPlay(null);
    setModalQuadrant("");
  };

  const handleCallsign = () => {
    if (modalDeviceId) {
      callsignDevice.mutate(modalDeviceId);
    }
  };

  if (isLoadingChannels && page === 1) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <SectionHeader
        className="mb-8"
        title="Channels"
        description={`Browse and manage available channels (${total} total)`}
      />

      {/* Filters */}
      <Card className="flex flex-col gap-4 p-4 sm:flex-row">
        <div className="flex-1">
          <label
            htmlFor="search"
            className="block text-sm font-medium text-text-primary dark:text-text-primary mb-1"
          >
            Search
          </label>
          <input
            type="text"
            id="search"
            className="mt-1 block w-full border-sand/30 dark:border-sand/50 bg-white dark:bg-sand/10 text-text-primary dark:text-text-primary rounded-lg shadow-sm focus:ring-2 focus:ring-sea dark:focus:ring-accent-blue focus:border-sea dark:focus:border-accent-blue sm:text-sm p-2 border"
            placeholder="Search channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="sm:w-64">
          <label
            htmlFor="group"
            className="block text-sm font-medium text-text-primary dark:text-text-primary mb-1"
          >
            Group
          </label>
          <Select
            value={selectedGroup}
            onChange={setSelectedGroup}
            options={[
              { label: "All Groups", value: "" },
              ...groups.map((group) => ({ label: group, value: group })),
            ]}
          />
        </div>
      </Card>

      {/* Channel List */}
      <Card className="overflow-hidden p-0">
        <ul className="divide-y divide-sand/10 dark:divide-sand/20">
          {channels.map((channel) => (
            <li
              key={channel.id}
              className="px-4 py-4 flex items-center sm:px-6 hover:bg-sand/5 dark:hover:bg-sand/10 transition-colors"
            >
              <Avatar
                src={channel.tvgLogo ? apiUrl(`/channels/${channel.id}/logo`) : undefined}
                fallback={channel.tvgName}
                size="md"
              />
              <div className="ml-4 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-sea dark:text-accent-blue truncate">
                    {channel.tvgName}
                  </p>
                </div>
                <div className="mt-1">
                  <p className="flex items-center text-sm text-text-secondary dark:text-text-secondary">
                    {channel.groupTitle || "Uncategorized"}
                  </p>
                </div>
              </div>
              <div className="ml-4 flex-shrink-0 flex items-center gap-2">
                {selectedDeviceId && (
                  <Button
                    size="sm"
                    onClick={() => handleQuickSend(channel)}
                    disabled={playDevice.isPending || playQuadrant.isPending}
                    title={`Send to ${selectedDeviceLabel}${selectedDevice?.layoutMode === "quad" ? " (quad)" : ""}`}
                    className="gap-1 rounded-lg bg-sea/80 py-1.5 text-xs hover:bg-sea dark:bg-accent-blue/80 dark:hover:bg-accent-blue"
                  >
                    <Send size={12} />
                    {selectedDevice?.layoutMode === "quad"
                      ? "Choose Quad Slot"
                      : "Send"}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setActiveChannelForLocalPlay(channel)}
                  className="rounded-lg border-sand/30 bg-white py-1.5 text-xs dark:border-sand/50 dark:bg-sand/10"
                >
                  Play here
                </Button>
                <Button
                  size="sm"
                  onClick={() => handlePlayClick(channel)}
                  className="rounded-lg py-1.5 text-xs"
                >
                  Play
                </Button>
              </div>
            </li>
          ))}
          {channels.length === 0 && (
            <li className="px-4 py-8">
              <Empty
                title="No channels found"
                description="Try adjusting your search or selected group."
              />
            </li>
          )}
        </ul>

        {/* Pagination */}
        {total > 0 && (
          <div className="border-t border-sand/10 bg-white px-4 py-3 dark:border-sand/20 dark:bg-sand/5 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-text-secondary dark:text-text-secondary">
                  Showing{" "}
                  <span className="font-medium">
                    {Math.min((page - 1) * PAGE_SIZE + 1, total)}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(page * PAGE_SIZE, total)}
                  </span>{" "}
                  of <span className="font-medium">{total}</span> results
                </p>
              </div>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                hasPrevPage={page > 1}
                hasNextPage={page < totalPages}
                onPageChange={setPage}
                className="mt-0 sm:justify-end"
              />
            </div>
          </div>
        )}
      </Card>

      {/* Play Modal */}
      <Modal
        isOpen={!!activeChannelForPlay}
        onClose={handleCancelPlay}
        title={`Play ${activeChannelForPlay?.tvgName || ""}`}
      >
        <div className="mt-2">
          <p className="text-sm text-text-secondary dark:text-text-secondary">
            Select a device to send this channel to.
          </p>
          <div className="mt-4">
            <Select
              value={modalDeviceId}
              onChange={(deviceId) => {
                setModalDeviceId(deviceId);
                setModalQuadrant("");
              }}
              options={[
                { label: "Select a device", value: "" },
                ...devices.map((d) => ({
                  label: `${d.nickname || d.deviceCode}${d.layoutMode === "quad" ? " (Quad)" : ""}`,
                  value: d.id,
                })),
              ]}
            />
          </div>
          {modalDevice?.layoutMode === "quad" && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-text-primary dark:text-text-primary mb-2">
                Choose a slot
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[0, 1, 2, 3].map((quadrant) => {
                  const active = modalDevice.activeQuadrants.find(
                    (item) => item.quadrant === quadrant,
                  );
                  const selected = modalQuadrant === String(quadrant);
                  return (
                    <button
                      key={quadrant}
                      type="button"
                      onClick={() => setModalQuadrant(String(quadrant))}
                      className={`rounded-lg border p-3 text-left transition-colors ${
                        selected
                          ? "border-sea bg-sea/10 dark:border-accent-blue dark:bg-accent-blue/10"
                          : "border-sand/30 bg-white hover:bg-sand/5 dark:border-sand/50 dark:bg-sand/10 dark:hover:bg-sand/20"
                      }`}
                    >
                      <span className="block text-xs font-semibold text-text-secondary dark:text-text-secondary">
                        Slot {quadrant + 1}
                      </span>
                      <span className="mt-1 block truncate text-sm font-medium text-text-primary dark:text-text-primary">
                        {active?.channelName ||
                          (active ? "Current channel" : "Empty")}
                      </span>
                      {active && (
                        <span className="mt-1 block text-xs text-text-secondary dark:text-text-secondary">
                          Replaces current playback
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {modalDeviceId && modalDevice?.layoutMode !== "quad" && (
            <div className="mt-4">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleCallsign}
                disabled={callsignDevice.isPending}
                className="gap-1 rounded-lg border-sand/30 bg-white dark:border-sand/50 dark:bg-sand/10 dark:hover:bg-sand/20"
              >
                <Radio size={14} />
                Callsign
              </Button>
            </div>
          )}
        </div>
        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancelPlay}
            className="w-full rounded-lg border-sand/30 bg-white dark:border-sand/50 dark:bg-sand/10 dark:hover:bg-sand/20 sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirmPlay}
            disabled={
              !modalDeviceId ||
              playDevice.isPending ||
              playQuadrant.isPending ||
              (modalDevice?.layoutMode === "quad" && !modalQuadrant)
            }
            className="w-full rounded-lg sm:w-auto"
          >
            {playDevice.isPending || playQuadrant.isPending
              ? "Starting..."
              : modalDevice?.layoutMode === "quad"
                ? "Play in Selected Slot"
                : "Confirm Play"}
          </Button>
        </div>
      </Modal>
      {activeChannelForLocalPlay ? (
        <Suspense fallback={null}>
          <InAppStreamModal
            channel={activeChannelForLocalPlay}
            onClose={() => setActiveChannelForLocalPlay(null)}
          />
        </Suspense>
      ) : null}
    </div>
  );
}
