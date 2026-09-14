const navigation = {
  id: 'navigation',
  title: '',
  type: 'group',
  children: [
    {
      id: 'dashboard',
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
      icon: 'ti ti-id'
    }
  ]
};

export default navigation;