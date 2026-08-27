'use client';
import { useState, useCallback } from 'react';
import LoadingScreen from '@/components/LoadingScreen';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import MarqueeTicker from '@/components/MarqueeTicker';
import AccessoriesGrid from '@/components/AccessoriesGrid';
import Collection from '@/components/Collection';
import Lookbook from '@/components/Lookbook';
import FullWinters from '@/components/FullWinters';
import Newsletter from '@/components/Newsletter';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';

export default function Home() {
  const [loaded, setLoaded] = useState(false);

  const handleLoadComplete = useCallback(() => {
    setLoaded(true);
  }, []);

  return (
    <>
      <LoadingScreen onComplete={handleLoadComplete} />
      <motion.div
        initial={{ opacity: 0 }}
        animate={loaded ? { opacity: 1 } : {}}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <Navbar />
        <main>
          <Hero />
          <MarqueeTicker />
          {/* <AccessoriesGrid /> */}
          <Collection />
          <Lookbook />
          <FullWinters />
          <Newsletter />
        </main>
        <Footer />
      </motion.div>
    </>
  );
}
