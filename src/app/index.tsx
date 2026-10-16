import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import NavBar, { Tab } from './components/nav_bar';
import Home from './layouts/home_layout';
import Search from './layouts/search_layout';

export default function HomeScreen() {
  const [tab, setTab] = useState<Tab>('home');
  return (
    <View style={styles.container}>
      <View style={styles.content}>{tab === 'home' ? <Home /> : <Search />}</View>
      <NavBar active={tab} onChange={setTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

