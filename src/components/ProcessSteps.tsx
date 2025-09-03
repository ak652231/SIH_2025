"use client"
import type React from "react"
import { Montserrat, Poppins } from "next/font/google"
import { Fingerprint, Search, Bell } from "lucide-react"

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

const ProcessSteps: React.FC = () => {
  const steps = [
    {
      icon: <Fingerprint className="h-10 w-10 text-white" />,
      title: "Register Missing Person",
      description:
        "Register a missing person with Aadhaar-based identity verification for secure and accurate identification.",
      number: "1",
    },
    {
      icon: <Search className="h-10 w-10 text-white" />,
      title: "AI-Powered Search",
      description: "Our AI-powered facial recognition technology scans existing databases for potential matches.",
      number: "2",
    },
    {
      icon: <Bell className="h-10 w-10 text-white" />,
      title: "Coordinate & Get Updates",
      description: "Receive real-time updates and coordinate with police & NGOs through our unified platform.",
      number: "3",
    },
  ]

  return (
    <section className={`process relative w-full py-20 px-8 bg-slate-50 ${montserrat.variable} ${poppins.variable}`}>
      <h2 className="text-center font-poppins text-3xl font-bold text-red-600 mb-20 tracking-tight">
        <span className="relative inline-block after:content-[''] after:absolute after:w-16 after:h-1 after:bg-red-500 after:bottom-[-10px] after:left-1/2 after:transform after:-translate-x-1/2">
          HOW IT WORKS
        </span>
      </h2>

      <div className="max-w-6xl mx-auto">
        {/* Timeline for larger screens */}
        <div className="hidden md:block relative">
          {/* Horizontal line */}
          <div className="absolute top-24 left-0 right-0 h-1 bg-red-500" style={{ width: "100%" }}></div>

          {/* Steps */}
          <div className="grid grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative flex flex-col items-center">
                {/* Circle with number */}
                <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center mb-8 z-10 shadow-lg transform transition-transform hover:scale-110">
                  {step.icon}
                </div>

                {/* Step number badge */}
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-8 h-8 rounded-full bg-white border-2 border-red-600 flex items-center justify-center font-poppins font-bold text-red-600 z-20">
                  {step.number}
                </div>

                {/* Content */}
                <div className="text-center mt-6 bg-white rounded-lg shadow-md p-6 border-t-4 border-red-500 w-full">
                  <h3 className="font-poppins font-bold text-xl text-red-600 mb-3">{step.title}</h3>
                  <p className="font-montserrat text-gray-700 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vertical timeline for mobile */}
        <div className="md:hidden">
          {steps.map((step, index) => (
            <div key={index} className="relative mb-16 pl-12">
              {/* Vertical line */}
              {index < steps.length - 1 && (
                <div className="absolute top-16 left-8 w-1 bg-red-500" style={{ height: "calc(100% + 2rem)" }}></div>
              )}

              {/* Circle with icon */}
              <div className="absolute left-0 top-0 w-16 h-16 rounded-full bg-red-600 flex items-center justify-center z-10 shadow-lg">
                {step.icon}
              </div>

              {/* Step number badge */}
              <div className="absolute top-0 left-10 -mt-2 w-8 h-8 rounded-full bg-white border-2 border-red-600 flex items-center justify-center font-poppins font-bold text-red-600 z-20">
                {step.number}
              </div>

              {/* Content */}
              <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-red-500">
                <h3 className="font-poppins font-bold text-xl text-red-600 mb-3">{step.title}</h3>
                <p className="font-montserrat text-gray-700 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="text-center mt-16">
          <button className="bg-red-600 hover:bg-red-700 text-white font-poppins font-medium py-3 px-8 rounded-md transition-colors duration-200 text-base shadow-md">
            Report a Missing Person
          </button>
        </div>
      </div>
    </section>
  )
}

export default ProcessSteps

