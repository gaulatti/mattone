# mattone - TV Streaming Controller Backend

A Go backend service using Echo framework for managing TV streaming devices and channels.

## Tech Stack

- **Echo v5**: HTTP web framework
- **GORM**: ORM with PostgreSQL driver
- **JWT**: Authentication via AWS Cognito JWKS
- **SSE**: Server-Sent Events for device communication

## Project Structure

```
mattone/
├── main.go              # Entry point, Echo setup, routes
├── config/              # Environment configuration
├── db/                  # Database connection and migrations
├── middleware/          # JWT authentication middleware
├── models/              # Data models (User, Device, Channel)
├── handlers/            # HTTP request handlers
└── services/            # Business logic (SSE, M3U parsing)
```

## Environment Variables

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=your_password
DB_NAME=mattone

# AWS Cognito
COGNITO_REGION=us-east-1
COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx

# Server
PORT=8080
```

## API Endpoints

### Public (No Authentication)

- `GET /devices/whoami` - Check if device is registered (requires `X-Device-ID` header)
- `GET /sse/events` - SSE endpoint for devices (requires `X-Device-ID` header)

### Protected (JWT Required)

#### Devices

- `POST /devices` - Register a device
- `GET /devices` - List user's devices
- `DELETE /devices/:id` - Unregister a device
- `POST /devices/:id/play` - Send play command to device
- `POST /devices/:id/stop` - Send stop command to device

#### Channels

- `POST /channels/import` - Import channels from M3U URL
- `GET /channels` - List all channels (optional `?group=` filter)
- `GET /channels/groups` - List all unique group titles

## Getting Started

1. Set up PostgreSQL database
2. Configure environment variables
3. Run the application:

```bash
go run main.go
```

## Models

### User

- Maps to Cognito user via `sub` claim
- Auto-created on first authenticated request

### Device

- 10-character device code (e.g., X4K7N9P2QR)
- Associated with a user
- Connects via SSE for receiving commands

### Channel

- Parsed from M3U files
- Contains stream URL, logo, group information
- Supports filtering by group

## SSE Communication

Devices connect to `/sse/events` and receive commands in real-time:

```json
{
  "type": "play",
  "payload": {
    "url": "https://..."
  }
}
```

Command types:

- `play` - Start playback (m3u or youtube)
- `stop` - Stop playback
- `connected` - Initial connection confirmation

## M3U Import

The M3U parser extracts:

- `tvg-name` - Channel name
- `tvg-logo` - Channel logo URL
- `group-title` - Channel category
- Stream URL

Supports standard M3U format with EXTINF metadata.
