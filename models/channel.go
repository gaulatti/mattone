package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Channel struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey"`
	TvgName    string    `gorm:"type:varchar(255)"`
	TvgLogo    string    `gorm:"type:varchar(512)"`
	GroupTitle string    `gorm:"type:varchar(255);index"`
	StreamURL  string    `gorm:"type:text;not null"`
	SourceURL  string    `gorm:"type:text;not null"`
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

func (c *Channel) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}
