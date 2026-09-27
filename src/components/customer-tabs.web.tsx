import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { StyleSheet } from 'react-native';

import { CustomTabList, TabButton } from '@/components/app-tabs.web';

export default function CustomerTabs() {
  return (
    <Tabs>
      <TabSlot style={styles.slot} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/(customer)/(tabs)/home" asChild>
            <TabButton>Home</TabButton>
          </TabTrigger>
          <TabTrigger name="bookings" href="/(customer)/(tabs)/bookings" asChild>
            <TabButton>Bookings</TabButton>
          </TabTrigger>
          <TabTrigger name="me" href="/(customer)/(tabs)/me" asChild>
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
