package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Device struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey"`
	DeviceCode string    `gorm:"type:varchar(255);uniqueIndex;not null"`
	UserID     uuid.UUID `gorm:"type:uuid;not null;index"`
	User       User      `gorm:"foreignKey:UserID"`
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

func (d *Device) BeforeCreate(tx *gorm.DB) error {
	if d.ID == uuid.Nil {
		d.ID = uuid.New()
	}
	return nil
}
