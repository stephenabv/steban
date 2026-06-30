export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type PaginationParams = {
  page?: number;
  pageSize?: number;
};

export type SortOrder = "asc" | "desc";

export interface AppError {
  code: string;
  message: string;
  details?: unknown;
}

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function err<E = Error>(error: E): Result<never, E> {
  return { ok: false, error };
}
