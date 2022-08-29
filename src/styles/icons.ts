import { ICON_TYPES } from '@elastic/eui'
import { ValuesType } from 'utility-types'

import { appendIconComponentCache } from '@elastic/eui/es/components/icon/icon'

import { icon as magnifyWithMinus } from '@elastic/eui/es/components/icon/assets/magnifyWithMinus'
import { icon as minus } from '@elastic/eui/es/components/icon/assets/minus'
import { icon as magnifyWithPlus } from '@elastic/eui/es/components/icon/assets/magnifyWithPlus'
import { icon as plus } from '@elastic/eui/es/components/icon/assets/plus'
import { icon as search } from '@elastic/eui/es/components/icon/assets/search'
import { icon as arrowDown } from '@elastic/eui/es/components/icon/assets/arrow_down'
import { icon as dot } from '@elastic/eui/es/components/icon/assets/dot'

type IconComponentNameType = ValuesType<typeof ICON_TYPES>
type IconComponentCacheType = Partial<Record<IconComponentNameType, unknown>>

const cachedIcons: IconComponentCacheType = {
  magnifyWithMinus,
  magnifyWithPlus,
  minus,
  plus,
  search,
  arrowDown,
  dot,
}

appendIconComponentCache(cachedIcons)
