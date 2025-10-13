package application

import (
	"context"
	"testing"
	"time"

	"github.com/easyspace-ai/luckdb/server/internal/infrastructure/database/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("Failed to connect to test database: %v", err)
	}

	// Auto migrate
	if err := db.AutoMigrate(&models.Workflow{}, &models.WorkflowRun{}); err != nil {
		t.Fatalf("Failed to migrate: %v", err)
	}

	return db
}

func TestWorkflowService_Create(t *testing.T) {
	db := setupTestDB(t)
	service := NewWorkflowService(db)

	workflow := &models.Workflow{
		Name:        "Test Workflow",
		Type:        "automation",
		Status:      "draft",
		TriggerType: "manual",
		CreatedBy:   "user123",
	}

	err := service.Create(context.Background(), workflow)
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if workflow.ID == "" {
		t.Error("Expected workflow ID to be generated")
	}

	if workflow.CreatedTime.IsZero() {
		t.Error("Expected CreatedTime to be set")
	}
}

func TestWorkflowService_GetByID(t *testing.T) {
	db := setupTestDB(t)
	service := NewWorkflowService(db)

	// Create a workflow
	workflow := &models.Workflow{
		Name:        "Test Workflow",
		Type:        "automation",
		TriggerType: "manual",
		CreatedBy:   "user123",
	}
	service.Create(context.Background(), workflow)

	// Get the workflow
	retrieved, err := service.GetByID(context.Background(), workflow.ID)
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if retrieved.ID != workflow.ID {
		t.Errorf("Expected ID %s, got %s", workflow.ID, retrieved.ID)
	}

	if retrieved.Name != workflow.Name {
		t.Errorf("Expected Name %s, got %s", workflow.Name, retrieved.Name)
	}
}

func TestWorkflowService_List(t *testing.T) {
	db := setupTestDB(t)
	service := NewWorkflowService(db)

	// Create multiple workflows
	for i := 0; i < 5; i++ {
		workflow := &models.Workflow{
			Name:        "Workflow " + string(rune(i+'0')),
			Type:        "automation",
			TriggerType: "manual",
			CreatedBy:   "user123",
		}
		service.Create(context.Background(), workflow)
	}

	// List workflows
	workflows, total, err := service.List(context.Background(), 1, 10)
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if total != 5 {
		t.Errorf("Expected total 5, got %d", total)
	}

	if len(workflows) != 5 {
		t.Errorf("Expected 5 workflows, got %d", len(workflows))
	}
}

func TestWorkflowService_Update(t *testing.T) {
	db := setupTestDB(t)
	service := NewWorkflowService(db)

	// Create a workflow
	workflow := &models.Workflow{
		Name:        "Original Name",
		Type:        "automation",
		TriggerType: "manual",
		CreatedBy:   "user123",
	}
	service.Create(context.Background(), workflow)

	// Update the workflow
	workflow.Name = "Updated Name"
	err := service.Update(context.Background(), workflow.ID, workflow)
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	// Verify update
	retrieved, _ := service.GetByID(context.Background(), workflow.ID)
	if retrieved.Name != "Updated Name" {
		t.Errorf("Expected name to be updated to 'Updated Name', got '%s'", retrieved.Name)
	}
}

func TestWorkflowService_Delete(t *testing.T) {
	db := setupTestDB(t)
	service := NewWorkflowService(db)

	// Create a workflow
	workflow := &models.Workflow{
		Name:        "Test Workflow",
		Type:        "automation",
		TriggerType: "manual",
		CreatedBy:   "user123",
	}
	service.Create(context.Background(), workflow)

	// Delete the workflow
	err := service.Delete(context.Background(), workflow.ID)
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	// Verify deletion
	_, err = service.GetByID(context.Background(), workflow.ID)
	if err == nil {
		t.Error("Expected error when getting deleted workflow")
	}
}

func TestWorkflowService_Run(t *testing.T) {
	db := setupTestDB(t)
	service := NewWorkflowService(db)

	// Create a workflow
	workflow := &models.Workflow{
		Name:        "Test Workflow",
		Type:        "automation",
		TriggerType: "manual",
		CreatedBy:   "user123",
	}
	service.Create(context.Background(), workflow)

	// Run the workflow
	input := map[string]interface{}{"param1": "value1"}
	run, err := service.Run(context.Background(), workflow.ID, "user123", input)
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if run.ID == "" {
		t.Error("Expected run ID to be generated")
	}

	if run.WorkflowID != workflow.ID {
		t.Errorf("Expected WorkflowID %s, got %s", workflow.ID, run.WorkflowID)
	}

	if run.Status != "running" {
		t.Errorf("Expected status 'running', got '%s'", run.Status)
	}
}

