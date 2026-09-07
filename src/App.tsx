import { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ScrollParallaxBackground from './components/ScrollParallaxBackground';
import ProductGrid from './components/ProductGrid';
import ProductModal from './components/ProductModal';
import OurStory from './components/OurStory';
import ShippingInfo from './components/ShippingInfo';
import EbaySection from './components/EbaySection';
import Footer from './components/Footer';
import type { Watch } from './data/watches';

export default function App() {
  const [activeWatch, setActiveWatch] = useState<Watch | null>(null);

  return (
    <div className="relative min-h-screen text-charcoal">
      <ScrollParallaxBackground />
      <Header />

      <main>
        <Hero />
        <ProductGrid onOpen={setActiveWatch} />
        <OurStory />
        <ShippingInfo />
        <EbaySection />
      </main>

      <Footer />

      {activeWatch && (
        <ProductModal watch={activeWatch} onClose={() => setActiveWatch(null)} />
      )}
    </div>
  );
}
