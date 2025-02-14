# AI Research Assistant

An AI-powered research tool that generates comprehensive reports through interactive Q&A. The assistant asks follow-up questions to better understand your research needs and produces detailed markdown reports.

## Features

- 🤖 AI-driven research with follow-up questions
- 📝 Markdown report generation
- 💬 Interactive chat interface
- 🔍 Deep web research capabilities
- 📱 Responsive design

## Prerequisites

- Node.js v20+
- npm or yarn
- OpenAI API key

## Local Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd research-assistant
```

2. Set up the server:
```bash
cd server
npm install
cp .env.example .env    # Create .env file
```

Edit `.env` file and add your OpenAI API key:
```env
OPENAI_API_KEY=your_key_here
PORT=3001
```

3. Set up the client:
```bash
cd ../client
npm install
cp .env.example .env    # Create .env file
```

The client `.env` should contain:
```env
VITE_API_URL=http://localhost:3001
```

## Running Locally

### Option 1: Run both apps with one command
```bash
# Install dependencies for both apps
npm run install-all

# Start both client and server
npm run dev
```

### Option 2: Run separately
1. Start the server:
```bash
cd server
npm run server
```

2. In a new terminal, start the client:
```bash
cd client
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Using Docker

If you prefer using Docker:

```bash
docker-compose up --build
```

Access the application at http://localhost:80

## How to Use

1. Enter your research query in the chat input
2. The AI will ask follow-up questions to understand your needs
3. Answer each question to help refine the research
4. Review the generated research report
5. Download the report in Markdown format

## Project Structure

```
.
├── client/                 # React frontend
│   ├── src/               # Source code
│   ├── public/            # Static files
│   └── Dockerfile         # Client Docker config
├── server/                # Node.js backend
│   ├── src/              # Source code
│   └── Dockerfile        # Server Docker config
└── docker-compose.yml    # Docker compose config
```

## Environment Variables

### Server
- `OPENAI_API_KEY`: Your OpenAI API key
- `PORT`: Server port (default: 3001)

### Client
- `VITE_API_URL`: Backend API URL

## Troubleshooting

1. If the server fails to start:
   - Check if the OpenAI API key is valid
   - Ensure port 3001 is available

2. If the client fails to connect:
   - Verify the server is running
   - Check VITE_API_URL in client .env

## License

ISC License