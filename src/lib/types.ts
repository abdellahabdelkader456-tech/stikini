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

export type BookingStatus = 'مؤكد' | 'ملغى' | 'مكتمل'

export interface Booking {
  id: string
  code: string
  salonId: string
  salonName: string
  services: BookingService[]
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

export interface User {
  id: string
  name: string
  email: string
  phone: string
  type: 'client' | 'owner'
  /** الصالون الذي يديره صاحب الحساب (لحسابات أصحاب الصالونات فقط) */
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
