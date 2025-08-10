import type { Meta, StoryObj } from '@storybook/vue3';
import CreatorSubscribersPage from '../pages/CreatorSubscribersPage.vue';

const meta: Meta<typeof CreatorSubscribersPage> = {
  title: 'Pages/CreatorSubscribersPage',
  component: CreatorSubscribersPage,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  render: () => ({
    components: { CreatorSubscribersPage },
    template: '<creator-subscribers-page />',
  }),
};

export const Mobile: Story = {
  render: () => ({
    components: { CreatorSubscribersPage },
    template: '<div style="width: 360px"><creator-subscribers-page /></div>',
  }),
};
