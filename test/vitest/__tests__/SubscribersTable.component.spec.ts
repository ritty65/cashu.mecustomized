import { mount } from '@vue/test-utils';
import SubscribersTable from 'src/components/subscribers/SubscribersTable.vue';

it('renders rows and emits select', async () => {
  const subs = [
    { id: '1', name: 'Alice' },
    { id: '2', name: 'Bob' },
  ];
  const w = mount(SubscribersTable, { props: { subscribers: subs as any } });
  expect(w.text()).toContain('Alice');
  await w.findAll('tbody tr')[0].trigger('click');
  expect(w.emitted('select')![0][0].name).toBe('Alice');
});

