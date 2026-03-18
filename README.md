🩺 CareSync

CareSync is a smart caregiver assistant that helps families remotely manage the health of their loved ones. It sends timely reminders for medications, doctor visits, and daily activities, while allowing users to confirm completion with a single tap.

Caregivers receive real-time updates and alerts for missed tasks, ensuring peace of mind even from a distance.

🚀 Features

Medication, appointment, and activity reminders

Simple elderly-friendly interface (large buttons, audio alerts)

One-tap “Done” confirmation

Real-time notifications to caregivers

Offline support with data sync
🛠️ The Tech Stack
Here is the exact technology stack currently powering the application:
Frontend (User Interface):
React 19: The core UI library for building the interfaces.
TypeScript: Adds static typing to JavaScript for fewer bugs and better maintainability.
Tailwind CSS (v4): A utility-first CSS framework used for all the styling, layout, and mobile responsiveness.
Lucide React: The library providing the clean, modern icons used throughout the app.
Date-fns: A lightweight library used for formatting dates and times (e.g., "Mar 18, 2:30 PM").
Backend & Infrastructure:
Firebase Firestore: A real-time, NoSQL cloud database. It handles storing users, tasks, and real-time syncing between the caregiver and the elderly user.
Firebase Authentication: Handles secure user login (currently configured for Google Sign-In).
Firestore Offline Persistence: A built-in Firebase feature that caches data locally so the app still works when the internet drops.
Native Web APIs Used:
Web Speech API: Used for the "Read Aloud" feature to provide voice instructions to elderly users.
Navigator Vibrate API: Used to trigger haptic feedback (vibration) on mobile devices when a task is completed.
Build Tools:
Vite: A blazing-fast frontend build tool and development server.
