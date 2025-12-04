// src/Screens/home.tsx
import React, { useState } from "react";
import Navbar from "../Components/Navbar";

interface HomeProps {
  onNavigate: (screen: "login" | "signup" | "home") => void;
  user: any;
}

const Home: React.FC<HomeProps> = ({ onNavigate, user }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const carParts = [
    {
      id: 1,
      name: "Tire Parts",
      price: "$420.00",
      rating: 4.5,
      reviews: 450,
      image: "🏎️"
    },
    {
      id: 2,
      name: "Body Parts",
      price: "$420.00",
      rating: 4.5,
      reviews: 450,
      image: "🚗"
    },
    {
      id: 3,
      name: "Interior Parts",
      price: "$420.00",
      rating: 4.5,
      reviews: 450,
      image: "🎵"
    },
    {
      id: 4,
      name: "Headlights & Lighting",
      price: "$420.00",
      rating: 4.5,
      reviews: 450,
      image: "💡"
    },
    {
      id: 5,
      name: "Heater Control Valve",
      price: "$420.00",
      rating: 4.5,
      reviews: 450,
      image: "🔧"
    },
    {
      id: 6,
      name: "Brake Discs",
      price: "$420.00",
      rating: 4.5,
      reviews: 450,
      image: "⚙️"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-white mb-4">
                Popular Categories
              </h3>
              <div className="space-y-3">
                {[
                  "Engine Parts",
                  "Transmission",
                  "Suspension",
                  "Brakes",
                  "Electrical",
                  "Body Parts"
                ].map((category, index) => (
                  <a
                    key={index}
                    href="#"
                    className="block text-slate-300 hover:text-red-500 transition duration-300"
                  >
                    {category}
                  </a>
                ))}
              </div>

              <div className="mt-8">
                <button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-md transition duration-300">
                  All Catalog
                </button>
              </div>
            </div>

            {/* New Products Section */}
            <div className="bg-slate-800 p-6 rounded-lg mt-6">
              <h3 className="text-xl font-bold text-white mb-4">
                New Products
              </h3>
              <p className="text-slate-300 mb-4">
                Discover our latest automotive parts with cutting-edge
                technology and premium quality materials.
              </p>
              <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-md font-bold transition duration-300">
                Learn More
              </button>
            </div>
          </div>

          {/* Main Content Area - You can add your product grid here */}
          <div className="lg:col-span-3">
            <div className="bg-slate-800 p-6 rounded-lg">
              <h2 className="text-2xl font-bold text-white mb-6">
                Featured Products
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {carParts.map((part) => (
                  <div
                    key={part.id}
                    className="bg-slate-700 rounded-lg p-4 hover:bg-slate-600 transition duration-300"
                  >
                    <div className="text-4xl text-center mb-4">
                      {part.image}
                    </div>
                    <h3 className="text-white font-semibold mb-2">
                      {part.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-red-400 font-bold text-lg">
                        {part.price}
                      </span>
                      <div className="flex items-center space-x-1">
                        <span className="text-yellow-400">⭐</span>
                        <span className="text-slate-300 text-sm">
                          {part.rating}
                        </span>
                        <span className="text-slate-400 text-sm">
                          ({part.reviews})
                        </span>
                      </div>
                    </div>
                    <button className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white py-2 rounded-md transition duration-300">
                      Add to Cart
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <footer className="bg-slate-800 mt-12 p-8 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-lg font-bold text-white mb-4">AutoNexus</h4>
              <p className="text-slate-400">
                Your trusted partner for premium automotive parts and
                exceptional service.
              </p>
              <div className="flex space-x-4 mt-4">
                <a
                  href="#"
                  className="text-slate-400 hover:text-red-500 transition"
                >
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="text-slate-400 hover:text-red-500 transition"
                >
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="text-slate-400 hover:text-red-500 transition"
                >
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.097.118.112.222.083.343-.09.378-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001 12.017.001z" />
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-bold text-white mb-4">
                Customer Service
              </h4>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <a href="#" className="hover:text-red-500 transition">
                    Customer Dashboard
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-red-500 transition">
                    Check Delivery
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-red-500 transition">
                    Payment Methods
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-red-500 transition">
                    Delivery Details
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-red-500 transition">
                    Complaints
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-bold text-white mb-4">Information</h4>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <a href="#" className="hover:text-red-500 transition">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-red-500 transition">
                    Terms of Use
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-red-500 transition">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-red-500 transition">
                    Cookies
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-red-500 transition">
                    Reviews
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-bold text-white mb-4">
                Contact Info
              </h4>
              <ul className="space-y-2 text-slate-400">
                <li>store@autoplanet.pl</li>
                <li>+880183408301</li>
                <li>Mo-Fr: 9:00 - 18:00</li>
              </ul>
              <div className="mt-4">
                <h5 className="text-white font-medium mb-2">Data Protection</h5>
                <p className="text-sm text-slate-400">
                  We protect your personal data according to GDPR standards.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-700 mt-8 pt-6 text-center">
            <p className="text-slate-400">
              © Copyright 2025 by AutoNexus. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Home;
