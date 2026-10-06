const navigation = {
  id: 'navigation',
  title: '',
  type: 'group',
  children: [
  {
    id: 'home',
    title: 'Home',
    type: 'item',
    url: '/',
    icon: 'ti ti-home'
  },
  {
    id: 'rfid-tag-request',
    title: 'RFID Tag Request',
    type: 'item',
    url: '/rfid-tag-request',
    icon: 'ti ti-tag'
  },
  {
    id: 'rfid-sticker-request',
    title: 'RFID Sticker Request',
    type: 'item',
    url: '/rfid-sticker-request',
    icon: 'ti ti-sticker'
  },
  {
    id: 'history',
    title: 'History',
    type: 'item',
    url: '/history',
    icon: 'ti ti-history'
  },
  {
    id: 'stok-xerafy',
    title: 'Stok Xerafy',
    type: 'item',
    url: '/stok-xerafy',
    icon: 'ti ti-package'
  },
  {
    id: 'stok-sticker',
    title: 'Stok Sticker',
    type: 'item',
    url: '/stok-sticker',
    icon: 'ti ti-package'
  },
  {
    id: 'scan-xerafy',
    title: 'Scan Xerafy',
    type: 'item',
    url: '/scan-xerafy',
    icon: 'ti ti-scan'
  },
  {
    id: 'scan-sticker',
    title: 'Scan Sticker',
    type: 'item',
    url: '/scan-sticker',
    icon: 'ti ti-scan'
  }
]
};

export default navigation;