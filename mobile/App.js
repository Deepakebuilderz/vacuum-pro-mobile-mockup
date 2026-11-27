import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Linking, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from '@expo/dom-webview';
import * as Files from 'expo-file-system/legacy';
import screens from './generated/screens.json';
import { fetchCatalogPage } from './shopify';

async function installScreens() {
  const dir = Files.cacheDirectory + 'vacuum-screens-' + screens.version + '/';
  const uri = dir + 'shell.html';
  if ((await Files.getInfoAsync(uri)).exists) return { uri };
  await Files.makeDirectoryAsync(dir + 'catalog-images/', { intermediates: true });
  for (const [name, content] of Object.entries(screens.images)) {
    await Files.writeAsStringAsync(dir + name, content, { encoding: Files.EncodingType.Base64 });
  }
  for (const [name, content] of Object.entries(screens.files)) {
    if (name !== 'shell.html') await Files.writeAsStringAsync(dir + name, content);
  }
  await Files.writeAsStringAsync(uri, screens.files['shell.html']);
  return { uri };
}

export default function App() {
  const web = useRef(null);
  const atWelcome = useRef(true);
  const [source, setSource] = useState(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setError(false);
    installScreens().then(value => { if (active) setSource(value); })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [attempt]);
  useEffect(() => {
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      if (atWelcome.current) return false;
      web.current?.injectJavaScript('window.vacuumScreens.back()');
      return true;
    });
    return () => back.remove();
  }, []);
  const message = useCallback(async event => {
    let msg;
    try { msg = JSON.parse(event.nativeEvent.data); } catch { return; }
    if (msg.type === 'screen') { atWelcome.current = msg.root; return; }
    if (msg.type === 'link') {
      if (['mailto:support@vacuumpro.com', 'tel:+18885943555', 'https://shop.com/'].includes(msg.url)) {
        Linking.openURL(msg.url).catch(() => {});
      }
      return;
    }
    if (msg.type !== 'catalog' || !Number.isSafeInteger(msg.key) ||
        !['products','collections','collectionProducts'].includes(msg.feed)) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 18000);
    let page = null;
    let failure = null;
    try { page = await fetchCatalogPage(msg.feed, msg.id, msg.after, controller.signal); }
    catch (err) { failure = controller.signal.aborted ? 'Shopify took too long to respond.' : err.message; }
    finally { clearTimeout(timeout); }
    web.current?.injectJavaScript('window.vacuumScreens.receive(...' + JSON.stringify([msg.key, page, failure]) + ')');
  }, []);
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.page}>
        <StatusBar barStyle="dark-content" />
        {source ? <WebView ref={web} source={source} onMessage={message} useExpoModulesBridge={false} />
          : <View style={styles.status}>{error
            ? <Pressable accessibilityRole="button" onPress={() => setAttempt(n => n + 1)}><Text>Could not open Vacuum PRO. Tap to retry.</Text></Pressable>
            : <ActivityIndicator accessibilityLabel="Opening Vacuum PRO" color="#1c3158" />}</View>}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fff' },
  status: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
});
