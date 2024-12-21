package service

import (
	"errors"
	"fmt"
	"path/filepath"

	"github.com/go-git/go-git/v5"
)

// FileStatus represents the status of a file in the Git repository
type FileStatus struct {
	File   string `json:"file"`   // File path relative to repository root
	Status string `json:"status"` // Status code: "M" for modified, "A" for added, "D" for deleted and "?" for untracked
	Staged bool   `json:"staged"` // Whether the file is staged
}

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

// GetStatus returns the current Git status of the repository
// Returns two slices: staged files and unstaged files
func (s *GitService) GetStatus(projectPath string) ([]FileStatus, error) {
	// Ensure we have an absolute path
	absPath, err := filepath.Abs(projectPath)
	if err != nil {
		return nil, fmt.Errorf("failed to get absolute path: %w", err)
	}

	// Open the repository
	repo, err := git.PlainOpen(absPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open repository: %w", err)
	}

	// Get the working tree
	worktree, err := repo.Worktree()
	if err != nil {
		return nil, fmt.Errorf("failed to get worktree: %w", err)
	}

	// Get the status
	status, err := worktree.Status()
	if err != nil {
		return nil, fmt.Errorf("failed to get status: %w", err)
	}

	// Convert status to our format
	var files []FileStatus
	for file, fileStatus := range status {
		// Skip unmodified files
		if fileStatus.Staging == git.Unmodified && fileStatus.Worktree == git.Unmodified {
			continue
		}

		fs := FileStatus{
			File: file,
		}

		// If the file is staged, use the staging status
		if fileStatus.Staging != git.Unmodified {
			fs.Staged = true
			fs.Status = string(fileStatus.Staging)
		} else {
			// Otherwise use the worktree status
			fs.Staged = false
			fs.Status = string(fileStatus.Worktree)
		}

		files = append(files, fs)
	}

	return files, nil
}
