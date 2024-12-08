package service

import (
	"os"
	"path/filepath"
	"sync"
	"time"
)

// FileNode represents a file or directory in the project
type FileNode struct {
	Name         string      `json:"name"`
	Path         string      `json:"path"`
	Type         string      `json:"type"` // "file" or "directory"
	Size         int64       `json:"size,omitempty"`
	LastModified time.Time   `json:"lastModified"`
	Children     []*FileNode `json:"children,omitempty"`
}

// FileService handles file operations for projects
type FileService struct {
	// Cache file trees with expiration
	cache     map[string]*FileNode
	cacheLock sync.RWMutex
	// TODO: Add file watcher
}

// NewFileService creates a new file service instance
func NewFileService() *FileService {
	return &FileService{
		cache: make(map[string]*FileNode),
	}
}

// GetProjectFiles returns the file tree for a project
func (s *FileService) GetProjectFiles(projectPath string) (*FileNode, error) {
	s.cacheLock.RLock()
	if node, ok := s.cache[projectPath]; ok {
		s.cacheLock.RUnlock()
		return node, nil
	}
	s.cacheLock.RUnlock()

	// Build the file tree
	root, err := s.buildFileTree(projectPath)
	if err != nil {
		return nil, err
	}

	// Cache the result
	s.cacheLock.Lock()
	s.cache[projectPath] = root
	s.cacheLock.Unlock()

	return root, nil
}

// buildFileTree recursively builds a file tree starting from the given path
func (s *FileService) buildFileTree(root string) (*FileNode, error) {
	info, err := os.Stat(root)
	if err != nil {
		return nil, err
	}

	node := &FileNode{
		Name:         filepath.Base(root),
		Path:         root,
		LastModified: info.ModTime(),
	}

	if info.IsDir() {
		node.Type = "directory"
		entries, err := os.ReadDir(root)
		if err != nil {
			return nil, err
		}

		node.Children = make([]*FileNode, 0, len(entries))
		for _, entry := range entries {
			// Skip hidden files and directories
			if entry.Name()[0] == '.' {
				continue
			}

			childPath := filepath.Join(root, entry.Name())
			childNode, err := s.buildFileTree(childPath)
			if err != nil {
				continue // Skip files we can't access
			}
			node.Children = append(node.Children, childNode)
		}
	} else {
		node.Type = "file"
		node.Size = info.Size()
	}

	return node, nil
}

// GetFileContent reads and returns the content of a file
func (s *FileService) GetFileContent(path string) (string, error) {
	content, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	return string(content), nil
}

// SaveFile saves content to a file
func (s *FileService) SaveFile(path string, content string) error {
	err := os.WriteFile(path, []byte(content), 0644)
	if err != nil {
		return err
	}

	// Invalidate cache for the project containing this file
	s.cacheLock.Lock()
	projectPath := filepath.Dir(path)
	delete(s.cache, projectPath)
	s.cacheLock.Unlock()

	return nil
}

// InvalidateCache removes a project's file tree from cache
func (s *FileService) InvalidateCache(projectPath string) {
	s.cacheLock.Lock()
	delete(s.cache, projectPath)
	s.cacheLock.Unlock()
}
