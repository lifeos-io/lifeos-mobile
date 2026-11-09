import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';

import { TabBarFrame, TabButton, tabs } from '@/components';

export default function TabsLayout() {
  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />
      <TabList asChild>
        <TabBarFrame>
          {tabs.map(({ name, href, label, Icon }) => (
            <TabTrigger key={name} name={name} href={href} asChild>
              <TabButton label={label} Icon={Icon} />
            </TabTrigger>
          ))}
        </TabBarFrame>
      </TabList>
    </Tabs>
  );
}
