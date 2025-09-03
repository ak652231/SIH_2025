"use client"
import { Facebook, Twitter, Instagram, Youtube, Heart } from "lucide-react"
import { Montserrat, Poppins } from "next/font/google"
import Link from "next/link"

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
})

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
})

const Footer = () => {
  const quickLinks = [
    { name: "Home", href: "/" },
    { name: "Plan Trip", href: "/plan" },
    { name: "Destinations", href: "/destinations" },
    { name: "Marketplace", href: "/marketplace" },
    { name: "Resources", href: "/resources" },
    { name: "Contact", href: "/contact" },
  ]

  const socialLinks = [
    {
      name: "Facebook",
      href: "#",
      icon: <Facebook className="h-5 w-5" />,
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      name: "Twitter",
      href: "#",
      icon: <Twitter className="h-5 w-5" />,
      color: "bg-sky-500 hover:bg-sky-600",
    },
    {
      name: "Instagram",
      href: "#",
      icon: <Instagram className="h-5 w-5" />,
      color: "bg-pink-600 hover:bg-pink-700",
    },
    {
      name: "YouTube",
      href: "#",
      icon: <Youtube className="h-5 w-5" />,
      color: "bg-red-600 hover:bg-red-700",
    },
  ]

  const campaigns = [
    {
      title: "Eco-Tourism Drives",
      description: "Support conservation-friendly tourism across Jharkhand’s forests and parks.",
      link: "#",
    },
    {
      title: "Tribal Art & Culture",
      description: "Discover local handicrafts and cultural festivals throughout the year.",
      link: "#",
    },
    {
      title: "Homestay Promotion",
      description: "Experience authentic hospitality in verified community homestays.",
      link: "#",
    },
  ]

  return (
    <footer className={`w-full py-16 px-8 bg-white ${montserrat.variable} ${poppins.variable}`}>
      <div className="max-w-6xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Logo and About */}
          <div className="col-span-1 lg:col-span-1">
            <div className="mb-6">
              <Link href="/" className="flex items-center">
                <span className="font-poppins text-red-600 font-bold text-2xl tracking-tight">JharTour</span>
              </Link>
            </div>
            <p className="font-montserrat text-gray-700 mb-6 leading-relaxed">
              A digital gateway to Jharkhand’s natural beauty, tribal heritage, and cultural experiences—powered by AI,
              secure transactions, and community participation.
            </p>
            <div className="flex space-x-3">
              {socialLinks.map((social, index) => (
                <Link
                  key={index}
                  href={social.href}
                  className={`${social.color} text-white p-2 rounded-full transition-transform hover:scale-110`}
                  aria-label={social.name}
                >
                  {social.icon}
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-span-1">
            <h3 className="font-poppins font-bold text-xl text-red-600 mb-6">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.href}
                    className="font-montserrat text-gray-700 hover:text-red-600 transition-colors flex items-center"
                  >
                    <span className="mr-2 text-red-500">›</span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Campaigns */}
          <div className="col-span-1 lg:col-span-2">
            <h3 className="font-poppins font-bold text-xl text-red-600 mb-6">Initiatives & Campaigns</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campaigns.map((campaign, index) => (
                <div key={index} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-500">
                  <h4 className="font-poppins font-semibold text-gray-800 mb-2">{campaign.title}</h4>
                  <p className="font-montserrat text-gray-600 text-sm mb-2">{campaign.description}</p>
                  <Link
                    href={campaign.link}
                    className="font-poppins text-sm text-red-600 hover:text-red-700 flex items-center"
                  >
                    Learn More
                    <Heart className="ml-1 h-3 w-3" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-12 p-6 bg-white rounded-lg shadow-md border-t-4 border-red-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-1">
              <h3 className="font-poppins font-bold text-xl text-gray-800">Stay Updated</h3>
              <p className="font-montserrat text-gray-600 text-sm">
                Subscribe for travel alerts, events, and cultural highlights from across Jharkhand.
              </p>
            </div>
            <div className="md:col-span-2">
              <form className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="flex-grow px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white font-poppins font-medium py-2 px-6 rounded-md transition-colors duration-200 whitespace-nowrap"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-6 border-t border-red-200 flex flex-col md:flex-row justify-between items-center">
          <p className="font-montserrat text-gray-600 text-sm mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} JharTour. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <Link href="/privacy-policy" className="font-montserrat text-sm text-gray-600 hover:text-red-600">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="font-montserrat text-sm text-gray-600 hover:text-red-600">
              Terms of Service
            </Link>
            <Link href="/sitemap" className="font-montserrat text-sm text-gray-600 hover:text-red-600">
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
