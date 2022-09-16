export interface Todo {
  todoId: string
  createdAt: string
  name: string
  dueDate: string
  done: boolean
  attachmentUrl?: string
}

export interface ResultTodo {
  items : Todo[],
  nextKey : string
}
