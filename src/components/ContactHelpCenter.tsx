"use client"
import { Phone, Mail, MessageSquare, HelpCircle, ExternalLink } from "lucide-react"
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

const ContactHelpCenter = () => {
  const faqs = [
    {
      question: "How do I generate an AI-based itinerary?",
      answer:
        "Go to the Plan page and answer a few questions about your interests, dates, and budget. Our AI will suggest a personalized itinerary with destinations, stays, and travel routes across Jharkhand.",
    },
    {
      question: "Can I book verified guides and homestays?",
      answer:
        "Yes. JharTour uses blockchain-backed verification and digital certificates for guides and local stays. Look for the Verified badge on provider profiles before booking.",
    },
    {
      question: "Do you support multiple languages?",
      answer:
        "The chatbot supports multilingual assistance. You can ask questions in your preferred language to discover destinations, transport options, and cultural activities.",
    },
    {
      question: "How do I view AR/VR previews of sites?",
      answer:
        "On destination pages, select the AR/VR preview option to explore landmarks like Netarhat, Betla National Park, and Hundru Falls before you visit.",
    },
  ]

  const helplines = [
    {
      title: "Tourism Helpline (24/7)",
      contact: "1800-XXX-XXXX",
      icon: <Phone className="h-5 w-5 text-white" />,
    },
    {
      title: "Email Support",
      contact: "support@jhartour.org",
      icon: <Mail className="h-5 w-5 text-white" />,
    },
    {
      title: "Live Chat",
      contact: "Available 9 AM - 9 PM",
      icon: <MessageSquare className="h-5 w-5 text-white" />,
    },
  ]

  return (
    <section className={`w-full py-20 px-8 bg-[#FFECEC] ${montserrat.variable} ${poppins.variable}`}>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-center font-poppins text-3xl font-bold text-black mb-20 tracking-tight">
          <span className="relative inline-block after:content-[''] after:absolute after:w-16 after:h-1 after:bg-black after:bottom-[-10px] after:left-1/2 after:transform after:-translate-x-1/2">
            CONTACT & HELP CENTER
          </span>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* FAQs */}
          <div className="bg-white rounded-lg shadow-lg p-8 border-t-4 border-red-500">
            <div className="flex items-center mb-6">
              <HelpCircle className="h-8 w-8 text-red-600 mr-3" />
              <h3 className="font-poppins font-bold text-2xl text-gray-800">Frequently Asked Questions</h3>
            </div>

            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                  <h4 className="font-poppins font-semibold text-lg text-red-600 mb-2">{faq.question}</h4>
                  <p className="font-montserrat text-gray-700 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <Link
                href="#"
                className="inline-flex items-center font-poppins text-red-600 hover:text-red-700 font-medium"
              >
                View all FAQs
                <ExternalLink className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Helplines + Contact Form */}
          <div className="flex flex-col">
            <div className="bg-white rounded-lg shadow-lg p-8 border-t-4 border-red-500 mb-8">
              <h3 className="font-poppins font-bold text-2xl text-gray-800 mb-6">Contact Helplines</h3>

              <div className="space-y-6">
                {helplines.map((helpline, index) => (
                  <div
                    key={index}
                    className="flex items-center p-4 bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <div className="p-3 bg-red-700 rounded-full shadow-md mr-4">{helpline.icon}</div>
                    <div>
                      <h4 className="font-poppins font-semibold text-white">{helpline.title}</h4>
                      <p className="font-montserrat text-white/90 font-medium">{helpline.contact}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-lg shadow-lg p-8 border-t-4 border-red-500">
              <h3 className="font-poppins font-bold text-2xl text-gray-800 mb-6">Send Us a Message</h3>

              <form className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-poppins text-sm font-medium text-gray-700 mb-1">Your Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div>
                    <label className="block font-poppins text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-poppins text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Enter subject"
                  />
                </div>
                <div>
                  <label className="block font-poppins text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="How can we help you?"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-poppins font-medium py-3 px-6 rounded-md transition-colors duration-200 shadow-md"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ContactHelpCenter
