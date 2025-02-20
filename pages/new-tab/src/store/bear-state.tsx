import type { TodoItem, TodoList } from '../models';

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

export type BearState = TaskSlice;
