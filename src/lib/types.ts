export type SalonType = 'رجالية' | 'نسائية' | 'مختلطة'

export interface SalonService {
  id: string
  name: string
  category: string
  price: number
  duration: number
  description: string
  popular?: boolean
}

export interface Barber {
  id: string
  name: string
  role: string
  experience: string
  rating: number
  image: string
  specialties: string[]
}

export interface SalonReview {
  id: string
  name: string
  rating: number
  comment: string
  date: string
  service: string
}

export interface Salon {
  id: string
  slug: string
  name: string
  tagline: string
  description: string
  type: SalonType
  neighborhood: string
  address: string
  phone: string
  rating: number
  reviewsCount: number
  priceLevel: 1 | 2 | 3

  image: string
  logo?: string
  gallery: string[]

  services: SalonService[]
  barbers: Barber[]
  reviews: SalonReview[]
  features: string[]

  workingHours: string
  isOpen: boolean
  featured: boolean
  verified: boolean
  established: number
}

export interface BookingService {
  id: string
  name: string
  price: number
  duration: number
}


export type StyleCategory =
  | 'fade'
  | 'classic'
  | 'modern'
  | 'curly'
  | 'long'
  | 'short'
  | 'beard'
  | 'mustache'
  | 'other'
  | 'boxed'
  | 'full'
  | 'goatee'
  | 'styled'
  | 'natural'


export interface StyleOption {
  id: string
  name: string
  nameAr: string
  category: StyleCategory
  imageUrl: string
  description?: string
}

export interface BookingStyleSelection {
  styleId: string
  styleName: string
  category: StyleCategory
  imageUrl: string
}

export type BookingStatus = 'مؤكد' | 'ملغى' | 'مكتمل'

export interface Booking {
  id: string
  code: string
  salonId: string
  salonName: string
  services: BookingService[]
   hairStyle?: BookingStyleSelection | null
  beardStyle?: BookingStyleSelection | null
  barberName: string
  date: string
  time: string
  clientName: string
  phone: string
  email: string
  notes: string
  totalPrice: number
  discount: number
  promoCode?: string

  /** صاحب الحجز — يُستخدم لعرض حجوزات كل زبون له فقط */
  userId?: string

  status: BookingStatus
  createdAt: string
}


export interface UpcomingBookingDisplay {
  salonId: string
  salonName: string
  services: BookingService[]
  barberName: string
  date: string
  time: string
  totalPrice: number
  status: BookingStatus
}


export interface User {
  id: string
  name: string
  email: string
  phone: string
  type: 'client' | 'owner'

  /** الصالون الذي يديره صاحب الحساب */
  salonId?: string

  createdAt: string
}

export interface StoredUser extends User {
  password: string
}

export interface ToastItem {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}