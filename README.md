# Planning Poker App

A real-time collaborative Planning Poker application built with React, TypeScript, and WebSocket technology. Teams can estimate story points together in an interactive and engaging way.

## 🚀 Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd planning-poker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the application**
   ```bash
   npm run dev
   ```

This single command starts both the client (React app) and server (WebSocket server) simultaneously. The app will be available at `http://localhost:5173`.

### Available Scripts

- `npm run dev` - Start both client and server in development mode
- `npm run build` - Build the application for production
- `npm run lint` - Run ESLint to check code quality
- `npm run preview` - Preview the production build locally

## 📋 How It Works

Planning Poker is a collaborative estimation technique used in agile software development. Team members privately vote on the effort required for user stories, then reveal their votes simultaneously to discuss and reach consensus.

### Application Flow

1. **Create or Join Room**: One team member creates a room and shares the room ID with others
2. **Vote Privately**: Each participant selects their estimate without seeing others' votes
3. **Reveal Votes**: When everyone has voted, votes are revealed simultaneously
4. **Discuss & Retry**: Team discusses differences and can reset votes for another round

## 🎯 User Guide

### Creating a Room

1. Open the application in your browser
2. Enter your name in the "Your Name" field
3. Click "Create New Room"
4. Share the generated Room ID with your team members
5. Wait for team members to join before starting estimation

### Joining an Existing Room

1. Get the Room ID from the person who created the room
2. Enter your name in the "Your Name" field
3. Enter the Room ID in the "Room ID" field
4. Click "Join Room"
5. You'll be taken to the estimation room with other participants

### Participating in Estimation

1. **Select Your Vote**: Choose a card value that represents your estimate
2. **Wait for Others**: Your vote is private until everyone has voted
3. **View Results**: Once all participants vote, results are automatically revealed
4. **Discuss**: Talk through any significant differences in estimates
5. **Reset if Needed**: Use "Reset Votes" to start a new round of voting
6. **Leave Room**: Click "Leave Room" when the session is complete

### Available Card Values

The app provides standard Planning Poker card values:
- **0, 1, 2, 3, 5, 8, 13, 21**: Fibonacci sequence for story point estimation
- **?**: For when you're unsure or need more information
- **☕**: For when you need a break

## 🔧 Technical Features

- **Real-time Synchronization**: All participants see updates instantly
- **Session Persistence**: Rejoin rooms after page refresh or connection loss
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **WebSocket Communication**: Fast, reliable real-time communication
- **Clean UI**: Simple, distraction-free interface focused on the task

## 🛠️ Development

Built with modern web technologies:
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js WebSocket server
- **Build Tool**: Vite for fast development and building

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
