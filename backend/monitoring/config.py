import logging
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration
from sentry_sdk.integrations.logging import LoggingIntegration
from datetime import datetime
import os
from typing import Dict, Any

# Configure logging
def setup_logging():
    log_format = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    
    if os.getenv('ENVIRONMENT') == 'production':
        logging.basicConfig(level=logging.INFO, format=log_format)
    else:
        logging.basicConfig(level=logging.DEBUG, format=log_format)

# Initialize Sentry for error tracking
def init_sentry():
    dsn = os.getenv('SENTRY_DSN')
    if dsn:
        sentry_sdk.init(
            dsn=dsn,
            integrations=[
                FastApiIntegration(),
                StarletteIntegration(),
                LoggingIntegration(level=logging.INFO, event_level=logging.ERROR)
            ],
            traces_sample_rate=1.0,
            environment=os.getenv('ENVIRONMENT', 'development'),
            release=f"pet-ai@{os.getenv('APP_VERSION', '1.0.0')}"
        )

# Track API metrics
class APIMetrics:
    def __init__(self):
        self.requests_total = 0
        self.errors_total = 0
        self.response_times = []
        self.pet_actions = {}

    def record_request(self, path: str, method: str, status_code: int, duration: float):
        self.requests_total += 1
        if status_code >= 400:
            self.errors_total += 1
        
        self.response_times.append(duration)
        
        # Keep only last 1000 samples
        if len(self.response_times) > 1000:
            self.response_times.pop(0)

    def record_pet_action(self, action: str, success: bool):
        if action not in self.pet_actions:
            self.pet_actions[action] = {'total': 0, 'success': 0}
        
        self.pet_actions[action]['total'] += 1
        if success:
            self.pet_actions[action]['success'] += 1

    def get_metrics(self) -> Dict[str, Any]:
        avg_response_time = sum(self.response_times) / len(self.response_times) if self.response_times else 0
        
        return {
            'timestamp': datetime.utcnow().isoformat(),
            'requests_total': self.requests_total,
            'errors_total': self.errors_total,
            'avg_response_time_ms': round(avg_response_time * 1000, 2),
            'error_rate': round((self.errors_total / self.requests_total) * 100, 2) if self.requests_total > 0 else 0,
            'pet_actions': self.pet_actions
        }

# Initialize monitoring
def init_monitoring():
    setup_logging()
    init_sentry()
    return APIMetrics()
