# LinkLens

A revolutionary AI-powered LinkedIn profile analysis tool with cutting-edge design and secure API integration.

## 🚀 Features

- **Ultra-Modern UI/UX**: Glassmorphism, neumorphism, and 3D animations
- **AI-Powered Analysis**: Comprehensive LinkedIn profile insights
- **Secure API Integration**: Environment variable-based configuration
- **Voice Input**: Speech-to-text URL input with waveform visualization
- **Neural Network Visualization**: Real-time AI processing animation
- **Biometric Authentication**: Advanced Google Sign-In experience
- **Particle Systems**: Interactive visual effects
- **Responsive Design**: Optimized for all devices

## 🔐 Security Setup

### Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Add your API keys to the `.env` file:
   ```env
   VITE_LINKEDIN_API_KEY=your_linkedin_api_key_here
   VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
   VITE_OPENAI_API_KEY=your_openai_api_key_here
   ```

3. Never commit the `.env` file to version control (it's already in `.gitignore`)

### Required API Keys

- **LinkedIn API Key**: For fetching profile data
- **Google Client ID**: For OAuth authentication
- **OpenAI API Key**: For AI-powered analysis (optional - fallback available)

### Deployment

For production deployment, set environment variables through your platform:

**Vercel:**
```bash
vercel env add VITE_LINKEDIN_API_KEY
```

**Netlify:**
```bash
netlify env:set VITE_LINKEDIN_API_KEY your_key_here
```

**Heroku:**
```bash
heroku config:set VITE_LINKEDIN_API_KEY=your_key_here
```

## 🛠️ Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables (see Security Setup above)

3. Start development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## 🎨 Design Features

- **Glassmorphism**: Multi-layered frosted glass effects
- **3D Tilt Effects**: Mouse-responsive card animations
- **Particle Systems**: Interactive visual feedback
- **Neural Network Visualization**: AI processing animation
- **Voice Input**: Speech-to-text with waveform display
- **Magnetic Hover Effects**: Cursor-responsive interactions
- **Morphing Gradients**: Dynamic background animations
- **Holographic Results**: 3D data visualization

## 🔧 API Integration

The application uses a secure, modular API architecture:

- **LinkedIn API Service**: Profile data fetching
- **AI Analysis Service**: OpenAI-powered insights
- **Configuration Validation**: Startup API key checks
- **Error Handling**: Graceful fallbacks and user feedback

## 📱 Responsive Design

- **Mobile-First**: Optimized for all screen sizes
- **Progressive Disclosure**: Context-aware feature revelation
- **Adaptive Performance**: Device-optimized animations
- **Touch Interactions**: Gesture-based navigation

## 🚀 Performance

- **Lazy Loading**: Component-based code splitting
- **Animation Optimization**: Hardware-accelerated transforms
- **Memory Management**: Efficient particle system cleanup
- **Bundle Optimization**: Tree-shaking and minification

## 🔒 Privacy & Security

- **No Data Storage**: Analysis results are not persisted
- **Secure API Calls**: Environment variable-based authentication
- **HTTPS Only**: Encrypted data transmission
- **Privacy-First**: Minimal data collection

## 📄 License

MIT License - see LICENSE file for details