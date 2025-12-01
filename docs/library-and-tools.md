# Library and Tools Reference

This document provides a comprehensive reference of all libraries, tools, and their versions used in the Virtual Pet FBLA Project.

## Frontend Libraries

### Core Framework
| Library | Version | Purpose |
|---------|---------|---------|
| react | ^18.2.0 | UI framework |
| react-dom | ^18.2.0 | React DOM renderer |
| typescript | ^4.9.5 | Type-safe JavaScript |

### Routing
| Library | Version | Purpose |
|---------|---------|---------|
| react-router-dom | ^6.18.0 | Client-side routing |

### UI & Animation
| Library | Version | Purpose |
|---------|---------|---------|
| framer-motion | ^10.16.4 | Animation library |
| lucide-react | ^0.546.0 | Icon library |
| react-icons | ^4.12.0 | Popular icon sets |
| canvas-confetti | ^1.9.3 | Confetti effects |

### State Management
| Library | Version | Purpose |
|---------|---------|---------|
| zustand | ^4.4.7 | State management |

### Data Visualization
| Library | Version | Purpose |
|---------|---------|---------|
| recharts | ^2.15.4 | Charting library |

### 3D Graphics
| Library | Version | Purpose |
|---------|---------|---------|
| three | ^0.181.2 | 3D graphics |
| @react-three/fiber | ^8.18.0 | React renderer for Three.js |
| @react-three/drei | ^9.122.0 | Three.js helpers |

### Backend Integration
| Library | Version | Purpose |
|---------|---------|---------|
| @supabase/supabase-js | ^2.76.1 | Supabase client |
| axios | ^1.6.2 | HTTP client |

### Utilities
| Library | Version | Purpose |
|---------|---------|---------|
| dayjs | ^1.11.18 | Date manipulation |
| classnames | ^2.5.1 | Conditional className utility |
| ajv | ^6.12.6 | JSON schema validation |
| ajv-keywords | ^3.5.2 | Additional AJV keywords |

### Notifications
| Library | Version | Purpose |
|---------|---------|---------|
| react-hot-toast | ^2.6.0 | Toast notifications |
| react-toastify | ^10.0.4 | Toast notifications |

### Development Tools
| Library | Version | Purpose |
|---------|---------|---------|
| react-scripts | 5.0.1 | Build tooling |
| @testing-library/react | ^13.4.0 | Component testing |
| @testing-library/user-event | ^13.5.0 | User interaction simulation |
| @testing-library/jest-dom | ^5.17.0 | Jest DOM matchers |
| jest-axe | ^9.0.0 | Accessibility testing |
| playwright | ^1.56.1 | E2E testing |
| @playwright/test | ^1.56.1 | Playwright test framework |
| web-vitals | ^2.1.4 | Performance metrics |

### Type Definitions
| Library | Version | Purpose |
|---------|---------|---------|
| @types/node | ^20.10.5 | Node.js types |
| @types/react | ^18.2.42 | React types |
| @types/react-dom | ^18.2.18 | React DOM types |
| @types/canvas-confetti | ^1.6.4 | canvas-confetti types |
| @types/classnames | ^2.3.4 | classnames types |
| @types/recharts | ^1.8.29 | recharts types |

---

## Backend Libraries

### Web Framework
| Library | Version | Purpose |
|---------|---------|---------|
| fastapi | 0.104.1 | Web framework |
| uvicorn[standard] | 0.24.0.post1 | ASGI server |

### Database & ORM
| Library | Version | Purpose |
|---------|---------|---------|
| SQLAlchemy | 2.0.36 | SQL toolkit and ORM |
| psycopg[binary] | 3.2.12 | PostgreSQL adapter |
| greenlet | 3.2.4 | Lightweight concurrency |

### Data Validation
| Library | Version | Purpose |
|---------|---------|---------|
| pydantic | 1.10.14 | Data validation |

### Authentication
| Library | Version | Purpose |
|---------|---------|---------|
| python-jose[cryptography] | 3.3.0 | JWT implementation |

### HTTP & File Handling
| Library | Version | Purpose |
|---------|---------|---------|
| httpx | 0.25.1 | Async HTTP client |
| python-multipart | 0.0.6 | Multipart form parsing |

### Configuration
| Library | Version | Purpose |
|---------|---------|---------|
| python-dotenv | 1.0.0 | Environment variables |

### Testing
| Library | Version | Purpose |
|---------|---------|---------|
| pytest | 8.3.2 | Testing framework |
| pytest-asyncio | 0.23.7 | Async testing support |
| pytest-cov | 4.1.0 | Coverage plugin |

### Code Quality
| Library | Version | Purpose |
|---------|---------|---------|
| ruff | 0.7.1 | Linter and formatter |

---

## Development Tools

### Node.js Ecosystem
| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 18+ | JavaScript runtime |
| npm | (bundled) | Package manager |

### Python Ecosystem
| Tool | Version | Purpose |
|------|---------|---------|
| Python | 3.12+ | Programming language |
| pip | (bundled) | Package installer |

### Version Control
| Tool | Version | Purpose |
|------|---------|---------|
| Git | Latest | Version control |

### Build Tools
| Tool | Purpose |
|------|---------|
| Vite | Frontend build tool (via React Scripts) |
| ESLint | JavaScript/TypeScript linting |
| Prettier | Code formatting |

---

## External Services & APIs

### Supabase
- **Service**: Backend-as-a-Service
- **Components Used**:
  - PostgreSQL Database
  - Authentication
  - Storage
  - Realtime subscriptions
- **Version**: Latest (managed service)

### OpenRouter (Optional)
- **Service**: AI/LLM API Gateway
- **Purpose**: Unified interface for AI models
- **Version**: Latest (managed service)

---

## Version Management

### Frontend
- Managed via `frontend/package.json`
- Lock file: `frontend/package-lock.json`
- Install: `npm install` (in `frontend/` directory)

### Backend
- Managed via `requirements.txt`
- Install: `pip install -r requirements.txt`

### Version Pinning Strategy
- **Frontend**: Uses semantic versioning with caret (^) for minor/patch updates
- **Backend**: Uses exact versions (==) for stability

---

## Compatibility Matrix

### Node.js
- **Minimum**: 18.x
- **Recommended**: 18.x or 20.x LTS

### Python
- **Minimum**: 3.12
- **Recommended**: 3.12+

### Browser Support
- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari, Chrome Mobile

---

## Update Policy

### Regular Updates
- Security patches: Apply immediately
- Minor updates: Monthly review
- Major updates: Quarterly review with testing

### Breaking Changes
- Document all breaking changes
- Provide migration guides
- Maintain backward compatibility when possible

---

## Installation Commands

### Frontend
```bash
cd frontend
npm install
```

### Backend
```bash
pip install -r requirements.txt
```

### Development Dependencies
All development dependencies are included in the main dependency files.

---

## Tool Configuration Files

### Frontend
- `frontend/package.json` - Dependencies and scripts
- `frontend/tsconfig.json` - TypeScript configuration
- `frontend/tailwind.config.js` - Tailwind CSS configuration

### Backend
- `requirements.txt` - Python dependencies
- `.coveragerc` - Test coverage configuration
- `pyproject.toml` or `setup.cfg` - Python project configuration (if present)

---

*Last Updated: 2025-01-27*  
*Generated from package.json and requirements.txt*
