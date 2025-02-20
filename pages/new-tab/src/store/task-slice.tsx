import { type StateCreator } from 'zustand';
import type { TodoItem, TodoList } from '../models';
import { db } from '../models';

export interface TaskSlice {
  todoLists: (TodoList & { items: TodoItem[] })[];
  // Actions
  fetchTodoLists: () => Promise<void>;
  addTodoList: (title: string) => Promise<void>;
  deleteTodoList: (id: number) => Promise<void>;
  addTodoItem: (listId: number, title: string) => Promise<void>;
  toggleTodoItem: (itemId: number, done: boolean) => Promise<void>;
  deleteTodoItem: (itemId: number) => Promise<void>;
}

export const createTaskSlice: StateCreator<TaskSlice> = (set, get) => ({
  todoLists: [],

  fetchTodoLists: async () => {
    const lists = await db.todoLists.toArray();
    const items = await db.todoItems.toArray();

    const todoLists = lists.map(list => ({
      ...list,
      items: items.filter(item => item.todoListId === list.id),
    }));

    set({ todoLists });
  },

  addTodoList: async (title: string) => {
    const id = await db.todoLists.add({ title });
    const newList = await db.todoLists.get(id);
    if (newList) {
      set(state => ({
        todoLists: [...state.todoLists, { ...newList, items: [] }],
      }));
    }
  },

  deleteTodoList: async (id: number) => {
    await db.deleteList(id);
    set(state => ({
      todoLists: state.todoLists.filter(list => list.id !== id),
    }));
  },

  addTodoItem: async (listId: number, title: string) => {
    const id = await db.todoItems.add({
      todoListId: listId,
      title,
      done: false,
    });
    const newItem = await db.todoItems.get(id);
    if (newItem) {
      set(state => ({
        todoLists: state.todoLists.map(list =>
          list.id === listId ? { ...list, items: [...list.items, newItem] } : list,
        ),
      }));
    }
  },

  toggleTodoItem: async (itemId: number, done: boolean) => {
    await db.todoItems.update(itemId, { done });
    set(state => ({
      todoLists: state.todoLists.map(list => ({
        ...list,
        items: list.items.map(item => (item.id === itemId ? { ...item, done } : item)),
      })),
    }));
  },

  deleteTodoItem: async (itemId: number) => {
    await db.todoItems.delete(itemId);
    set(state => ({
      todoLists: state.todoLists.map(list => ({
        ...list,
        items: list.items.filter(item => item.id !== itemId),
      })),
    }));
  },
});
