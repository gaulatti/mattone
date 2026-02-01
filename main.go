package main

import (
	"fmt"
	"log"

	"github.com/gaulatti/mattone/config"
	"github.com/gaulatti/mattone/db"
	"github.com/gaulatti/mattone/handlers"
	"github.com/gaulatti/mattone/middleware"
	"github.com/gaulatti/mattone/services"
	"github.com/labstack/echo/v5"
	echomiddleware "github.com/labstack/echo/v5/middleware"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Connect to database
	if err := db.Connect(cfg); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Run migrations
	if err := db.Migrate(); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	log.Println("Database connected and migrations completed")

	// Initialize services
	sseService := services.NewSSEService()

	// Initialize handlers
	deviceHandler := handlers.NewDeviceHandler(sseService)
	channelHandler := handlers.NewChannelHandler()
	m3uHandler := handlers.NewM3UHandler()
	sseHandler := handlers.NewSSEHandler(sseService)

	// Initialize JWT validator
	jwtValidator := middleware.NewJWTValidator(&cfg.Cognito)

	// Create Echo instance
	e := echo.New()

	// Middleware
	e.Use(echomiddleware.Logger())
	e.Use(echomiddleware.Recover())
	e.Use(echomiddleware.CORS())

	// Public routes
	e.GET("/devices/whoami", deviceHandler.WhoAmI)
	e.GET("/sse/events", sseHandler.HandleSSE)

	// Protected routes (require JWT authentication)
	protected := e.Group("")
	protected.Use(jwtValidator.Middleware())

	// Device routes
	protected.POST("/devices", deviceHandler.RegisterDevice)
	protected.GET("/devices", deviceHandler.ListDevices)
	protected.DELETE("/devices/:id", deviceHandler.DeleteDevice)
	protected.POST("/devices/:id/play", deviceHandler.PlayOnDevice)
	protected.POST("/devices/:id/stop", deviceHandler.StopOnDevice)

	// Channel routes
	protected.POST("/channels/import", m3uHandler.ImportM3U)
	protected.GET("/channels", channelHandler.ListChannels)
	protected.GET("/channels/groups", channelHandler.ListGroups)

	// Start server
	address := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("Starting server on %s", address)
	if err := e.Start(address); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
