# Empatho

An innovative mobile application designed to provide emotional support and assistance to autistic individuals.

## Features

- Real-time emotion tracking and analysis
- Voice-based interaction
- Emergency support system
- Comprehensive emotion history
- Caregiver integration
- Personalized coping strategies

## Tech Stack

- React Native
- Expo
- Firebase
- TypeScript
- Python (Backend)

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- Python 3.8 or higher (for backend)
- Firebase account

## Setup Instructions

1. **Clone the repository**
```bash
git clone https://github.com/axe3115/empatho.git
cd empatho
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Set up environment variables**
- Copy `.env.example` to `.env`
- Fill in your environment variables:
  ```
  FIREBASE_API_KEY=your_api_key
  FIREBASE_AUTH_DOMAIN=your_auth_domain
  FIREBASE_PROJECT_ID=your_project_id
  FIREBASE_STORAGE_BUCKET=your_storage_bucket
  FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
  FIREBASE_APP_ID=your_app_id
  ```

4. **Set up Firebase configuration**
- Copy `src/firebase/config.template.js` to `src/firebase/config.js`
- Fill in your Firebase configuration details

5. **Set up backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

6. **Start the development servers**
```bash
npm run dev
# or
yarn dev
```

## Security Notes

- Never commit API keys or sensitive information
- Keep your `.env` file secure and never share it
- Use environment variables for all sensitive data
- Follow Firebase security best practices

## Usage

1. Start the Expo development server:
```bash
npm start
# or
yarn start
```

2. Run on iOS/Android:
```bash
npm run ios
# or
npm run android
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

Your Name - your.email@example.com
Project Link: https://github.com/axe3115/empatho #   e m p a t h o 
 
 #   e m p a t h o 
 
 
