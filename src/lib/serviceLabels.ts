
import type { SalonService, BookingService } from './types'

export type StandardServiceCategory =
  | 'haircut'
  | 'hair-treatment'
  | 'beard'
  | 'other'

type ServiceForLabel = Pick<BookingService, 'name'> &
  Partial<Pick<SalonService, 'category' | 'description'>>

export const getStandardServiceCategory = (
  service: ServiceForLabel,
): StandardServiceCategory => {
  const text =
    `${service.name} ${service.category ?? ''} ${service.description ?? ''}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

  if (
    /ذقن|لحيه|beard|mustache|moustache|barbe|rasage|shave/.test(text)
  ) {
    return 'beard'
  }

  if (
    /lissage|keratine|keratin|traitement cheveux|hair treatment|soin capillaire|علاج الشعر|فرد الشعر/.test(text)
  ) {
    return 'hair-treatment'
  }

  if (
    /قص شعر|قص وتصفيف|تصفيف الشعر|قصة شعر|haircut|fade|coupe|ch3ar|cha3r|che3r|cheveux|hair/.test(text)
  ) {
    return 'haircut'
  }

  return 'other'
}

export const getStandardServiceLabel = (
  service: ServiceForLabel,
): string => {
  switch (getStandardServiceCategory(service)) {
    case 'haircut':
      return 'Haircut / قصة شعر'
    case 'hair-treatment':
      return 'Hair treatment / علاج الشعر'
    case 'beard':
      return 'Beard / لحية'
    default:
      return 'Other service / خدمات أخرى'
  }
}
