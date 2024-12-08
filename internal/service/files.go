package service

import (
	"os"
	"path/filepath"
	"sort"
	"sync"
	"time"
	"fmt"
)

// FileNode represents a file or directory in the project
type FileNode struct {
	Name         string      `json:"name"`
	Path         string      `json:"path"`
	Type         string      `json:"type"` // "file" or "directory"
	Size         int64       `json:"size,omitempty"`
	LastModified time.Time   `json:"lastModified"`
	Children     []*FileNode `json:"children,omitempty"`
	IsLoaded     bool        `json:"isLoaded"` // Indicates if directory contents are loaded
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

	// Build only top-level directory structure
	root, err := s.buildTopLevelTree(projectPath)
	if err != nil {
		return nil, err
	}

	// Sort the top level
	s.sortFileTree(root)

	// Cache the result
	s.cacheLock.Lock()
	s.cache[projectPath] = root
	s.cacheLock.Unlock()

	return root, nil
}

// buildTopLevelTree builds only the top level of the file tree
func (s *FileService) buildTopLevelTree(root string) (*FileNode, error) {
	info, err := os.Stat(root)
	if err != nil {
		return nil, err
	}

	node := &FileNode{
		Name:         filepath.Base(root),
		Path:         root,
		LastModified: info.ModTime(),
		IsLoaded:     false,
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
			childInfo, err := entry.Info()
			if err != nil {
				continue
			}

			childNode := &FileNode{
				Name:         entry.Name(),
				Path:         childPath,
				LastModified: childInfo.ModTime(),
				IsLoaded:     false,
			}

			if entry.IsDir() {
				childNode.Type = "directory"
				// Don't load children yet
				childNode.Children = []*FileNode{}
			} else {
				childNode.Type = "file"
				childNode.Size = childInfo.Size()
				childNode.IsLoaded = true // Files are always "loaded"
			}

			node.Children = append(node.Children, childNode)
		}
		node.IsLoaded = true // Mark top level as loaded
	} else {
		node.Type = "file"
		node.Size = info.Size()
		node.IsLoaded = true
	}

	return node, nil
}

// LoadDirectoryContents loads the contents of a specific directory
func (s *FileService) LoadDirectoryContents(dirPath string) (*FileNode, error) {
	s.cacheLock.Lock()
	defer s.cacheLock.Unlock()

	// Find the directory node in the cache
	var dirNode *FileNode
	for _, root := range s.cache {
		if node := s.findNode(root, dirPath); node != nil {
			dirNode = node
			break
		}
	}

	if dirNode == nil || dirNode.Type != "directory" {
		return nil, fmt.Errorf("directory not found: %s", dirPath)
	}

	// If already loaded, return as is
	if dirNode.IsLoaded {
		return dirNode, nil
	}

	// Load the directory contents
	entries, err := os.ReadDir(dirPath)
	if err != nil {
		return nil, err
	}

	dirNode.Children = make([]*FileNode, 0, len(entries))
	for _, entry := range entries {
		if entry.Name()[0] == '.' {
			continue
		}

		childPath := filepath.Join(dirPath, entry.Name())
		childInfo, err := entry.Info()
		if err != nil {
			continue
		}

		childNode := &FileNode{
			Name:         entry.Name(),
			Path:         childPath,
			LastModified: childInfo.ModTime(),
			IsLoaded:     false,
		}

		if entry.IsDir() {
			childNode.Type = "directory"
			childNode.Children = []*FileNode{}
		} else {
			childNode.Type = "file"
			childNode.Size = childInfo.Size()
			childNode.IsLoaded = true
		}

		dirNode.Children = append(dirNode.Children, childNode)
	}

	dirNode.IsLoaded = true
	s.sortFileTree(dirNode)

	return dirNode, nil
}

// findNode recursively finds a node by path
func (s *FileService) findNode(root *FileNode, path string) *FileNode {
	if root.Path == path {
		return root
	}

	if root.Children != nil {
		for _, child := range root.Children {
			if found := s.findNode(child, path); found != nil {
				return found
			}
		}
	}

	return nil
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

// sortFileTree sorts the file tree with folders first and by alphabetical order
func (s *FileService) sortFileTree(node *FileNode) {
    if node == nil || len(node.Children) == 0 {
        return
    }

    // Sort children recursively first
    for _, child := range node.Children {
        s.sortFileTree(child)
    }

    // Sort current level
    sort.Slice(node.Children, func(i, j int) bool {
        // If types are different, directories come first
        if node.Children[i].Type != node.Children[j].Type {
            return node.Children[i].Type == "directory"
        }
        // If types are the same, sort by name
        return node.Children[i].Name < node.Children[j].Name
    })
}
