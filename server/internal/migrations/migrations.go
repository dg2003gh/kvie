package migrations

import (
	"database/sql"
	"log"

	_ "modernc.org/sqlite"
)

func createHealthCheckTable(db *sql.DB) {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS pod_health_check (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			pod TEXT NOT NULL,
			namespace TEXT NOT NULL,
			timestamp TEXT NOT NULL,
			status INTEGER NOT NULL,      -- 1 or 0
			message TEXT
		);
		`)
	if err != nil {
		log.Fatal("Error creating table health_check:", err)
	} else {
		log.Println("✅ CREATE TABLE IF NOT EXISTS pod_health_check (id, pod, namespace, timestamp, status, message);")
	}

		_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS node_health_check (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			node TEXT NOT NULL,
			timestamp TEXT NOT NULL,
			status INTEGER NOT NULL,
			message TEXT NOT NULL,
			cpu_usage BIGINT DEFAULT 0,
			memory_usage BIGINT DEFAULT 0
		);
		`)
	if err != nil {
		log.Fatal("Error creating table node_health_check:", err)
	} else {
		log.Println("✅ node_health_check table initialized (id, node, timestamp, status, message, cpu_usage, memory_usage)")
	}

}

func createConfigTable(db *sql.DB) {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS config (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL UNIQUE,
		value TEXT NOT NULL,
		description TEXT NOT NULL
	);
		`)
	if err != nil {
		log.Fatal("Error creating table config:", err)
	} else {
		log.Println("✅ CREATE TABLE IF NOT EXISTS config (id, name, value, description);")
	}
}

func fillConfigTable(db *sql.DB) {
	configs := []struct {
		Name        string
		Value       string
		Description string
	}{
		{"monitoring_history_time", "7 days", "Time to keep monitoring history"},
		{"timezone", "utc", "Server timezone"},
		{"health_check_history_interval", "5 min", "Interval between health checks"},
	}

	for _, c := range configs {
		_, err := db.Exec(`
		INSERT OR IGNORE INTO config (name, value, description)
		VALUES (?, ?, ?)`,
			c.Name, c.Value, c.Description,
		)
		if err != nil {
			log.Fatal("Error inserting config:", err)
		} else {
			log.Println("✅ Inserted default", c.Name, "with value", c.Value, "in Config Table.")
		}
	}

	log.Println("✅ Default configs inserted")
}

func Run(database *sql.DB) {
	log.Println("✅ Running Migrations...")

	createHealthCheckTable(database)
	createConfigTable(database)
	fillConfigTable(database)
}
