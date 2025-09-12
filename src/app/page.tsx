// src/app/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import LocationPin from "../components/LocationPin";
import ServiceCards from "../components/ServiceCards";
import { Montserrat, Poppins } from "next/font/google";
import ContactHelpCenter from "../components/ContactHelpCenter";
import Footer from "../components/Footer";
import Navbar from "@/components/navbar";
import UserTypeModal from "../components/UserTypeModal"; // ✅ import modal

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const servicesRef = useRef<HTMLDivElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ✅ modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // ✅ check localStorage on first load
    const hasSelected = localStorage.getItem("userTypeSelected");
    if (!hasSelected) {
      setIsModalOpen(true);
    }
  }, []);

  useEffect(() => {
    import("gsap").then(({ default: gsap }) => {
      import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
        gsap.registerPlugin(ScrollTrigger);

        const initAnimation = () => {
          const pinLandingSpot = document.getElementById("pin-landing-spot");
          const mainPin = document.getElementById("main-location-pin");

          if (!pinLandingSpot || !mainPin || !heroRef.current) return;

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: heroRef.current,
              start: "center center",
              end: "bottom top",
              scrub: 1,
              markers: false,
              pin: false,
            },
          });

          const calculateTargetPosition = () => {
            const landingRect = pinLandingSpot.getBoundingClientRect();
            const pinRect = mainPin.getBoundingClientRect();

            const targetY = landingRect.top + window.scrollY - 100;

            return {
              y: targetY,
              x: 0,
              scale: 0.03,
            };
          };

          const targetPos = calculateTargetPosition();

          tl.to("#main-location-pin", {
            y: targetPos.y,
            scale: targetPos.scale,
            duration: 2,
            ease: "power2.out",
            zIndex: 40,
          });
        };

        setTimeout(initAnimation, 500);
        window.addEventListener("resize", initAnimation);

        return () => {
          ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
          window.removeEventListener("resize", initAnimation);
        };
      });
    });
  }, []);

  return (
    <main
      className={`relative overflow-x-hidden ${montserrat.variable} ${poppins.variable} font-montserrat`}
    >
      {/* ✅ User Type Modal */}
      <UserTypeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Enhanced Navigation */}
      <Navbar />

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative h-screen flex items-center justify-center bg-white"
      >
        {/* Main Location Pin that will animate */}
        <LocationPin />
      </section>

      {/* Services Section */}
      <section
        ref={servicesRef}
        className="relative min-h-screen bg-white py-20 px-8"
      >
        <h2 className="text-center font-poppins text-3xl font-bold text-green-1 mb-20 tracking-tight">
          <span className="relative inline-block after:content-[''] after:absolute after:w-16 after:h-1 after:bg-green-800 after:bottom-[-10px] after:left-1/2 after:transform after:-translate-x-1/2">
            SERVICES WE PROVIDE
          </span>
        </h2>

        {/* Pin landing spot */}
        <div
          id="pin-landing-spot"
          className="absolute top-8 left-1/2 transform -translate-x-1/2"
        ></div>

        <ServiceCards />
      </section>
      <ContactHelpCenter />
      <Footer />
    </main>
  );
}
