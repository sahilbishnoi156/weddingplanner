export type ID = string

export type ColumnType = "checkbox" | "text" // text is optional/future

export interface City {
  id: ID
  name: string
}

export interface CategoryColumn {
  id: ID
  label: string
  type: ColumnType
}

export interface Guest {
  id: ID
  name: string
  cityIds: ID[]
  values: Record<ID, boolean | string>
}

export interface AppState {
  cities: City[]
  categories: CategoryColumn[]
  guests: Guest[]
}
