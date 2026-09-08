import { useCallback, useEffect, useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ScrollParallaxBackground from './components/ScrollParallaxBackground';
import ProductGrid from './components/ProductGrid';
import ProductModal from './components/ProductModal';
import CheckoutNotice from './components/CheckoutNotice';
import OurStory from './components/OurStory';
import ShippingInfo from './components/ShippingInfo';
import EbaySection from './components/EbaySection';
import Footer from './components/Footer';
import { getWatchBySlug, type Watch } from './data/watches';

const WATCH_PATH = /^\/w\/([a-z0-9-]+)\/?$/i;

function watchFromLocation(): Watch | null {
  const match = window.location.pathname.match(WATCH_PATH);
  return match ? getWatchBySlug(match[1]) ?? null : null;
}

export default function App() {
  const [activeWatch, setActiveWatch] = useState<Watch | null>(watchFromLocation);

  const openWatch = useCallback((watch: Watch) => {
    setActiveWatch(watch);
    if (!window.location.pathname.match(WATCH_PATH)) {
      window.history.pushState({}, '', `/w/${watch.slug}`);
    } else {
      window.history.replaceState({}, '', `/w/${watch.slug}`);
    }
  }, []);

  const closeWatch = useCallback(() => {
    setActiveWatch(null);
    if (window.location.pathname.match(WATCH_PATH)) {
      window.history.pushState({}, '', '/');
    }
  }, []);

  // Keep the modal in sync with browser back/forward navigation.
  useEffect(() => {
    const onPopState = () => setActiveWatch(watchFromLocation());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return (
    <div className="relative min-h-screen text-charcoal">
      <ScrollParallaxBackground />
      <Header />

      <main>
        <Hero />
        <ProductGrid onOpen={openWatch} />
        <OurStory />
        <ShippingInfo />
        <EbaySection />
      </main>

      <Footer />

      {activeWatch && <ProductModal watch={activeWatch} onClose={closeWatch} />}

      <CheckoutNotice />
    </div>
  );
}
