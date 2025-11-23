package db

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"

	_ "modernc.org/sqlite"
)

func OpenSqliteConn(db_path string) (*sql.DB, error) {
	db, err := sql.Open("sqlite", db_path)
	if err != nil {
		log.Fatal("Error opening DB:", err)
	}

	if err := db.Ping(); err != nil {
		log.Fatal("Cannot connect:", err)
	}

	log.Println("✅ Connected to SQLite!")

	db.Exec("PRAGMA journal_mode=WAL;")
	db.Exec("PRAGMA busy_timeout = 5000;")

	return db, err
}

func GetConfigsJSON(db *sql.DB) (string, error) {
	rows, err := db.Query(`SELECT name, value FROM config`)
	if err != nil {
		return "", fmt.Errorf("query error: %w", err)
	}
	defer rows.Close()

	configs := make(map[string]string)
	for rows.Next() {
		var name, value string
		if err := rows.Scan(&name, &value); err != nil {
			return "", fmt.Errorf("scan error: %w", err)
		}
		configs[name] = value
	}

	if err = rows.Err(); err != nil {
		return "", fmt.Errorf("rows error: %w", err)
	}

	// Convert map to JSON
	jsonData, err := json.MarshalIndent(configs, "", "  ")
	if err != nil {
		return "", fmt.Errorf("json marshal error: %w", err)
	}

	return string(jsonData), nil
}
