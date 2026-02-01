package db

import (
	"fmt"

	"github.com/gaulatti/mattone/models"
)

func Migrate() error {
	if DB == nil {
		return fmt.Errorf("database not initialized")
	}

	err := DB.AutoMigrate(
		&models.User{},
		&models.Device{},
		&models.Channel{},
	)
	if err != nil {
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	return nil
}
