"use client";
import { Montserrat, Poppins } from "next/font/google";
import { useEffect, useState } from "react";
import Link from "next/link";
import { memo } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { usePathname } from "next/navigation";

// Fonts
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

const Navbar = memo(function Navbar() {
  const [user, setUser] = useState(null);
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("User logged out");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const navLinks = [
    { text: "Plan Trip", href: "/itinerary" },
    // { text: "Destinations", href: "/destinations" },
    { text: "Marketplace", href: "/marketplace" },
    { text: "Tour Guide", href: "/tour-guide" },
  ];

  return (
    <main
      className={`relative overflow-visible ${montserrat.variable} ${poppins.variable} font-montserrat `}
    >
      <nav className="fixed top-1 left-0 right-0 z-50 bg-transparent shadow-none">
        <div className="mx-auto max-w-6xl px-3">
          {/* Bullet Train row */}
          <div
            className="relative flex items-end flex-nowrap gap-x-0 overflow-x-hidden py-3 min-w-0"
            role="navigation"
            aria-label="Primary"
          >
            {/* continuous join line under all coaches */}
            <div
              className="pointer-events-none absolute left-0 right-0 bottom-1 h-0.5 bg-gray-300 z-0"
              aria-hidden="true"
            />
            {/* Engine (Brand) - bullet nose */}
            <Link
              href="/"
              prefetch={false}
              aria-label="Namaste Jharkhand - Home"
              className="flex-[1_1_0%] min-w-40"
            >
              <div className="relative z-10 group select-none">
                {/* nose (pointed) */}

                {/* body */}
                <div
                  className={`relative isolate h-12 pl-6 pr-6 rounded-tl-[999px] rounded-bl-[250px] rounded-r-2xl
                    border-t border-b border-l border-r border-teal-800 shadow-sm flex items-center gap-3 ${
                      pathname === "/"
                        ? "bg-teal-600 text-white"
                        : "bg-white text-gray-900"
                    }`}
                >
                  <img
                    src="/images/lg2.png"
                    alt="Namaste Jharkhand"
                    height={60}
                    width={60}
                  />
                  {/* brand */}
                  <span className="relative z-10 font-poppins font-bold text-sm tracking-tight truncate px-5"></span>
                  {/* windows */}

                  <div
                    className="relative z-10 flex gap-1 ml-1"
                    aria-hidden="true"
                  >
                    <span
                      className={`w-4 h-2.5 rounded-[3px] ${
                        pathname === "/" ? "bg-white/90" : "bg-neutral-800"
                      }`}
                    />
                    <span
                      className={`w-4 h-2.5 rounded-[3px] ${
                        pathname === "/" ? "bg-white/90" : "bg-neutral-800"
                      }`}
                    />
                  </div>
                </div>
                {/* wheels */}
                <div
                  className="absolute -bottom-2 left-5 w-2.5 h-2.5 bg-black/70 rounded-full"
                  aria-hidden="true"
                />
                <div
                  className="absolute -bottom-2 right-6 w-2.5 h-2.5 bg-black/70 rounded-full"
                  aria-hidden="true"
                />
              </div>
            </Link>
            <div
              className="relative w-px mx-2 self-center h-0.5 bg-gray-300 rounded shrink-0"
              aria-hidden="true"
            >
              <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-0.5 w-6 bg-gray-400 rounded" />
            </div>
            {/* Coaches (Nav Links) */}
            {navLinks.map((item, idx) => {
              const isActive = pathname === item.href;

              return (
                <div
                  key={item.href}
                  className="flex items-end gap-0 flex-[1_1_0%] min-w-0 font-semibold"
                >
                  <Link
                    href={item.href}
                    prefetch={false}
                    aria-label={item.text}
                    className="block w-full min-w-0"
                  >
                    <div className="relative z-10 group select-none">
                      {/* coach body */}
                      <div
                        className={`relative isolate h-12 pl-4 pr-8 items-center border border-teal-800 rounded-[14px] shadow-sm flex items-center w-full ${
                          isActive
                            ? "bg-teal-600 text-white"
                            : "bg-white text-gray-900"
                        }`}
                      >
                        <span className="relative z-10 font-poppins text-sm pr-2 truncate ">
                          {item.text}
                        </span>
                        <div
                          className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1.5 pointer-events-none"
                          aria-hidden="true"
                        >
                          <span
                            className={`w-3.5 h-2.5 rounded-[3px] ${
                              isActive ? "bg-white/90" : "bg-neutral-800"
                            }`}
                          />
                          <span
                            className={`w-3.5 h-2.5 rounded-[3px] ${
                              isActive ? "bg-white/90" : "bg-neutral-800"
                            }`}
                          />
                        </div>
                      </div>
                      {/* wheels */}
                      <div
                        className="absolute -bottom-2 left-4 w-2.5 h-2.5 bg-black/70 rounded-full"
                        aria-hidden="true"
                      />
                      <div
                        className="absolute -bottom-2 right-4 w-2.5 h-2.5 bg-black/70 rounded-full"
                        aria-hidden="true"
                      />
                    </div>
                  </Link>
                  {idx < navLinks.length - 1 ? (
                    <div
                      className="relative w-px mx-2 self-center h-0.5 bg-gray-300 rounded shrink-0"
                      aria-hidden="true"
                    >
                      <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-0.5 w-6 bg-gray-400 rounded" />
                    </div>
                  ) : null}
                </div>
              );
            })}

            {/* Caboose (Sign In) - keep red CTA feel */}

            <div
              className="relative w-px mx-2 self-center h-0.5 bg-gray-300 rounded shrink-0"
              aria-hidden="true"
            >
              <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-0.5 w-6 bg-gray-400 rounded" />
            </div>
            <div
              className="relative w-px self-center h-0.5 bg-gray-300 rounded shrink-0"
              aria-hidden="true"
            >
              <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-0.5 w-6 bg-gray-400 rounded" />
            </div>
            {user ? (
              <Link
                href="/"
                prefetch={false}
                aria-label="Sign In"
                className="flex-[1_1_0%] min-w-0"
              >
                <div className="relative z-10 group select-none">
                  {/* caboose body (red to preserve original CTA color) */}
                  <div className="relative isolate bg-white text-black h-12 pl-5 pr-8 rounded-r-[14px] shadow-sm flex items-center">
                    <button
                      onClick={handleLogout}
                      className="relative z-10 font-poppins font-medium text-sm truncate"
                    >
                      Logout
                    </button>
                    {/* windows */}
                    <div
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1.5 pointer-events-none"
                      aria-hidden="true"
                    >
                      <span className="w-3.5 h-2.5 bg-black/90 rounded-[3px]" />
                      <span className="w-3.5 h-2.5 bg-black/90 rounded-[3px]" />
                    </div>
                    {/* tail plate */}
                    <div
                      className="absolute -right-3 top-1/2 -translate-y-1/2 w-2 h-6 bg-white/90 rounded-sm pointer-events-none"
                      aria-hidden="true"
                    />
                  </div>
                  {/* wheels */}
                  <div
                    className="absolute -bottom-2 left-4 w-2.5 h-2.5 bg-black/70 rounded-full"
                    aria-hidden="true"
                  />
                  <div
                    className="absolute -bottom-2 right-4 w-2.5 h-2.5 bg-black/70 rounded-full"
                    aria-hidden="true"
                  />
                </div>
              </Link>
            ) : (
              <Link
                href="/auth"
                prefetch={false}
                aria-label="Sign In"
                className="flex-[1_1_0%] min-w-0"
              >
                <div className="relative z-10 group select-none">
                  {/* caboose body (red to preserve original CTA color) */}
                  <div className="relative isolate bg-white border border-teal-800  text-black h-12 pl-5 pr-8 rounded-r-[14px] shadow-sm flex items-center">
                    <span className="relative z-10 font-poppins font-medium text-sm truncate">
                      Sign In
                    </span>
                    {/* windows */}
                    <div
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1.5 pointer-events-none"
                      aria-hidden="true"
                    >
                      <span className="w-3.5 h-2.5 bg-black/90 rounded-[3px]" />
                      <span className="w-3.5 h-2.5 bg-black/90 rounded-[3px]" />
                    </div>
                    {/* tail plate */}
                    <div
                      className="absolute -right-3 top-1/2 -translate-y-1/2 w-2 h-6 bg-white/90 rounded-sm pointer-events-none"
                      aria-hidden="true"
                    />
                  </div>
                  {/* wheels */}
                  <div
                    className="absolute -bottom-2 left-4 w-2.5 h-2.5 bg-black/70 rounded-full"
                    aria-hidden="true"
                  />
                  <div
                    className="absolute -bottom-2 right-4 w-2.5 h-2.5 bg-black/70 rounded-full"
                    aria-hidden="true"
                  />
                </div>
              </Link>
            )}
          </div>
        </div>
      </nav>
    </main>
  );
});

export default Navbar;
