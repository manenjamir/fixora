import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { StyleSheet } from 'react-native';

import { CustomTabList, TabButton } from '@/components/app-tabs.web';

export default function TechTabs() {
  return (
    <Tabs>
      <TabSlot style={styles.slot} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="inbox" href="/(tech)/(tabs)/inbox" asChild>
            <TabButton>Jobs</TabButton>
          </TabTrigger>
          <TabTrigger name="route" href="/(tech)/(tabs)/route" asChild>
            <TabButton>Route</TabButton>
          </TabTrigger>
          <TabTrigger name="crew" href="/(tech)/(tabs)/crew" asChild>
            <TabButton>Account</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  slot: { height: '100%' },
});
