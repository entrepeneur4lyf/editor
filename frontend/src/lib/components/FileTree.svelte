<script lang="ts">
    import { Edit, FolderPlus, Plus, Trash2 } from "lucide-svelte";
    import FileTreeItem from "@/lib/editor/FileTreeItem.svelte";
    import ContextMenu from "@/lib/editor/ContextMenu.svelte";
    import type { service } from "@/lib/wailsjs/go/models";
    import { fileStore } from "@/stores/fileStore";
    import { LoadDirectoryContents } from "@/lib/wailsjs/go/main/App";

    type FileNode = service.FileNode;

    export let isAllCollapsed = false;
    export let key = 0; // Add key prop to force re-render

    let contextMenu = {
        show: false,
        x: 0,
        y: 0,
        targetItem: null as FileNode | null,
    };

    const currentProjectRootNode: service.FileNode = {
        name: $fileStore.activeFilePath as string,
        path: $fileStore.currentProjectPath as string,
        type: "",
        children: [],
    };

    let tempNode: FileNode | null = null;
    $: fileTree = $fileStore.fileTree || [];

    function addNodeToTree(node: FileNode, parentPath: string) {
        if (!parentPath || parentPath === $fileStore.currentProjectPath) {
            // Add to root level
            if (!fileTree.some(item => item.path === node.path)) {
                fileTree = [...fileTree, node];
            }
        } else {
            // Add to the correct parent folder
            fileTree = fileTree.map(item => {
                if (item.path === parentPath) {
                    return {
                        ...item,
                        children: [...(item.children || []), node],
                        isLoaded: true
                    };
                } else if (item.children) {
                    return {
                        ...item,
                        children: addToChildren(item.children, node, parentPath)
                    };
                }
                return item;
            });
        }
    }

    function addToChildren(children: FileNode[], node: FileNode, parentPath: string): FileNode[] {
        return children.map(child => {
            if (child.path === parentPath) {
                return {
                    ...child,
                    children: [...(child.children || []), node],
                    isLoaded: true
                };
            } else if (child.children) {
                return {
                    ...child,
                    children: addToChildren(child.children, node, parentPath)
                };
            }
            return child;
        });
    }

    async function handleContextMenuAction(action: string) {
        if (!contextMenu.targetItem) return;

        const path = contextMenu.targetItem.path;
        handleCloseContextMenu();

        switch (action) {
            case "rename":
                const item = contextMenu.targetItem;
                if (item) {
                    const fileTreeItem = document.querySelector(
                        `[data-path="${item.path}"]`,
                    );
                    if (fileTreeItem) {
                        fileTreeItem.dispatchEvent(
                            new CustomEvent("startRename"),
                        );
                    }
                }
                break;
            case "delete":
                if (
                    confirm(
                        `Are you sure you want to delete ${contextMenu.targetItem.name}?`,
                    )
                ) {
                    await fileStore.deleteFile(path);
                }
                break;
            case "newFile":
            case "newFolder":
                const isFolder = action === "newFolder";
                const newPath = `${path}/New ${isFolder ? "Folder" : "File"}`;
                tempNode = {
                    name: `New ${isFolder ? "Folder" : "File"}`,
                    path: newPath,
                    type: isFolder ? "directory" : "file",
                    children: [],
                    isRenaming: true,
                };
                
                // Add the node to the correct parent in the tree
                addNodeToTree(tempNode, path);

                // Wait for the DOM to update with the new node
                setTimeout(() => {
                    const fileTreeItem = document.querySelector(
                        `[data-path="${newPath}"]`
                    );
                    if (fileTreeItem) {
                        fileTreeItem.dispatchEvent(
                            new CustomEvent("startRename")
                        );
                    }
                }, 0);
                break;
        }
    }

    async function handleRename(path: string, newName: string) {
        try {
            const parentPath = path.substring(0, path.lastIndexOf("/"));
            const newPath = `${parentPath}/${newName}`;
            
            if (path.includes("New File") || path.includes("New Folder")) {
                // This is a new file/folder being created
                const isFolder = path.includes("New Folder");
                if (isFolder) {
                    await fileStore.createDirectory(newPath);
                } else {
                    await fileStore.createFile(newPath);
                }
                tempNode = null;

                // Find and update the parent directory's contents
                const parentNode = fileTree.find(node => node.path === parentPath) ||
                    fileTree.find(node => {
                        const findInChildren = (children: FileNode[]): FileNode | undefined => {
                            for (const child of children) {
                                if (child.path === parentPath) return child;
                                if (child.children) {
                                    const found = findInChildren(child.children);
                                    if (found) return found;
                                }
                            }
                            return undefined;
                        };
                        return node.children ? findInChildren(node.children) : undefined;
                    });

                if (parentNode) {
                    await fileStore.loadDirectoryContents(parentNode.path);
                } else {
                    // If we can't find the parent node, refresh the entire tree
                    await fileStore.refreshFiles();
                }
            } else {
                // This is a rename operation
                await fileStore.renameFile(path, newPath);
                await fileStore.refreshFiles();
            }
        } catch (error) {
            console.error("Error renaming file:", error);
        }
    }

    function handleContextMenu(e: MouseEvent, item: FileNode) {
        e.preventDefault();
        contextMenu = {
            show: true,
            x: e.clientX,
            y: e.clientY,
            targetItem: item,
        };
    }

    function handleCloseContextMenu() {
        contextMenu.show = false;
    }
</script>

<div class="h-full overflow-auto flex flex-col">
    <div class="flex-shrink-0">
        {#if $fileStore.loading}
            <div class="p-4 text-sm text-gray-500">Loading files...</div>
        {:else if $fileStore.error}
            <div class="p-4 text-sm text-red-500">{$fileStore.error}</div>
        {:else}
            {#each fileTree as item (item.path)}
                <FileTreeItem
                    {item}
                    onContextMenu={(e) => handleContextMenu(e, item)}
                    onRename={(path, newName) => handleRename(path, newName)}
                    {isAllCollapsed}
                />
            {/each}
        {/if}
    </div>

    <!-- Empty space that fills remaining height -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
        class="flex-grow min-h-[20px]"
        on:contextmenu|preventDefault={(e) => {
            contextMenu = {
                show: true,
                x: e.clientX,
                y: e.clientY,
                targetItem: currentProjectRootNode,
            };
        }}
    />

    {#if contextMenu.show}
        <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            on:close={handleCloseContextMenu}
            items={contextMenu.targetItem?.type
                ? [
                      {
                          label: "New File",
                          icon: Plus,
                          action: () => handleContextMenuAction("newFile"),
                      },
                      {
                          label: "New Folder",
                          icon: FolderPlus,
                          action: () => handleContextMenuAction("newFolder"),
                      },
                      {
                          label: "Rename",
                          icon: Edit,
                          action: () => handleContextMenuAction("rename"),
                      },
                      {
                          label: "Delete",
                          icon: Trash2,
                          action: () => handleContextMenuAction("delete"),
                      },
                  ]
                : [
                      {
                          label: "New File",
                          icon: Plus,
                          action: () => handleContextMenuAction("newFile"),
                      },
                      {
                          label: "New Folder",
                          icon: FolderPlus,
                          action: () => handleContextMenuAction("newFolder"),
                      },
                  ]}
            on:action={({ detail }) => handleContextMenuAction(detail)}
            onClose={handleCloseContextMenu}
        />
    {/if}
</div>
