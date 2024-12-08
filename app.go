package main

import (
	"context"
	"fmt"
	"os"

	"github.com/edit4i/editor/internal/db"
	"github.com/edit4i/editor/internal/service"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx      context.Context
	projects *service.ProjectsService
	files    *service.FileService
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	// Initialize database
	dbConn, err := db.InitDB(db.DefaultConfig())
	if err != nil {
		panic(err)
	}

	// Initialize services
	a.projects = service.NewProjectsService(dbConn)
	a.files = service.NewFileService()
}

// GetRecentProjects returns the list of recent projects
func (a *App) GetRecentProjects() ([]db.Project, error) {
	return a.projects.GetRecentProjects(4)
}

// OpenProjectFolder opens a folder selection dialog
func (a *App) OpenProjectFolder() (string, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		homeDir = "/"
	}

	options := runtime.OpenDialogOptions{
		Title:            "Open Project Folder",
		DefaultDirectory: homeDir,
	}

	path, err := runtime.OpenDirectoryDialog(a.ctx, options)
	if err != nil {
		return "", fmt.Errorf("error opening directory dialog: %v", err)
	}

	return path, nil
}

// AddProject adds a new project or updates existing one
func (a *App) AddProject(name, path string) (*db.Project, error) {
	return a.projects.AddProject(name, path)
}

// GetProjectFiles returns the file tree for a project
func (a *App) GetProjectFiles(projectPath string) (*service.FileNode, error) {
	return a.files.GetProjectFiles(projectPath)
}

// GetFileContent returns the content of a file
func (a *App) GetFileContent(path string) (string, error) {
	return a.files.GetFileContent(path)
}

// SaveFile saves content to a file
func (a *App) SaveFile(path, content string) error {
	return a.files.SaveFile(path, content)
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}
