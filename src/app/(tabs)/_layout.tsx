import { Redirect } from 'expo-router';
import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';

import { useProfile } from '@/api/hooks';
import { TabBarFrame, TabButton, tabs } from '@/components';

export default function TabsLayout() {
  const profile = useProfile();

  // A user who has not defined a mission yet starts there.
  if (profile.data && !profile.data.onboardingCompleted) {
    return <Redirect href="/onboarding" />;
  }

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
