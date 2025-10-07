export type ID = number

export type ColumnType = "checkbox" | "text"

export interface City {
  id: number
  name: string
}

export interface Category {
  id: number
  name: string
  type: ColumnType
}

export interface Guest {
  id: number
  name: string
  city_id: number | null
}

export interface GuestCheck {
  guest_id: number
  category_id: number
  checked: boolean
}

export interface AppState {
  cities: City[]
  categories: Category[]
  guests: Guest[]
}

export interface AppBootstrap {
  cities: City[]
  categories: Category[]
  guests: Guest[]
  checks: GuestCheck[]
}
