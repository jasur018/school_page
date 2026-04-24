# Ar-Roshidoniy School Portal

A modern, multilingual school management and student portal platform built with React and TypeScript.

## 📋 About

Ar-Roshidoniy School Portal is a comprehensive web application designed to streamline school operations and student engagement. It provides a professional landing page for the school, an application system for prospective students, and dedicated dashboards for both administrators and enrolled students.

### Key Features

- **Landing Page**: Eye-catching hero section showcasing the school's achievements, subjects offered, and key information
- **Student Application System**: Streamlined application form for prospective students
- **Authentication & Authorization**: Secure login system with role-based access (admin and student roles)
- **Admin Dashboard**: Comprehensive tools for managing school operations and communications
- **Student Dashboard**: Personalized space for students to access their information and resources
- **Messaging System**: Direct communication channel between administrators and students
- **Multilingual Support**: Support for multiple languages with seamless language switching
- **Responsive Design**: Fully responsive interface optimized for desktop, tablet, and mobile devices

## 🛠️ Built With

### Frontend Technologies
- **React 18.3** - UI library for building interactive components
- **TypeScript 5.5** - Type-safe JavaScript for better code quality
- **React Router DOM 6.30** - Client-side routing and navigation
- **Vite 5.4** - Fast build tool and development server
- **Tailwind CSS 3.4** - Utility-first CSS framework for styling
- **PostCSS & Autoprefixer** - CSS processing and vendor prefixing
- **Lucide React** - Beautiful, consistent icon library

### Backend & Database
- **Supabase** - PostgreSQL database and authentication backend
- **PLpgSQL** - Server-side database procedures and logic

### Development Tools
- **ESLint 9.9** - Code quality and linting
- **TypeScript ESLint** - TypeScript-specific linting rules
- **React Hooks ESLint Plugin** - React best practices enforcement

## 🚀 Use Cases

This platform is ideal for:
- **Schools & Educational Institutions**: Manage student applications and communications
- **Administrative Offices**: Streamline school operations and staff-to-student communication
- **Student Portals**: Provide students with personalized access to school information
- **Admissions**: Process and manage student applications efficiently
- **International Schools**: Support multilingual environments with built-in language switching
- **Staff Management**: Separate admin and student interfaces for controlled access

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

### Getting Started

1. Clone the repository:
```bash
git clone https://github.com/jasur018/school_page.git
cd school_page
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

## 📜 Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the project for production
- `npm run lint` - Run ESLint to check code quality
- `npm run preview` - Preview the production build locally
- `npm run typecheck` - Run TypeScript type checking

## 🏗️ Project Structure

```
src/
├── pages/           # Page components (Landing, Login, Dashboards, Messages)
├── components/      # Reusable UI components (Header, Footer, Hero, etc.)
├── context/         # React context for global state (Language support)
├── App.tsx          # Main application component with routing
└── index.css        # Global styles
```

## 🔐 Authentication & Roles

The application implements role-based access control with two user types:
- **Admin**: Full access to administrative dashboard for managing school operations
- **Student**: Access to personal dashboard and messaging features

## 🌍 Multilingual Support

The application includes built-in support for multiple languages through a `LanguageContext`, allowing for seamless language switching without page reloads.

## 📱 Responsive & Accessible

- Mobile-first responsive design using Tailwind CSS
- Clean, intuitive user interface
- Accessibility considerations for diverse users

## 📄 License

This project is open source. Check the repository for license details.

## 👤 Author

Created by [jasur018](https://github.com/jasur018)

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests to help improve the project.

---

**Last Updated**: April 2026
