import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Linking, Pressable, Share, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from '@expo/dom-webview';
import * as Files from 'expo-file-system/legacy';
import screens from './generated/screens.json';
import { fetchCatalogPage, shopDomain } from './shopify';
import * as ImagePicker from 'expo-image-picker';
import { requireNativeModule } from 'expo';
import { scanIdentifiers } from './scan-identifiers';

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
  const scanning = useRef(false);
  const scanPhoto = useRef(null);
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
    if (msg.type === 'scan' && Number.isSafeInteger(msg.key) && ['camera','gallery'].includes(msg.source)) {
      if (scanning.current) return;
      scanning.current = true;
      let result = null, failure = null;
      try {
        if (msg.source === 'camera') {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (!permission.granted) throw new Error('Camera access is off. Allow it in phone settings or choose a photo.');
        }
        const photo = await (msg.source === 'camera' ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync)({mediaTypes:['images'], quality:0.8, base64:true, exif:false});
        if (!photo.canceled) {
          const image = photo.assets[0];
          scanPhoto.current = image;
          const text = await requireNativeModule('VacuumOcr').recognize(image.uri);
          result = { text, candidates:scanIdentifiers(text), visualAvailable:/^https:\/\//.test(process.env.EXPO_PUBLIC_VISUAL_SEARCH_URL || ''), preview:'data:' + (image.mimeType || 'image/jpeg') + ';base64,' + image.base64 };
        }
      } catch (err) { failure = err.message || 'Could not read this photo. Please try again.'; }
      finally { scanning.current = false; }
      web.current?.injectJavaScript('window.vacuumScreens.receive(...' + JSON.stringify([msg.key,result,failure]) + ')');
      return;
    }
    if (msg.type === 'visual-search' && Number.isSafeInteger(msg.key)) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45000);
      let result = null, failure = null;
      try {
        const endpoint = process.env.EXPO_PUBLIC_VISUAL_SEARCH_URL || '';
        if (!/^https:\/\//.test(endpoint) || !scanPhoto.current) throw new Error('Photo matching is not connected yet. Search by number or contact fitment support.');
        const photo = scanPhoto.current;
        const file = await fetch(photo.uri);
        const body = await file.blob();
        if (body.size > 5000000) throw new Error('Choose a photo smaller than 5 MB.');
        const response = await fetch(endpoint, {method:'POST', headers:{'Content-Type':photo.mimeType || 'image/jpeg'}, body, signal:controller.signal});
        if (!response.ok) throw new Error('Photo matching is unavailable. Try again or search by number.');
        const data = await response.json();
        if (!Array.isArray(data.ids)) throw new Error('Photo matching returned an invalid response.');
        result = {ids:data.ids.filter(id => typeof id === 'string' && /^gid:\/\/shopify\/Product\/\d+$/.test(id)).slice(0,5)};
      } catch (err) { failure = controller.signal.aborted ? 'Photo matching took too long. Please try again.' : err.message; }
      finally { clearTimeout(timeout); }
      web.current?.injectJavaScript('window.vacuumScreens.receive(...' + JSON.stringify([msg.key,result,failure]) + ')');
      return;
    }
    if (msg.type === 'share' && typeof msg.title === 'string') {
      const url = typeof msg.url === 'string' && /^https:\/\//i.test(msg.url) ? msg.url : '';
      Share.share({ title: msg.title, message: msg.title + (url ? '\n' + url : '') }).catch(() => {});
      return;
    }
    if (msg.type === 'link') {
      let productLink = false;
      try {
        const url = new URL(msg.url);
        productLink = url.protocol === 'https:' && ['www.vacuumpro.com', 'vacuumpro.com', shopDomain].includes(url.hostname) && url.pathname.startsWith('/products/');
      } catch {}
      if (['mailto:support@vacuumpro.com', 'tel:+18885943555', 'https://shop.com/',
        'https://www.vacuumpro.com/pages/shipping-policy',
        'https://www.vacuumpro.com/pages/returns-refunds',
        'https://www.vacuumpro.com/pages/fitment-guarantee'].includes(msg.url) || productLink) {
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
