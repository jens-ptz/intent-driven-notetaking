import { Route, Routes } from 'react-router-dom';
import { PublicFeedPage } from './pages/PublicFeedPage';

/**
 * Routes are added by the web-client step tasks. Only the anonymous public
 * feed exists so far, which is also the landing page.
 */
export function App(): JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<PublicFeedPage />} />
    </Routes>
  );
}
