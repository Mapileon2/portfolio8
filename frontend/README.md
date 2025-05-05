# Portfolio CMS with Firebase Backend

A beautiful Ghibli-inspired portfolio website with a Firebase backend for easy content management.

## Features

- 🔥 Firebase Authentication for secure admin access
- 📝 Full CRUD operations for all portfolio sections
- 🖼️ Rich text editor for content management
- 📊 Analytics dashboard integration
- 🔄 Social media integration
- 📱 Mobile-responsive design
- 🌓 Dark/Light mode switch

## Setup Instructions

### Prerequisites

- Node.js and npm installed
- Firebase account
- Firebase CLI installed (`npm install -g firebase-tools`)

### Getting Started

1. Clone the repository
2. Navigate to the project directory

```bash
cd portfolio-cms
```

3. Install dependencies

```bash
npm install
```

4. Create a Firebase project at [firebase.google.com](https://firebase.google.com)

5. Initialize Firebase in your project

```bash
firebase login
firebase init
```

6. Update the Firebase configuration

Open `firebase-config.js` and update with your own Firebase project credentials:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

7. Create an admin user for the CMS

In Firebase Console:
- Go to Authentication
- Set up Email/Password authentication
- Add a new user with email and password

8. Start the development server

```bash
npm start
```

9. Access the admin panel at `/admin.html`

## Deployment

Deploy to Firebase Hosting:

```bash
npm run deploy
```

## Customization

### Content Management

Access the admin panel at `/admin.html` to manage:

- About section
- Skills
- Timeline/Journey
- Projects
- Testimonials
- Contact information
- Case studies
- Site settings

### Styling

The site uses Tailwind CSS for styling. You can customize colors, fonts, and other elements in the CSS sections of each HTML file.

## License

MIT
