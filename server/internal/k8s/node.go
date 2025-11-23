package k8s

import (
	"context"
	"database/sql"
	"encoding/json"
	"log"
	"time"
	"fmt"

	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	metrics "k8s.io/metrics/pkg/client/clientset/versioned"
)

// ----------------------- Models -----------------------

type NodeHealth struct {
	ID           int     `json:"id"`
	Node         string  `json:"node"`
	Timestamp    string  `json:"timestamp"`
	Status       int     `json:"status"`
	Message      string  `json:"message"`
	CPUUsage     float64 `json:"cpu_usage_percent"`
	MemoryUsage  float64 `json:"memory_usage_percent"`
}

// ----------------------- DB JSON Fetch -----------------------

func GetNodeHealthJSON(db *sql.DB) (string, error) {
	rows, err := db.Query(`
		SELECT id, node, timestamp, status, message, cpu_usage, memory_usage
		FROM node_health_check
		ORDER BY id DESC
	`)
	if err != nil {
		return "", err
	}
	defer rows.Close()

	var checks []NodeHealth
	for rows.Next() {
		var n NodeHealth
		if err := rows.Scan(&n.ID, &n.Node, &n.Timestamp, &n.Status, &n.Message, &n.CPUUsage, &n.MemoryUsage); err != nil {
			return "", err
		}
		checks = append(checks, n)
	}

	b, err := json.MarshalIndent(checks, "", "  ")
	if err != nil {
		return "", err
	}
	return string(b), nil
}

// ----------------------- Store Node Metrics -----------------------

func StoreNodesHealth(db *sql.DB) {
	if err := ClearNodeHealthOlderThan(db, 1); err != nil {
		log.Println("Erro ao limpar logs antigos:", err)
	}

	ctx := context.Background()
	clientset, mclient, err := getClients()
	if err != nil {
		log.Println("K8s client error:", err)
		return
	}

	nodes, err := clientset.CoreV1().Nodes().List(ctx, metav1.ListOptions{})
	if err != nil {
		log.Println("Error listing nodes:", err)
		return
	}

	stmt, err := db.Prepare(`
		INSERT INTO node_health_check (node, timestamp, status, message, cpu_usage, memory_usage)
		VALUES (?, ?, ?, ?, ?, ?)
	`)
	if err != nil {
		log.Println("DB prepare error:", err)
		return
	}
	defer stmt.Close()

	timestamp := time.Now().Format(time.RFC3339)

	for _, node := range nodes.Items {
		status := nodeReady(&node)
		message := readableNodeStatus(&node)
		cpuPercent, memPercent := getNodeUsage(ctx, mclient, &node)

		_, err = stmt.Exec(node.Name, timestamp, status, message, cpuPercent, memPercent)
		if err != nil {
			log.Println("Insert error:", err)
		}
	}

	log.Printf("Stored %d node health entries\n", len(nodes.Items))
}

func GetNodeHealthJSONByName(db *sql.DB, node string) (string, error) {
	rows, err := db.Query(`
		SELECT id, node, timestamp, status, message, cpu_usage, memory_usage
		FROM node_health_check
		WHERE node = ?
		ORDER BY id DESC
	`, node)
	if err != nil {
		return "", err
	}
	defer rows.Close()

	var checks []NodeHealth
	for rows.Next() {
		var n NodeHealth
		if err := rows.Scan(&n.ID, &n.Node, &n.Timestamp, &n.Status, &n.Message, &n.CPUUsage, &n.MemoryUsage); err != nil {
			return "", err
		}
		checks = append(checks, n)
	}

	b, err := json.MarshalIndent(checks, "", "  ")
	if err != nil {
		return "", err
	}
	return string(b), nil
}


// ----------------------- Helpers -----------------------

func nodeReady(node *v1.Node) int {
	for _, c := range node.Status.Conditions {
		if c.Type == v1.NodeReady && c.Status == v1.ConditionTrue {
			return 1
		}
	}
	return 0
}

func ClearNodeHealthOlderThan(db *sql.DB, hours int) error {
	_, err := db.Exec(`
		DELETE FROM node_health_check 
		WHERE timestamp < datetime('now', ?)
	`, "-"+fmt.Sprintf("%d hours", hours))

	if err != nil {
		return err
	}

	log.Printf("⏳ Removidos registros mais antigos que %d horas\n", hours)
	return nil
}

func readableNodeStatus(node *v1.Node) string {
	for _, c := range node.Status.Conditions {
		if c.Type == v1.NodeReady {
			if c.Status == v1.ConditionTrue {
				return "OK"
			}
			return "NOT_OK"
		}
	}
	return "UNKNOWN"
}

// CPU & Memory usage based on allocatable capacity

func getNodeUsage(ctx context.Context, mclient *metrics.Clientset, node *v1.Node) (float64, float64) {
	m, err := mclient.MetricsV1beta1().NodeMetricses().Get(ctx, node.Name, metav1.GetOptions{})
	if err != nil {
		return 0, 0
	}

	cpuUsage := float64(m.Usage.Cpu().MilliValue()) // mCPU
	memUsage := float64(m.Usage.Memory().Value())   // bytes

	cpuAlloc := float64(node.Status.Allocatable.Cpu().MilliValue())
	memAlloc := float64(node.Status.Allocatable.Memory().Value())

	return (cpuUsage / cpuAlloc) * 100, (memUsage / memAlloc) * 100
}

// ----------------------- Clients -----------------------

func getClients() (*kubernetes.Clientset, *metrics.Clientset, error) {
	cfg, err := rest.InClusterConfig()
	if err != nil {
		kubeconfig := clientcmd.RecommendedHomeFile
		cfg, err = clientcmd.BuildConfigFromFlags("", kubeconfig)
		if err != nil {
			return nil, nil, err
		}
	}

	cs, err := kubernetes.NewForConfig(cfg)
	if err != nil {
		return nil, nil, err
	}

	mc, err := metrics.NewForConfig(cfg)
	if err != nil {
		return nil, nil, err
	}

	return cs, mc, nil
}
