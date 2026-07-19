package main

import (
	"context"
	_ "embed"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

//go:embed migrations/001_init.sql
var initSQL string

var pool *pgxpool.Pool

func connectDB(ctx context.Context, databaseURL string) *pgxpool.Pool {
	cfg, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		log.Fatalf("bad DATABASE_URL: %v", err)
	}
	p, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		log.Fatalf("db connect: %v", err)
	}
	if _, err := p.Exec(ctx, initSQL); err != nil {
		log.Fatalf("migration failed: %v", err)
	}
	return p
}
