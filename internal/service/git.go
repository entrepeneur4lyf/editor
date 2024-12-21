package service

import (
	"errors"
	"fmt"
	"os"
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

		// For untracked files
		if fileStatus.Worktree == git.Untracked {
			fs.Staged = false
			fs.Status = string(git.Untracked)
		} else if fileStatus.Staging != git.Unmodified {
			// For staged changes
			fs.Staged = true
			fs.Status = string(fileStatus.Staging)
		} else {
			// For unstaged changes
			fs.Staged = false
			fs.Status = string(fileStatus.Worktree)
		}

		files = append(files, fs)
	}

	return files, nil
}

// getWorktree is a helper function that returns the worktree for a given project path
func (s *GitService) getWorktree(projectPath string) (*git.Worktree, error) {
	repo, err := git.PlainOpen(projectPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open repository: %w", err)
	}

	worktree, err := repo.Worktree()
	if err != nil {
		return nil, fmt.Errorf("failed to get worktree: %w", err)
	}

	return worktree, nil
}

// StageFile adds a file to the staging area
func (s *GitService) StageFile(projectPath string, file string) error {
	worktree, err := s.getWorktree(projectPath)
	if err != nil {
		return err
	}

	_, err = worktree.Add(file)
	if err != nil {
		return fmt.Errorf("failed to stage file: %w", err)
	}

	return nil
}

func (s *GitService) UnstageFile(projectPath string, file string) error {
	worktree, err := s.getWorktree(projectPath)
	if err != nil {
		return err
	}

	_, err = worktree.Remove(file)
	if err != nil {
		return fmt.Errorf("failed to unstage file: %w", err)
	}

	return nil
}

// DiscardChanges discards changes in an unstaged file, reverting it to the last commit
func (s *GitService) DiscardChanges(projectPath string, file string) error {
	// Open the repository
	repo, err := git.PlainOpen(projectPath)
	if err != nil {
		return fmt.Errorf("failed to open repository: %w", err)
	}

	// Get worktree to check file status
	worktree, err := repo.Worktree()
	if err != nil {
		return fmt.Errorf("failed to get worktree: %w", err)
	}

	// Check if file is untracked
	status, err := worktree.Status()
	if err != nil {
		return fmt.Errorf("failed to get status: %w", err)
	}

	fileStatus := status.File(file)
	if fileStatus.Staging == git.Untracked {
		fullPath := filepath.Join(projectPath, file)
		if err := os.Remove(fullPath); err != nil {
			return fmt.Errorf("failed to delete untracked file: %w", err)
		}
		return nil
	}

	// Get HEAD commit
	ref, err := repo.Head()
	if err != nil {
		return fmt.Errorf("failed to get HEAD: %w", err)
	}

	commit, err := repo.CommitObject(ref.Hash())
	if err != nil {
		return fmt.Errorf("failed to get commit: %w", err)
	}

	// Get the tree for the commit
	tree, err := commit.Tree()
	if err != nil {
		return fmt.Errorf("failed to get tree: %w", err)
	}

	// Find the file entry in the tree to get both content and mode
	entry, err := tree.FindEntry(file)
	if err != nil {
		return fmt.Errorf("failed to find file in tree: %w", err)
	}

	// Get file object
	treeFile, err := tree.File(file)
	if err != nil {
		return fmt.Errorf("failed to get file from tree: %w", err)
	}

	// Get the contents
	contents, err := treeFile.Contents()
	if err != nil {
		return fmt.Errorf("failed to get file contents: %w", err)
	}

	// Write the contents back to the file
	fullPath := filepath.Join(projectPath, file)
	err = os.WriteFile(fullPath, []byte(contents), 0644)
	if err != nil {
		return fmt.Errorf("failed to write file: %w", err)
	}

	// Set the original permissions from git tree entry
	mode, modeErr := entry.Mode.ToOSFileMode()
	if modeErr != nil {
		return fmt.Errorf("failed to convert file mode: %w", modeErr)
	}
	if err := os.Chmod(fullPath, mode); err != nil {
		return fmt.Errorf("failed to set file permissions: %w", err)
	}

	return nil
}
