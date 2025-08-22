// Small reusable utility types for update/patch payloads
export type PartialWithRequiredId<
    T,
    Id extends keyof T = Extract<'id', keyof T>
> = Partial<T> & Pick<T, Id>;

export type UpdatePayload<T> = PartialWithRequiredId<T>;
