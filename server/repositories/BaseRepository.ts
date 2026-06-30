import type { Paginated, PaginationParams } from "@/server/domain/types";

export abstract class BaseRepository<TEntity, TCreateInput, TUpdateInput> {
  abstract findById(id: string): Promise<TEntity | null>;
  abstract findAll(params?: PaginationParams): Promise<Paginated<TEntity>>;
  abstract create(input: TCreateInput): Promise<TEntity>;
  abstract update(id: string, input: TUpdateInput): Promise<TEntity | null>;
  abstract delete(id: string): Promise<boolean>;

  protected paginate<T>(items: T[], total: number, params?: PaginationParams): Paginated<T> {
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 20;
    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
