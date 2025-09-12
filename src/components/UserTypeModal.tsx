"use client";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

interface UserTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserTypeModal({ isOpen, onClose }: UserTypeModalProps) {
  const router = useRouter();

  const handleTouristClick = () => {
    // Store preference and close modal
    localStorage.setItem("userTypeSelected", "tourist");
    onClose();
  };

  const handleMerchantClick = () => {
    // Store preference and redirect to signup
    localStorage.setItem("userTypeSelected", "merchant");
    router.push("/signup");
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop with blur effect */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 relative border border-gray-100">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>

          {/* Modal content */}
          <div className="p-8 text-center">
            {/* Header */}
            <div className="mb-8">
              <h2 className="font-poppins text-2xl font-bold text-green-800 mb-3">
                Welcome to Our Platform!
              </h2>
              <p className="text-gray-600 font-montserrat">
                Please select your role to get the best experience
              </p>
            </div>

            {/* Buttons */}
            <div className="space-y-4">
              <button
                onClick={handleTouristClick}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-poppins font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                I'm a Tourist
                <p className="text-sm font-normal mt-1 opacity-90">
                  Explore destinations and services
                </p>
              </button>

              <button
                onClick={handleMerchantClick}
                className="w-full bg-white border-2 border-green-600 text-green-600 hover:bg-green-50 font-poppins font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                I'm a Merchant/Vendor
                <p className="text-sm font-normal mt-1 opacity-80">
                  Join our platform to offer services
                </p>
              </button>
            </div>

            {/* Footer text */}
            <p className="text-xs text-gray-500 mt-6 font-montserrat">
              You can change this selection anytime in your profile settings
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
