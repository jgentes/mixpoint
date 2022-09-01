import { ICON_TYPES } from '@elastic/eui'
import { ValuesType } from 'utility-types'

// this file is used to import icons from the EUI library for consumption in various components
// https://elastic.github.io/eui/#/display/icons

import { appendIconComponentCache } from '@elastic/eui/es/components/icon/icon'

import { icon as arrowDown } from '@elastic/eui/es/components/icon/assets/arrow_down'
import { icon as dot } from '@elastic/eui/es/components/icon/assets/dot'

type IconComponentNameType = ValuesType<typeof ICON_TYPES>
type IconComponentCacheType = Partial<Record<IconComponentNameType, unknown>>

const cachedIcons: IconComponentCacheType = {
  arrowDown,
  dot,
}

appendIconComponentCache(cachedIcons)
