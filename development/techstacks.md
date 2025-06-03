# Project Technology Stack

This document provides a comprehensive overview of the technology stacks utilized in this project.

## Frontend

The frontend is built using a modern, reactive stack focused on performance and developer experience.

-   **Core Framework:** React (v19.0.0) with Vite (v6.3.1) for fast development and optimized builds.
-   **Styling:** Tailwind CSS (v3.3.5) for utility-first CSS.
-   **Routing:** React Router DOM (v7.5.3) for client-side navigation.
-   **UI Components & Utilities:**
    *   Headless UI (v2.2.2) for accessible, unstyled UI components.
    *   Lucide React (v0.508.0) for icons.
    *   Date FNS (v4.1.0) for date utilities.
    *   React Datepicker (v8.3.0) for calendar functionalities.
-   **Image Handling:**
    *   Cropper.js (v2.0.0) & React Cropper (v2.3.3) for image cropping.
    *   React Easy Crop (v5.4.1) for a simpler image cropping component.
-   **Data Handling:**
    *   React CSV (v2.2.2) for CSV generation.
-   **Development & Linting:**
    *   TypeScript (~v5.7.2) for static typing.
    *   ESLint (v9.22.0) for code linting.

## Backend

The backend is built with Node.js and Express, focusing on robustness and scalability.

-   **Core Framework:** Node.js with Express.js (v4.18.2) for building the RESTful API.
-   **Authentication:**
    *   Passport.js (v0.6.0) for authentication strategies.
        *   `passport-local` (v1.0.0)
        *   `passport-google-oauth20` (v2.0.0)
        *   `passport-facebook` (v3.0.0)
    *   JSON Web Token (jsonwebtoken v9.0.0) for secure session management.
    *   Bcrypt.js (v2.4.3) for password hashing.
    *   Express Session (v1.18.1) for session management.
-   **Database:**
    *   PostgreSQL (pg v8.10.0) as the primary relational database.
-   **File Handling & Media:**
    *   Cloudinary (v2.6.0) for cloud-based image and video management.
    *   Multer (v1.4.5-lts.2) for handling `multipart/form-data` (file uploads).
    *   Archiver (v7.0.1) for creating zip archives.
-   **Utilities:**
    *   Nodemailer (v7.0.0) for sending emails.
    *   CORS (v2.8.5) for enabling Cross-Origin Resource Sharing.
    *   Dotenv (v16.0.3) for managing environment variables.
-   **Development:**
    *   Nodemon (v2.0.22) for automatic server restarts during development.

## Deployment

The application is deployed using a combination of services optimized for frontend, backend, and database hosting.

-   **Frontend Hosting:** Vercel
-   **Backend Hosting:** Railway
-   **Database Provider:** Neon (PostgreSQL)

## Dev Tools & Practices

-   **Version Control:** Git & GitHub
-   **Package Management:** npm
-   **Code Formatting:** Prettier (implicitly via ESLint configurations or editor integrations)
-   **Testing:** (Please specify testing frameworks if any, e.g., Jest, React Testing Library)

