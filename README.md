# AI-MCP-Bio Platform

A fullstack application with frontend and backend running in separate Docker containers. The platform bridges artificial intelligence with specialized bioinformatics tools through a secure Model Context Protocol framework.

## Features

- **Modern Frontend**: React-inspired landing page with authentication modals
- **Secure Backend**: Node.js/Express API with JWT authentication and SQLite database
- **Docker Containerized**: Separate containers for frontend and backend
- **User Authentication**: Email-based registration and login system
- **Responsive Design**: Mobile-first design with modern UI/UX
- **Production Ready**: Optimized for VPS deployment

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Ports 8000 and 8001 available

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AI-MCP-Bio
   ```

2. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your secure JWT secret
   ```

3. **Build and run the containers**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:8000
   - Backend API: http://localhost:8001

### Production Deployment

For production deployment on a VPS:

1. **Set up environment variables**
   ```bash
   # Generate a secure JWT secret
   openssl rand -base64 32
   # Add this to your .env file
   ```

2. **Build and deploy**
   ```bash
   docker-compose -f docker-compose.yml up -d --build
   ```

3. **Configure reverse proxy** (optional)
   Set up nginx or another reverse proxy to handle SSL and domain routing.

## Architecture

### Frontend (Port 8000)
- **Technology**: Vanilla HTML/CSS/JavaScript
- **Container**: Nginx Alpine
- **Features**: 
  - Responsive design
  - Authentication modals
  - JWT token management
  - Modern UI with animations

### Backend (Port 8001)
- **Technology**: Node.js/Express
- **Database**: SQLite
- **Container**: Node.js Alpine
- **Features**:
  - JWT authentication
  - Password hashing (bcrypt)
  - Rate limiting
  - Input validation
  - Security headers

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (protected)
- `POST /api/auth/logout` - User logout

### System
- `GET /health` - Health check
- `GET /api/protected` - Protected route example

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_SECRET` | Secret key for JWT tokens | `your-super-secret-jwt-key-change-this-in-production` |
| `NODE_ENV` | Node environment | `production` |
| `PORT` | Backend server port | `3001` |
| `DB_PATH` | SQLite database path | `/app/data/database.sqlite` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:8000` |

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Server-side validation with express-validator
- **Security Headers**: Helmet.js for security headers
- **CORS Protection**: Configured CORS policy
- **SQL Injection Protection**: Parameterized queries

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    is_active BOOLEAN DEFAULT 1
);
```

## Development

### Adding New Features

1. **Backend**: Add routes in `backend/server.js`
2. **Frontend**: Add functionality in `frontend/` files
3. **Database**: Modify schema in `backend/server.js`

### Testing

```bash
# Test backend health
curl http://localhost:8001/health

# Test frontend
curl http://localhost:8000
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 8000 and 8001 are available
2. **Docker issues**: Try `docker-compose down` and rebuild
3. **Authentication issues**: Check JWT_SECRET is set correctly
4. **Database issues**: Check volume permissions and SQLite file access

### Logs

```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions, please create an issue in the repository or contact the development team.