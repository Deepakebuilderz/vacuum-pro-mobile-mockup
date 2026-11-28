import {render} from 'preact';
import {LocationProvider, ErrorBoundary, Router, Route} from 'preact-iso';
import HomePage from './pages/HomePage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import AppearancePage from './pages/AppearancePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
export default async () => { render(<App />, document.body); };
function App() { return <LocationProvider><s-app-nav><s-link href="/">Setup</s-link><s-link href="/settings">Finder settings</s-link><s-link href="/appearance">Appearance</s-link></s-app-nav><ErrorBoundary><Router><Route path="/" component={HomePage}/><Route path="/settings" component={SettingsPage}/><Route path="/appearance" component={AppearancePage}/><Route default component={NotFoundPage}/></Router></ErrorBoundary></LocationProvider>; }
