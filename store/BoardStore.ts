import { ID, databases, storage } from '@/appwrite';
import { getTodosGroupedByColumns } from '@/lib/getTodosGroupedByColumns';
import uploadImage from '@/lib/uploadImage';
import { create } from 'zustand'

interface BoardState {
    // Type
    board: Board;
    getBoard: () => void;
    updateTodoInDB: (todo: Todo, columnId: TypedColumn) => void;
    newTaskInput: string;
    newTaskType: TypedColumn;
    searchString: string;
    image: File | null;

    // Set
    setBoardState: (board: Board) => void;
    setNewTaskInput: (input: string) => void;
    setNewTaskType: (columnId: TypedColumn) => void;
    setSearchString: (searchString: string) => void;
    setImage: (image: File | null ) => void;

    addTask: (todo: string, columnId: TypedColumn, image?: File | null);
    deleteTask: (taskIndex: number, todoId: Todo, id: TypedColumn) => void;
    
}

export const useBoardStore = create<BoardState>((set, get) => ({
    board: {
        columns: new Map<TypedColumn, Column>()
    },
    searchString: "",
    newTaskInput: "",
    newTaskType: "todo",
    image: null,

    getBoard: async() => {
        const board = await getTodosGroupedByColumns();
        set({ board });
    },

    deleteTask: async(taskIndex: number, todo: Todo, id: TypedColumn) => {
        const newColumns = new Map(get().board.columns);

        // Delete todoId from newColumns
        newColumns.get(id)?.todos.splice(taskIndex, 1);
        set({ board: { columns: newColumns } });

        if(todo.image) {
            await storage.deleteFile(todo.image.bucketId, todo.image.fileId);
        }

        await databases.deleteDocument(
            process.env.NEXT_PUBLIC_DATABASE_ID!,
            process.env.NEXT_PUBLIC_TODOS_COLLECTION_ID!,
            todo.$id,
        );
    },

    setSearchString: (searchString) => set({ searchString }),
    setBoardState: (board) => set({ board }),
    setNewTaskInput: (input: string) => set({ newTaskInput: input}),
    setNewTaskType: (columnId: TypedColumn) => set({ newTaskType: columnId}),
    setImage: (image: File | null) => set({ image }),
    
    updateTodoInDB: async(todo, columnId) => {
        await databases.updateDocument(
            process.env.NEXT_PUBLIC_DATABASE_ID!,
            process.env.NEXT_PUBLIC_TODOS_COLLECTION_ID!,
            todo.$id,
            {
                title: todo.title,
                status: columnId
            }
        );
    },

    addTask: async(todo: string, columnId: TypedColumn, image?: File | null) => {
        let file: Image | undefined;

        if (image) {
            const fileUploaded = await uploadImage(image);
            if (fileUploaded) {
                file = {
                    bucketId: fileUploaded.bucketId,
                    fileId: fileUploaded.$id,
                };
            }
        }

        const { $id } = await databases.updateDocument(
            process.env.NEXT_PUBLIC_DATABASE_ID!,
            process.env.NEXT_PUBLIC_TODOS_COLLECTION_ID!,
            ID.unique(),
            {
                title: todo,
                status: columnId,
                // Include image if it exists
                ...(file && { image: JSON.stringify(file) }),
            }
        );

        set({ newTaskInput: "" });

        set((state) => {
            const newColumns = new Map(state.board.columns)

            const newTodo: Todo = {
                $id,
                $createdAt: new Date().toISOString(),
                title: todo,
                status: columnId,
                // Include image if it exists
                ...(file && { image: file })
            },

            const column = newColumns.get(columnId);

            if (!column) {
                newColumns.set(columnId, {
                    id: columnId,
                    todos: [newTodo]
                });
            } else {
                newColumns.get(columnId)?.todos.push(newTodo);
            }
            return {
                board: {
                    columns: newColumns
                }
            }
        })
    }
}));