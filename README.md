# Zenova
### Study Smarter, Not Harder.

[![AI Studio](https://img.shields.io/badge/AI%20Studio-Live%20App-blue?style=for-the-badge&logo=google-cloud)](https://ai.studio/apps/58cb4cdf-c76f-4f7e-ab95-d734e4d8f4b5)
</div>

---

## 💡 Overview

**Zenova** is a comprehensive, AI-powered productivity ecosystem specifically engineered for the modern student. By integrating advanced artificial intelligence with essential study tools, Zenova aims to eliminate procrastination, streamline academic workflows, and enhance the overall learning experience. 

Whether you are breaking down complex theoretical concepts, managing tight deadlines, or seeking a focused environment for deep work, Zenova provides the intelligent infrastructure necessary for academic excellence.

## ✨ Key Features

### 🤖 Intelligent AI Assistant
Beyond a standard chatbot, Zenova’s assistant is a context-aware academic partner.
* **Concept Simplification**: Converts dense academic topics into accessible explanations.
* **Contextual Awareness**: The AI understands your current workload by integrating directly with your planner tasks.
* **Rich Media Support**: Supports LaTeX for mathematical notation, GFM for structured tables, and file attachments for document analysis.
* **Instant Assessment**: Generate practice quizzes on demand to test your comprehension.

### 📅 Smart Task Planner
An optimized organization system that transforms your "To-Do" list into a strategic roadmap.
* **AI Scheduling**: Leverages intelligence to suggest optimized study schedules based on your assignments.
* **Deadline Management**: Keep track of upcoming projects and academic milestones with a clean, intuitive interface.

### ⏱️ Smart Focus (Pomodoro)
A dedicated focus module designed to facilitate deep work.
* **Integrated Timer**: Built-in Pomodoro timer to manage study intervals and breaks.
* **Progress Tracking**: Visual feedback and motivational tracking to help you maintain momentum during long study sessions.

## 🛠️ Technical Stack

Zenova is built with a modern, high-performance stack to ensure a seamless and responsive user experience:

* **Frontend**: [React 19](https://react.dev/) & [Vite](https://vitejs.dev/)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/) with [Typography](https://github.com/tailwindlabs/tailwindcss-typography) and [Framer Motion](https://www.framer.com/motion/) for fluid animations
* **Intelligence**: [Google Gemini Pro API](https://ai.google.dev/)
* **Backend & Auth**: [Firebase](https://firebase.google.com/) (Firestore & Authentication)
* **Data Visualization**: [Recharts](https://recharts.org/)
* **Utilities**: [date-fns](https://date-fns.org/), [Lucide React](https://lucide.dev/), and [React Router 7](https://reactrouter.com/)

## 🚀 Getting Started

### Prerequisites
* **Node.js** (Latest LTS recommended)
* A **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/)

### Local Installation
1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/zenova.git
    cd zenova
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Environment Setup**:
    Create a `.env.local` file in the root directory and add your API key:
    ```env
    VITE_GEMINI_API_KEY=your_api_key_here
    ```
4.  **Launch the development server**:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

## 📖 Usage Guidelines

* **Dashboard**: Your central hub for viewing current focus stats and upcoming tasks.
* **Assistant**: Start a new chat to upload documents or ask questions about your curriculum.
* **Planner**: Add your assignments and tasks; use the AI suggestions to organize your week.
* **Wellness**: Access the Smart Focus timer to begin a productive study session.
<div align="center">
Built to empower students everywhere.
</div>
