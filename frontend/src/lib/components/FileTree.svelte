<script lang="ts">
    import { Edit, FolderPlus, Plus, Trash2 } from "lucide-svelte";
    import FileTreeItem from "@/lib/editor/FileTreeItem.svelte";
    import ContextMenu from "@/lib/editor/ContextMenu.svelte";
    import type { service } from "@/lib/wailsjs/go/models";
    import { fileStore } from "@/stores/fileStore";

    type FileNode = service.FileNode;

    export let fileTree: FileNode[] = [];
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

    async function handleContextMenuAction(action: string) {
        if (!contextMenu.targetItem) return;

        const path = contextMenu.targetItem.path;
        const parentPath = path.substring(0, path.lastIndexOf("/"));

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
                const fileName = prompt("Enter file name:");
                if (fileName) {
                    const newPath = `${path}/${fileName}`;
                    await fileStore.createFile(newPath);
                }
                break;
            case "newFolder":
                const folderName = prompt("Enter folder name:");
                if (folderName) {
                    const newPath = `${path}/${folderName}`;
                    await fileStore.createDirectory(newPath);
                }
                break;
        }
        handleCloseContextMenu();
    }

    async function handleRename(path: string, newName: string) {
        try {
            const parentPath = path.substring(0, path.lastIndexOf("/"));
            const newPath = `${parentPath}/${newName}`;
            await fileStore.renameFile(path, newPath);
            await fileStore.refreshFiles();
        } catch (error) {
            console.error("Error renaming file:", error);
        }
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
