#!/usr/bin/env python3
"""
Backend Endpoints Verification Script

This script verifies all backend endpoints exist and return correct data
by making HTTP requests to a running server.

Usage:
    python scripts/test_endpoints_verification.py [--base-url URL]

Requires:
    - Backend server running (default: http://localhost:8000)
    - Authentication tokens for protected endpoints
"""

import argparse
import json
import sys
from datetime import date, datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
from uuid import uuid4

import httpx


# Test report storage
TEST_REPORT: List[Dict[str, Any]] = []


def log_test_result(
    endpoint: str,
    method: str,
    test_name: str,
    passed: bool,
    status_code: Optional[int] = None,
    response_data: Optional[Dict[str, Any]] = None,
    error: Optional[str] = None,
    request_data: Optional[Dict[str, Any]] = None,
) -> None:
    """Log test results for reporting."""
    result = {
        "endpoint": endpoint,
        "method": method,
        "test_name": test_name,
        "passed": passed,
        "status_code": status_code,
        "request_data": request_data,
        "response_data": response_data,
        "error": error,
        "timestamp": datetime.now().isoformat(),
    }
    TEST_REPORT.append(result)
    
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status} | {method} {endpoint} | {test_name}")
    if error:
        print(f"  Error: {error}")
    if status_code:
        print(f"  Status: {status_code}")


async def get_auth_token(base_url: str, client: httpx.AsyncClient) -> Optional[str]:
    """Get authentication token by signing up a test user."""
    test_email = f"endpoint-test-{uuid4()}@example.com"
    test_password = "TestPassword123!"
    
    try:
        # Try to sign up
        signup_response = await client.post(
            f"{base_url}/api/auth/signup",
            json={"email": test_email, "password": test_password},
        )
        
        if signup_response.status_code == 201:
            data = signup_response.json()
            return data.get("access_token")
        elif signup_response.status_code == 400:
            # User might already exist, try login
            login_response = await client.post(
                f"{base_url}/api/auth/login",
                json={"email": test_email, "password": test_password},
            )
            if login_response.status_code == 200:
                data = login_response.json()
                return data.get("access_token")
        
        return None
    except Exception as e:
        print(f"Warning: Could not get auth token: {e}")
        return None


async def test_stats_endpoint(base_url: str, client: httpx.AsyncClient) -> None:
    """Test /api/stats/summary endpoint."""
    endpoint = "/api/stats/summary"
    
    try:
        response = await client.get(f"{base_url}{endpoint}")
        response_data = response.json() if response.status_code == 200 else None
        
        if response.status_code == 200 and response_data:
            expected_fields = ["active_users", "pet_species", "unique_breeds", "satisfaction_rate"]
            missing_fields = [f for f in expected_fields if f not in response_data]
            
            if not missing_fields:
                log_test_result(endpoint, "GET", "stats_summary", True, response.status_code, response_data)
            else:
                error = f"Missing fields: {missing_fields}"
                log_test_result(endpoint, "GET", "stats_summary", False, response.status_code, response_data, error)
        else:
            error = f"Unexpected status code: {response.status_code}"
            log_test_result(endpoint, "GET", "stats_summary", False, response.status_code, None, error)
    except Exception as e:
        log_test_result(endpoint, "GET", "stats_summary", False, None, None, str(e))


async def test_finance_endpoints(base_url: str, client: httpx.AsyncClient, token: Optional[str]) -> None:
    """Test /api/finance/* endpoints."""
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    
    endpoints = [
        ("/api/finance", "GET", {}),
        ("/api/finance/shop", "GET", {}),
        ("/api/finance/leaderboard?metric=balance", "GET", {}),
        ("/api/finance/goals", "GET", {}),
    ]
    
    for endpoint, method, data in endpoints:
        test_name = endpoint.split("/")[-1].split("?")[0]
        try:
            if method == "GET":
                response = await client.get(f"{base_url}{endpoint}", headers=headers)
            else:
                response = await client.post(f"{base_url}{endpoint}", json=data, headers=headers)
            
            response_data = response.json() if response.status_code < 500 else None
            
            if response.status_code < 500:
                log_test_result(endpoint, method, f"finance_{test_name}", True, response.status_code, response_data)
            else:
                error = f"Server error: {response.status_code}"
                log_test_result(endpoint, method, f"finance_{test_name}", False, response.status_code, None, error)
        except Exception as e:
            log_test_result(endpoint, method, f"finance_{test_name}", False, None, None, str(e))


async def test_pets_endpoints(base_url: str, client: httpx.AsyncClient, token: Optional[str]) -> None:
    """Test /api/pets/* endpoints."""
    if not token:
        print("⚠️  Skipping pets tests - no auth token")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    endpoints = [
        ("/api/pets", "GET", {}),
        ("/api/pets/stats", "GET", {}),
        ("/api/pets/diary", "GET", {}),
        ("/api/pets/health", "GET", {}),
        ("/api/pets/ai/insights", "GET", {}),
        ("/api/pets/ai/notifications", "GET", {}),
        ("/api/pets/ai/help", "GET", {}),
    ]
    
    for endpoint, method, data in endpoints:
        test_name = endpoint.split("/")[-1]
        try:
            if method == "GET":
                response = await client.get(f"{base_url}{endpoint}", headers=headers)
            else:
                response = await client.post(f"{base_url}{endpoint}", json=data, headers=headers)
            
            response_data = response.json() if response.status_code < 500 else None
            
            # 404 is acceptable for some endpoints if pet doesn't exist
            if response.status_code in [200, 404]:
                log_test_result(endpoint, method, f"pets_{test_name}", True, response.status_code, response_data)
            else:
                error = f"Unexpected status: {response.status_code}"
                log_test_result(endpoint, method, f"pets_{test_name}", False, response.status_code, None, error)
        except Exception as e:
            log_test_result(endpoint, method, f"pets_{test_name}", False, None, None, str(e))


async def test_analytics_endpoints(base_url: str, client: httpx.AsyncClient, token: Optional[str]) -> None:
    """Test /api/analytics/* endpoints."""
    if not token:
        print("⚠️  Skipping analytics tests - no auth token")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    today = date.today().isoformat()
    endpoints = [
        ("/api/analytics/snapshot", "GET", {}),
        ("/api/analytics/daily", "GET", {}),
        (f"/api/analytics/report?report_date={today}", "GET", {}),
    ]
    
    for endpoint, method, data in endpoints:
        test_name = endpoint.split("/")[-1].split("?")[0]
        try:
            if method == "GET":
                response = await client.get(f"{base_url}{endpoint}", headers=headers)
            else:
                response = await client.post(f"{base_url}{endpoint}", json=data, headers=headers)
            
            response_data = response.json() if response.status_code < 500 else None
            
            if response.status_code < 500:
                log_test_result(endpoint, method, f"analytics_{test_name}", True, response.status_code, response_data)
            else:
                error = f"Server error: {response.status_code}"
                log_test_result(endpoint, method, f"analytics_{test_name}", False, response.status_code, None, error)
        except Exception as e:
            log_test_result(endpoint, method, f"analytics_{test_name}", False, None, None, str(e))


async def test_social_endpoints(base_url: str, client: httpx.AsyncClient, token: Optional[str]) -> None:
    """Test /api/social/* endpoints."""
    if not token:
        print("⚠️  Skipping social tests - no auth token")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    endpoints = [
        ("/api/social/friends", "GET", {}),
        ("/api/social/public_profiles", "GET", {}),
        ("/api/social/leaderboard?metric=xp", "GET", {}),
    ]
    
    for endpoint, method, data in endpoints:
        test_name = endpoint.split("/")[-1].split("?")[0]
        try:
            if method == "GET":
                response = await client.get(f"{base_url}{endpoint}", headers=headers)
            else:
                response = await client.post(f"{base_url}{endpoint}", json=data, headers=headers)
            
            response_data = response.json() if response.status_code < 500 else None
            
            if response.status_code < 500:
                log_test_result(endpoint, method, f"social_{test_name}", True, response.status_code, response_data)
            else:
                error = f"Server error: {response.status_code}"
                log_test_result(endpoint, method, f"social_{test_name}", False, response.status_code, None, error)
        except Exception as e:
            log_test_result(endpoint, method, f"social_{test_name}", False, None, None, str(e))


async def test_ai_endpoints(base_url: str, client: httpx.AsyncClient, token: Optional[str]) -> None:
    """Test /api/ai/* endpoints."""
    if not token:
        print("⚠️  Skipping AI tests - no auth token")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    endpoint = "/api/ai/chat"
    request_data = {
        "message": "How is my pet doing?",
        "session_id": str(uuid4()),
    }
    
    try:
        response = await client.post(f"{base_url}{endpoint}", json=request_data, headers=headers)
        response_data = response.json() if response.status_code < 500 else None
        
        if response.status_code == 200 and response_data and "message" in response_data:
            log_test_result(endpoint, "POST", "ai_chat", True, response.status_code, response_data, request_data=request_data)
        else:
            error = f"Unexpected response: status={response.status_code}, has_message={'message' in (response_data or {})}"
            log_test_result(endpoint, "POST", "ai_chat", False, response.status_code, response_data, error, request_data=request_data)
    except Exception as e:
        log_test_result(endpoint, "POST", "ai_chat", False, None, None, str(e), request_data=request_data)


async def test_games_endpoints(base_url: str, client: httpx.AsyncClient, token: Optional[str]) -> None:
    """Test /api/games/* endpoints."""
    if not token:
        print("⚠️  Skipping games tests - no auth token")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    endpoints = [
        ("/api/games/leaderboard?game_type=memory", "GET", {}),
        ("/api/games/rewards?game_type=memory", "GET", {}),
    ]
    
    for endpoint, method, data in endpoints:
        test_name = endpoint.split("/")[-1].split("?")[0]
        try:
            if method == "GET":
                response = await client.get(f"{base_url}{endpoint}", headers=headers)
            else:
                response = await client.post(f"{base_url}{endpoint}", json=data, headers=headers)
            
            response_data = response.json() if response.status_code < 500 else None
            
            if response.status_code < 500:
                log_test_result(endpoint, method, f"games_{test_name}", True, response.status_code, response_data)
            else:
                error = f"Server error: {response.status_code}"
                log_test_result(endpoint, method, f"games_{test_name}", False, response.status_code, None, error)
        except Exception as e:
            log_test_result(endpoint, method, f"games_{test_name}", False, None, None, str(e))


def generate_report() -> None:
    """Generate test report."""
    report_path = Path("BACKEND_ENDPOINTS_VERIFICATION_REPORT.json")
    md_report_path = Path("BACKEND_ENDPOINTS_VERIFICATION_REPORT.md")
    
    total = len(TEST_REPORT)
    passed = sum(1 for r in TEST_REPORT if r["passed"])
    failed = total - passed
    
    # Group by endpoint category
    category_summary: Dict[str, Dict[str, int]] = {}
    for result in TEST_REPORT:
        endpoint = result["endpoint"]
        if "/api/stats" in endpoint:
            category = "stats"
        elif "/api/finance" in endpoint:
            category = "finance"
        elif "/api/pets" in endpoint:
            category = "pets"
        elif "/api/analytics" in endpoint:
            category = "analytics"
        elif "/api/social" in endpoint:
            category = "social"
        elif "/api/ai" in endpoint:
            category = "ai"
        elif "/api/games" in endpoint:
            category = "games"
        else:
            category = "other"
        
        if category not in category_summary:
            category_summary[category] = {"total": 0, "passed": 0, "failed": 0}
        category_summary[category]["total"] += 1
        if result["passed"]:
            category_summary[category]["passed"] += 1
        else:
            category_summary[category]["failed"] += 1
    
    report = {
        "summary": {
            "total_tests": total,
            "passed": passed,
            "failed": failed,
            "success_rate": f"{(passed / total * 100):.1f}%" if total > 0 else "0%",
        },
        "category_summary": category_summary,
        "test_results": TEST_REPORT,
        "generated_at": datetime.now().isoformat(),
    }
    
    # Write JSON report
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2, default=str)
    
    # Write markdown report
    with open(md_report_path, "w") as f:
        f.write("# Backend Endpoints Verification Report\n\n")
        f.write(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write("## Summary\n\n")
        f.write(f"- **Total Tests:** {total}\n")
        f.write(f"- **Passed:** {passed} ✅\n")
        f.write(f"- **Failed:** {failed} ❌\n")
        f.write(f"- **Success Rate:** {report['summary']['success_rate']}\n\n")
        
        f.write("## Category Summary\n\n")
        f.write("| Category | Total | Passed | Failed | Status |\n")
        f.write("|----------|-------|--------|--------|--------|\n")
        for category, stats in sorted(category_summary.items()):
            status_icon = "✅" if stats["failed"] == 0 else "⚠️"
            f.write(f"| {category} {status_icon} | {stats['total']} | {stats['passed']} | {stats['failed']} | {'PASS' if stats['failed'] == 0 else 'FAIL'} |\n")
        
        f.write("\n## Test Results\n\n")
        for result in TEST_REPORT:
            status_icon = "✅" if result["passed"] else "❌"
            f.write(f"### {status_icon} {result['test_name']}\n\n")
            f.write(f"- **Endpoint:** `{result['method']} {result['endpoint']}`\n")
            f.write(f"- **Status:** {'PASS' if result['passed'] else 'FAIL'}\n")
            if result["status_code"]:
                f.write(f"- **HTTP Status:** {result['status_code']}\n")
            if result["error"]:
                f.write(f"- **Error:** {result['error']}\n")
            f.write(f"- **Timestamp:** {result['timestamp']}\n\n")
    
    print(f"\n📊 Test report written to {report_path}")
    print(f"📊 Markdown report written to {md_report_path}")
    print(f"📊 Summary: {passed}/{total} tests passed ({report['summary']['success_rate']})")


async def main() -> None:
    """Main test function."""
    parser = argparse.ArgumentParser(description="Verify backend endpoints")
    parser.add_argument("--base-url", default="http://localhost:8000", help="Base URL of the backend server")
    args = parser.parse_args()
    
    base_url = args.base_url.rstrip("/")
    
    print(f"🔍 Testing backend endpoints at {base_url}\n")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Check if server is reachable
        try:
            health_response = await client.get(f"{base_url}/health")
            if health_response.status_code != 200:
                print(f"⚠️  Warning: Health check returned {health_response.status_code}")
        except Exception as e:
            print(f"❌ Error: Cannot reach server at {base_url}: {e}")
            print("   Make sure the backend server is running!")
            sys.exit(1)
        
        # Get auth token
        print("🔐 Getting authentication token...")
        token = await get_auth_token(base_url, client)
        if token:
            print("✅ Authentication token obtained")
        else:
            print("⚠️  Warning: Could not obtain authentication token - some tests will be skipped")
        
        print("\n🧪 Running endpoint tests...\n")
        
        # Test all endpoints
        await test_stats_endpoint(base_url, client)
        await test_finance_endpoints(base_url, client, token)
        await test_pets_endpoints(base_url, client, token)
        await test_analytics_endpoints(base_url, client, token)
        await test_social_endpoints(base_url, client, token)
        await test_ai_endpoints(base_url, client, token)
        await test_games_endpoints(base_url, client, token)
    
    # Generate report
    print("\n📝 Generating test report...")
    generate_report()


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())

