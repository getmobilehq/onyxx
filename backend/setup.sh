#!/bin/bash

echo "🚀 Setting up Onyx Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if PostgreSQL is accessible
echo "📋 Checking database connection..."
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL CLI not found. Make sure PostgreSQL is installed."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📄 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please update the .env file with your database credentials"
    echo "   Your DATABASE_URL is already configured: postgresql://jojo:Montg0m3r!@localhost:5432/onyx"
fi

# Build the project
echo "🔨 Building TypeScript..."
npm run build

# Run migrations
echo "🗃️  Running database migrations..."
npm run migrate

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Setup completed successfully!"
    echo ""
    echo "Default admin user created:"
    echo "   Email: admin@onyx.com"
    echo "   Password: admin123"
    echo ""
    echo "To start the development server:"
    echo "   npm run dev"
    echo ""
    echo "The API will be available at: http://localhost:5000"
else
    echo "❌ Migration failed. Please check your database connection."
    echo "   Make sure PostgreSQL is running and accessible at:"
    echo "   postgresql://jojo:Montg0m3r!@localhost:5432/onyx"
fi