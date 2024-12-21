package service

import (
	"errors"
	"fmt"
	"path/filepath"

	"github.com/go-git/go-git/v5"
)

// GitService handles Git operations for projects
type GitService struct {
	// We might want to add a cache of repositories later
}

// NewGitService creates a new Git service instance
func NewGitService() *GitService {
	return &GitService{}
}

// IsGitRepository checks if the given directory is a Git repository
// Returns true if it is a Git repository, false if not
// Returns error if there was a problem checking (e.g., directory doesn't exist)
func (s *GitService) IsGitRepository(projectPath string) (bool, error) {
	// Ensure we have an absolute path
	absPath, err := filepath.Abs(projectPath)
	if err != nil {
		return false, err
	}

	// Try to open the repository
	_, err = git.PlainOpen(absPath)
	if err != nil {
		if errors.Is(err, git.ErrRepositoryNotExists) {
			// Not a Git repository, but not an error
			return false, nil
		}
		// Some other error occurred
		return false, err
	}

	return true, nil
}

// InitRepository initializes a new Git repository in the given directory
// Returns error if the directory is already a Git repository or if initialization fails
func (s *GitService) InitRepository(projectPath string) error {
	// First check if it's already a Git repository
	isRepo, err := s.IsGitRepository(projectPath)
	if err != nil {
		return fmt.Errorf("failed to check if directory is a Git repository: %w", err)
	}
	if isRepo {
		return errors.New("directory is already a Git repository")
	}

	// Ensure we have an absolute path
	absPath, err := filepath.Abs(projectPath)
	if err != nil {
		return fmt.Errorf("failed to get absolute path: %w", err)
	}

	// Initialize the repository
	_, err = git.PlainInit(absPath, false) // false means not bare repository
	if err != nil {
		return fmt.Errorf("failed to initialize Git repository: %w", err)
	}

	return nil
}
