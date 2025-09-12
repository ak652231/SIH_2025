"use client";

import { Montserrat, Poppins } from "next/font/google";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

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

export default function SignupPage() {
  return (
    <main
      className={`min-h-screen bg-white ${montserrat.variable} ${poppins.variable} font-montserrat`}
    >
      <div className="container mx-auto px-4 py-8">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center text-green-600 hover:text-green-700 font-poppins font-medium mb-8 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Home
        </Link>

        {/* Signup form */}
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="text-center mb-8">
            <h1 className="font-poppins text-3xl font-bold text-green-800 mb-2">
              Merchant Signup
            </h1>
            <p className="text-gray-600 font-montserrat">
              Join our platform and start offering your services
            </p>
          </div>

          <form className="space-y-6">
            <div>
              <label className="block text-sm font-poppins font-medium text-gray-700 mb-2">
                Business Name
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-montserrat"
                placeholder="Enter your business name"
              />
            </div>

            {/* <div>
              <label className="block text-sm font-poppins font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-montserrat"
                placeholder="Enter your email"
              />
            </div> */}

            <div>
              <label className="block text-sm font-poppins font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-montserrat"
                placeholder="Enter your phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-poppins font-medium text-gray-700 mb-2">
                Service Category
              </label>
              <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-montserrat">
                <option value="">Select a category</option>
                <option value="accommodation">Accommodation</option>
                <option value="transportation">Transportation</option>
                <option value="tours">Tours & Activities</option>
                <option value="dining">Dining</option>
                <option value="shopping">Shopping</option>
                <option value="other">Other</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-poppins font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Create Account
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6 font-montserrat">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
