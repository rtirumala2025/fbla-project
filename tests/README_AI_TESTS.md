# AI Endpoints Integration Tests

Comprehensive integration tests for all AI endpoints in the Virtual Pet application.

## Overview

This test suite covers:
- **End-to-end flow** from frontend to database
- **Valid inputs, invalid inputs, missing data, and edge cases**
- **Response validation** ensuring JSON conforms to expected structure
- **Test report generation** summarizing pass/fail for each test
- **CI/CD ready** with structured output

## Test Coverage

### AI Chat Endpoint (`/api/ai/chat`)
- ✅ Valid message
- ✅ Empty message (validation error)
- ✅ Missing message field
- ✅ Long message (edge case)
- ✅ Auto-generated session_id
- ✅ Unauthenticated request
- ✅ Chat without pet

### Budget Advisor Endpoint (`/api/budget-advisor/analyze`)
- ✅ Valid transactions
- ✅ Empty transactions list
- ✅ Missing transactions field
- ✅ Invalid amount (negative/zero)
- ✅ Missing category
- ✅ Invalid date format
- ✅ Large dataset (100 transactions)
- ✅ Analysis without monthly budget
- ✅ Unauthenticated request

### Budget Advisor Health Check (`/api/budget-advisor/health`)
- ✅ Health check endpoint

### Coach Endpoint (`/api/coach`)
- ✅ Get coach advice
- ✅ Unauthenticated request

### Pet AI Insights (`/api/pets/ai/insights`)
- ✅ Get AI insights
- ✅ No pet (404 error)

### Pet AI Notifications (`/api/pets/ai/notifications`)
- ✅ Get AI notifications
- ✅ No pet (404 error)

### Pet AI Help (`/api/pets/ai/help`)
- ✅ Get AI help
- ✅ No pet (404 error)

### Pet AI Command (`/api/pets/ai/command`)
- ✅ Parse valid command
- ✅ Empty command (validation error)
- ✅ Missing command field
- ✅ Unauthenticated request

### Pet Interact (`/api/pets/interact`)
- ✅ Feed action
- ✅ Invalid action
- ✅ No pet scenario

## Running the Tests

### Prerequisites

1. Ensure all dependencies are installed:
   ```bash
   pip install -r requirements.txt
   ```

2. Set up test environment variables (if needed):
   ```bash
   export DATABASE_URL="sqlite+aiosqlite:///./tests/test.db"
   export JWT_SECRET="test-secret"
   ```

### Run All AI Endpoint Tests

```bash
pytest tests/test_ai_endpoints_integration.py -v
```

### Run Specific Test Class

```bash
# Test AI Chat endpoint only
pytest tests/test_ai_endpoints_integration.py::TestAIChatEndpoint -v

# Test Budget Advisor endpoint only
pytest tests/test_ai_endpoints_integration.py::TestBudgetAdvisorEndpoint -v

# Test Coach endpoint only
pytest tests/test_ai_endpoints_integration.py::TestCoachEndpoint -v
```

### Run with Coverage

```bash
pytest tests/test_ai_endpoints_integration.py --cov=app/routers --cov=app/services --cov-report=html -v
```

### Run with Detailed Output

```bash
pytest tests/test_ai_endpoints_integration.py -v -s --tb=short
```

## Test Reports

After running the tests, two reports are automatically generated:

### 1. JSON Report (`test_ai_endpoints_report.json`)

Structured JSON report containing:
- Summary statistics (total, passed, failed, success rate)
- Endpoint summary
- Detailed test results with request/response data

**Example:**
```json
{
  "summary": {
    "total_tests": 35,
    "passed": 33,
    "failed": 2,
    "success_rate": "94.3%"
  },
  "endpoint_summary": {
    "/api/ai/chat": {
      "total": 7,
      "passed": 7,
      "failed": 0
    }
  },
  "test_results": [...]
}
```

### 2. Markdown Report (`test_ai_endpoints_report.md`)

Human-readable markdown report with:
- Executive summary
- Endpoint-level summary table
- Detailed test results

## CI/CD Integration

### GitHub Actions Example

```yaml
name: AI Endpoints Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.12'
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
      - name: Run AI endpoint tests
        run: |
          pytest tests/test_ai_endpoints_integration.py -v --tb=short
      - name: Upload test report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: ai-tests-report
          path: |
            test_ai_endpoints_report.json
            test_ai_endpoints_report.md
```

### GitLab CI Example

```yaml
test:ai-endpoints:
  stage: test
  script:
    - pip install -r requirements.txt
    - pytest tests/test_ai_endpoints_integration.py -v --tb=short
  artifacts:
    when: always
    paths:
      - test_ai_endpoints_report.json
      - test_ai_endpoints_report.md
    reports:
      junit: pytest-report.xml
```

## Test Logging

All tests log:
- Request data sent to endpoints
- Response data received
- HTTP status codes
- Errors encountered
- Timestamps

Logs are written to console and included in the test reports for debugging.

## Validation Checks

Each test validates:
1. **HTTP Status Codes** - Expected status codes for success/error scenarios
2. **Response Structure** - All required fields are present
3. **Data Types** - Fields have correct types (string, list, dict, etc.)
4. **Value Constraints** - Values are within expected ranges/enums
5. **JSON Schema Compliance** - Response matches expected Pydantic models

## Troubleshooting

### Common Issues

1. **Database connection errors**
   - Ensure `DATABASE_URL` is set correctly
   - Check that test database exists and is accessible

2. **Authentication errors**
   - Verify `JWT_SECRET` is set
   - Check that test users are created correctly

3. **Import errors**
   - Ensure all dependencies are installed
   - Check Python path includes project root

### Debug Mode

Run tests with maximum verbosity:
```bash
pytest tests/test_ai_endpoints_integration.py -vvv -s --tb=long --log-cli-level=DEBUG
```

## Adding New Tests

To add tests for a new AI endpoint:

1. Create a new test class following the naming convention: `Test<EndpointName>`
2. Add test methods with descriptive names: `test_<scenario>`
3. Use helper functions: `create_test_user_and_pet()`, `auth_headers()`, `cleanup_test_data()`
4. Log results using `_log_test_result()`
5. Validate response structure and values

**Example:**
```python
class TestNewAIEndpoint:
    """Tests for /api/new-ai-endpoint."""
    
    ENDPOINT = "/api/new-ai-endpoint"
    
    @pytest.mark.asyncio
    async def test_valid_request(self, client: AsyncClient, db_session: AsyncSession):
        user, pet = await create_test_user_and_pet(db_session)
        headers = auth_headers(user.id)
        
        request_data = {"key": "value"}
        
        try:
            response = await client.post(self.ENDPOINT, json=request_data, headers=headers)
            response_data = response.json()
            
            assert response.status_code == 200
            assert "expected_field" in response_data
            
            _log_test_result(
                self.ENDPOINT,
                "test_valid_request",
                True,
                response.status_code,
                response_data,
                request_data=request_data,
            )
        finally:
            await cleanup_test_data(db_session, user, pet)
```

## Test Statistics

Expected test count: **~35 tests** covering all AI endpoints

Test execution time: **~10-30 seconds** (depending on database and network latency)

## Maintenance

- Review and update tests when endpoint schemas change
- Add edge cases as they are discovered
- Update validation logic when response structures evolve
- Keep test data cleanup thorough to avoid database pollution

